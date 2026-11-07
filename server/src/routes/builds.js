import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { validateBuildData } from '../gameData.js'

export const buildsRouter = Router()

const TITLE_MIN = 5
const TITLE_MAX = 30
const TOP_LIMIT = 3 // number of builds in the "Top rated builds" section

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
      talents: z.array(z.number().int().min(0).max(3)).length(6), // 0 = none, 1..3 = position in the tier
      weapons: z.record(id, weaponSchema), // melee / ranged
      equipment: z.record(id, gearSchema), // necklace / charm / trinket
    })
    .strict(),
})

// Every query built on SELECT must pass `me` (the viewer's user id, 0 for a visitor)
const SELECT = `
  SELECT b.*, u.username AS author,
         (SELECT COUNT(*) FROM likes l WHERE l.build_id = b.id) AS like_count,
         EXISTS (SELECT 1 FROM likes l WHERE l.build_id = b.id AND l.user_id = @me) AS liked_by_me
  FROM builds b JOIN users u ON u.id = b.user_id
`

const toBuild = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  heroId: r.hero_id,
  careerId: r.career_id,
  data: JSON.parse(r.data),
  author: r.author,
  authorId: r.user_id,
  likeCount: r.like_count,
  likedByMe: !!r.liked_by_me,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const viewer = (req) => req.userId ?? 0 // user ids start at 1, so 0 matches nobody
const str = (v) => (typeof v === 'string' && v ? v : null)
const findOne = (buildId, req) =>
  db.prepare(`${SELECT} WHERE b.id = @id`).get({ id: buildId, me: viewer(req) })

// List (hero / career filters, pagination), newest first
buildsRouter.get('/builds', (req, res) => {
  const limit = 20
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const rows = db
    .prepare(
      `
    ${SELECT}
    WHERE (@hero   IS NULL OR b.hero_id   = @hero)
      AND (@career IS NULL OR b.career_id = @career)
    ORDER BY b.created_at DESC, b.id DESC
    LIMIT @limit OFFSET @offset
  `,
    )
    .all({
      hero: str(req.query.hero),
      career: str(req.query.career),
      limit,
      offset: (page - 1) * limit,
      me: viewer(req),
    })
  res.json({ page, items: rows.map(toBuild) })
})

// "Top rated builds": most liked first, only builds with at least one like, and at most ONE build
// per career (so three Mercenary builds cannot fill the section). When a career filter is active the
// "one per career" rule is dropped: it would only ever show a single build.
// Declared before /builds/:id so "top" is not read as an id.
buildsRouter.get('/builds/top', (req, res) => {
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
      )
      WHERE like_count > 0
    )
    WHERE @career IS NOT NULL OR rank_in_career = 1
    ORDER BY like_count DESC, created_at DESC, id DESC
    LIMIT @limit
  `,
    )
    .all({
      hero: str(req.query.hero),
      career: str(req.query.career),
      limit: TOP_LIMIT,
      me: viewer(req),
    })
  res.json({ items: rows.map(toBuild) })
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
