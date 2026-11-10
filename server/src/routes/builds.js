import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { validateBuildData, BALANCE_VERSION } from '../gameData.js'
import { avatarFor } from '../avatars.js'

export const buildsRouter = Router()

const TITLE_MIN = 5
const TITLE_MAX = 30
const TOP_LIMIT = 30 // "Top rated builds" carousel: the best build of each career (30 > number of careers)
const TOP_LIMIT_CAREER = 10 // when a career is selected: its 10 best builds
// ?all=1 (the "see all" window of a carousel): the list without its cap, loaded by pages (?offset=&limit=)
const MODAL_PAGE = 40
const MODAL_PAGE_MAX = 200
const MAX_TEAMMATES = 3 // recommended teammates: 3 other heroes make a team of 4

const id = z.string().min(1).max(60)
const distinct = (g) => new Set(g.propertyIds).size === g.propertyIds.length
const DISTINCT_MSG = 'Properties must be different'

// Structure only. Whether the ids exist / are compatible is checked by validateBuildData().
const gearSchema = z
  .object({
    traitId: id.nullable(),
    propertyIds: z.array(id).max(2),
  })
  .strict()
  .refine(distinct, DISTINCT_MSG)

const weaponSchema = z
  .object({
    weaponId: id.nullable(),
    traitId: id.nullable(),
    propertyIds: z.array(id).max(2),
  })
  .strict()
  .refine(distinct, DISTINCT_MSG)

// A fast breakpoint card: an attack of a type (melee / ranged) and the enemies it kills fast
const breakpointSchema = z
  .object({
    type: id,
    attack: id,
    enemyIds: z.array(id).min(1, 'A breakpoint needs at least one enemy').max(50),
  })
  .strict()

// A recommended teammate: a career of ANOTHER hero (checked in validateBuildData)
const teammateSchema = z.object({ heroId: id, careerId: id }).strict()
const buildSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
  description: z.string().max(2000).default(''),
  heroId: z.string().min(1).max(50),
  careerId: z.string().min(1).max(50),
  data: z
    .object({
      v: z.literal(2),
      balance: z.string().max(20).optional(), // ignored: the server always writes the current version
      talents: z.array(z.number().int().min(0).max(3)).length(6), // 0 = none, 1..3 = position in the tier
      weapons: z.record(id, weaponSchema), // melee / ranged
      equipment: z.record(id, gearSchema), // necklace / charm / trinket
      breakpoints: z.array(breakpointSchema).max(50).default([]), // fast breakpoint cards (optional)
      teammates: z.array(teammateSchema).max(MAX_TEAMMATES).default([]), // recommended teammates (optional)
    })
    .strict(),
})

// Every query built on SELECT must pass `me` (the viewer's user id, 0 for a visitor)
export const SELECT = `
  SELECT b.*, u.username AS author, u.avatar AS author_avatar,
         (SELECT COUNT(*) FROM likes l WHERE l.build_id = b.id) AS like_count,
         EXISTS (SELECT 1 FROM likes l WHERE l.build_id = b.id AND l.user_id = @me) AS liked_by_me,
         EXISTS (SELECT 1 FROM bookmarks k WHERE k.build_id = b.id AND k.user_id = @me) AS bookmarked_by_me,
         (SELECT COUNT(*) FROM comments c WHERE c.build_id = b.id) AS comment_count
  FROM builds b JOIN users u ON u.id = b.user_id
`

export const toBuild = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  heroId: r.hero_id,
  careerId: r.career_id,
  data: JSON.parse(r.data),
  author: r.author,
  authorId: r.user_id,
  authorAvatar: avatarFor(r.user_id, r.author_avatar),
  likeCount: r.like_count,
  likedByMe: !!r.liked_by_me,
  bookmarkedByMe: !!r.bookmarked_by_me, // only about the viewer: the bookmarks of others are never exposed
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  commentCount: r.comment_count,
})

const viewer = (req) => req.userId ?? 0 // user ids start at 1, so 0 matches nobody
const str = (v) => (typeof v === 'string' && v ? v : null)
const findOne = (buildId, req) =>
  db.prepare(`${SELECT} WHERE b.id = @id`).get({ id: buildId, me: viewer(req) })

const LIST_PAGE_SIZE = 20
// Sort orders the client may ask for (?sort=). A whitelist: the value is put in the SQL text.
const SORTS = {
  newest: 'b.created_at DESC, b.id DESC',
  oldest: 'b.created_at ASC, b.id ASC',
  likes: 'like_count DESC, b.created_at DESC, b.id DESC',
}
// Filter "builds that use this weapon" (in either weapon slot). Needs @weapon (NULL = no filter).
// Used by the three lists that follow the hero / career filters (here, /builds/top, /me/following/builds).
export const WEAPON_SQL = `(@weapon IS NULL
    OR json_extract(b.data, '$.weapons.melee.weaponId')  = @weapon
    OR json_extract(b.data, '$.weapons.ranged.weaponId') = @weapon)`
// "%" and "_" typed by a user must be searched as plain characters
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c)

// List: filters (hero, career, author name), sort (newest by default / oldest / most liked), pagination
buildsRouter.get('/builds', (req, res) => {
  const username = str(req.query.username)?.trim().slice(0, 24) || null
  const filters = {
    hero: str(req.query.hero),
    career: str(req.query.career),
    weapon: str(req.query.weapon)?.slice(0, 60) || null,
    user: username ? `%${escapeLike(username)}%` : null, // the author name contains the text
  }
  const WHERE = `
    WHERE (@hero   IS NULL OR b.hero_id   = @hero)
      AND (@career IS NULL OR b.career_id = @career)
      AND ${WEAPON_SQL}
      AND (@user   IS NULL OR u.username LIKE @user ESCAPE '\\')`
  const order = Object.hasOwn(SORTS, req.query.sort) ? SORTS[req.query.sort] : SORTS.newest

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM builds b JOIN users u ON u.id = b.user_id ${WHERE}`)
    .get(filters).n
  const pages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE))
  const page = Math.min(Math.max(1, parseInt(req.query.page) || 1), pages) // out of range -> last page

  const rows = db
    .prepare(`${SELECT} ${WHERE} ORDER BY ${order} LIMIT @limit OFFSET @offset`)
    .all({
      ...filters,
      limit: LIST_PAGE_SIZE,
      offset: (page - 1) * LIST_PAGE_SIZE,
      me: viewer(req),
    })
  res.json({ page, pages, total, items: rows.map(toBuild) })
})

// "Top rated builds": most liked first, only builds with at least one like, and at most ONE build
// per career (so three Mercenary builds cannot fill the section). When a career filter is active the
// "one per career" rule is dropped: it would only ever show a single build.
// Declared before /builds/:id so "top" is not read as an id.
buildsRouter.get('/builds/top', (req, res) => {
  // ?all=1 = same list as the carousel without its cap (by pages). With no career filter that is still
  // one build per career, the most liked one, so the cap never matters there.
  const all = req.query.all === '1'
  const size = all ? Math.min(MODAL_PAGE_MAX, Math.max(1, parseInt(req.query.limit) || MODAL_PAGE)) : str(req.query.career) ? TOP_LIMIT_CAREER : TOP_LIMIT
  const offset = all ? Math.max(0, parseInt(req.query.offset) || 0) : 0
  const rows = db
    .prepare(
      `
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (
               PARTITION BY hero_id, career_id
               ORDER BY like_count DESC, created_at DESC, id DESC
             ) AS rank_in_career
      FROM (
        ${SELECT}
        WHERE (@hero   IS NULL OR b.hero_id   = @hero)
          AND (@career IS NULL OR b.career_id = @career)
          AND ${WEAPON_SQL}
      )
      WHERE like_count > 0
    )
    WHERE @career IS NOT NULL OR rank_in_career = 1
    ORDER BY like_count DESC, created_at DESC, id DESC
    LIMIT @limit OFFSET @offset
  `,
    )
    .all({
      hero: str(req.query.hero),
      career: str(req.query.career),
      weapon: str(req.query.weapon)?.slice(0, 60) || null,
      limit: size + 1, // one more than asked: tells whether there is a next page
      offset,
      me: viewer(req),
    })
  res.json({ items: rows.slice(0, size).map(toBuild), hasMore: rows.length > size })
})

// My builds (declared before /builds/:id as well)
buildsRouter.get('/me/builds', requireAuth, (req, res) => {
  const rows = db
    .prepare(`${SELECT} WHERE b.user_id = @uid ORDER BY b.updated_at DESC, b.id DESC`)
    .all({ uid: req.userId, me: req.userId })
  res.json(rows.map(toBuild))
})

// View a build
buildsRouter.get('/builds/:id', (req, res) => {
  const row = findOne(req.params.id, req)
  if (!row) return res.status(404).json({ error: 'Build not found' })
  res.json(toBuild(row))
})

// Create
buildsRouter.post('/builds', requireAuth, (req, res) => {
  const b = buildSchema.parse(req.body)
  const gameError = validateBuildData(b)
  if (gameError) return res.status(400).json({ error: gameError })
  b.data.balance = BALANCE_VERSION
  const info = db
    .prepare(
      `
    INSERT INTO builds (user_id, title, description, hero_id, career_id, data)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(req.userId, b.title, b.description, b.heroId, b.careerId, JSON.stringify(b.data))
  res.status(201).json(toBuild(findOne(info.lastInsertRowid, req)))
})

// Update (owner only). Likes are kept.
buildsRouter.put('/builds/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT user_id FROM builds WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Build not found' })
  if (existing.user_id !== req.userId)
    return res.status(403).json({ error: 'You do not own this build' })

  const b = buildSchema.parse(req.body)
  const gameError = validateBuildData(b)
  if (gameError) return res.status(400).json({ error: gameError })
  b.data.balance = BALANCE_VERSION // editing a build brings it up to the current balance version
  db.prepare(
    `
    UPDATE builds SET title=?, description=?, hero_id=?, career_id=?, data=?,
                      updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(b.title, b.description, b.heroId, b.careerId, JSON.stringify(b.data), req.params.id)
  res.json(toBuild(findOne(req.params.id, req)))
})

// Delete (owner only). Its likes are deleted with it (ON DELETE CASCADE).
buildsRouter.delete('/builds/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT user_id FROM builds WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Build not found' })
  if (existing.user_id !== req.userId)
    return res.status(403).json({ error: 'You do not own this build' })
  db.prepare('DELETE FROM builds WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// --- Likes ----------------------------------------------------------------

const likeState = (buildId, userId) => ({
  liked: !!db
    .prepare('SELECT 1 FROM likes WHERE build_id = ? AND user_id = ?')
    .get(buildId, userId),
  likeCount: db.prepare('SELECT COUNT(*) AS n FROM likes WHERE build_id = ?').get(buildId).n,
})

// Like a build (idempotent). You cannot like your own builds.
buildsRouter.post('/builds/:id/like', requireAuth, (req, res) => {
  const build = db.prepare('SELECT id, user_id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })
  if (build.user_id === req.userId)
    return res.status(403).json({ error: "You can't like your own build" })
  db.prepare('INSERT OR IGNORE INTO likes (user_id, build_id) VALUES (?, ?)').run(
    req.userId,
    build.id,
  )
  res.json(likeState(build.id, req.userId))
})

// Remove my like (idempotent)
buildsRouter.delete('/builds/:id/like', requireAuth, (req, res) => {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })
  db.prepare('DELETE FROM likes WHERE user_id = ? AND build_id = ?').run(req.userId, build.id)
  res.json(likeState(build.id, req.userId))
})

// --- Bookmarks (favorites) -----------------------------------------------------
// Private: a user only ever sees his own bookmarks. Any build can be bookmarked, even your own.

// Bookmark a build (idempotent)
buildsRouter.post('/builds/:id/bookmark', requireAuth, (req, res) => {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })
  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, build_id) VALUES (?, ?)').run(req.userId, build.id)
  res.json({ bookmarked: true })
})

// Remove my bookmark (idempotent)
buildsRouter.delete('/builds/:id/bookmark', requireAuth, (req, res) => {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND build_id = ?').run(req.userId, build.id)
  res.json({ bookmarked: false })
})

// My bookmarked builds, most recently bookmarked first
buildsRouter.get('/me/bookmarks', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `${SELECT}
       WHERE b.id IN (SELECT build_id FROM bookmarks WHERE user_id = @uid)
       ORDER BY (SELECT k.created_at FROM bookmarks k WHERE k.build_id = b.id AND k.user_id = @uid) DESC, b.id DESC
       LIMIT 100`,
    )
    .all({ uid: req.userId, me: req.userId })
  res.json(rows.map(toBuild))
})
