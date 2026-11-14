import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { avatarFor } from '../avatars.js'

export const commentsRouter = Router()

const PAGE_SIZE = 5 // comments per page (replies are not counted: they sit under their comment)
const BODY_MAX = 200

const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(BODY_MAX, `Comment must be at most ${BODY_MAX} characters`),
  parentId: z.number().int().positive().optional(), // the comment (or reply) being answered
})

// Per user (not per IP): the community is small and people may share a connection
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'You are commenting too fast, please wait a moment' },
})

const SELECT = `
  SELECT c.*, u.username AS author, u.avatar AS author_avatar
  FROM comments c JOIN users u ON u.id = c.user_id
`

// --- Unread comments ---
// A person has unread comments on a build when somebody else wrote there, after the last comment the person has seen
// (comment_seen.seen_id), and it concerns the person: it is the build of the person, or the comment is in a thread
// (a comment and its replies) where the person wrote. Replies are one level deep, so a thread = its first comment's id.
// Opening the comments of a build marks them all as read.
const CONCERNS_ME = `
  (b.user_id = :me OR EXISTS (
     SELECT 1 FROM comments x
     WHERE x.user_id = :me AND x.build_id = c.build_id AND COALESCE(x.parent_id, x.id) = COALESCE(c.parent_id, c.id)))`

const unreadIds = (userId, buildId) =>
  db
    .prepare(
      `SELECT c.id FROM comments c
       JOIN builds b ON b.id = c.build_id
       LEFT JOIN comment_seen s ON s.user_id = :me AND s.build_id = c.build_id
       WHERE c.build_id = :build AND c.user_id != :me AND c.id > COALESCE(s.seen_id, 0) AND ${CONCERNS_ME}
       ORDER BY c.id`,
    )
    .all({ me: userId, build: buildId })
    .map((r) => r.id)

// "Everything up to here is read". Only for the people who can have notifications on this build (its author, or
// somebody who wrote there): a simple visitor gets no row.
function markSeen(userId, buildId, upTo) {
  const involved = db
    .prepare(
      `SELECT 1 FROM builds WHERE id = :build AND user_id = :me
       UNION SELECT 1 FROM comments WHERE build_id = :build AND user_id = :me LIMIT 1`,
    )
    .get({ build: buildId, me: userId })
  if (!involved) return
  const last = upTo ?? db.prepare('SELECT COALESCE(MAX(id), 0) AS n FROM comments WHERE build_id = ?').get(buildId).n
  db.prepare(
    `INSERT INTO comment_seen (user_id, build_id, seen_id) VALUES (?, ?, ?)
     ON CONFLICT (user_id, build_id) DO UPDATE SET seen_id = MAX(seen_id, excluded.seen_id)`,
  ).run(userId, buildId, last)
}

const toComment = (r) => ({
  id: r.id,
  body: r.body,
  author: r.author,
  authorId: r.user_id,
  authorAvatar: avatarFor(r.user_id, r.author_avatar),
  parentId: r.parent_id,
  createdAt: r.created_at,
})

// One page of comments (newest first), each with all its replies (oldest first)
commentsRouter.get('/builds/:id/comments', (req, res) => {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })

  const total = db
    .prepare('SELECT COUNT(*) AS n FROM comments WHERE build_id = ? AND parent_id IS NULL')
    .get(build.id).n
  const commentCount = db
    .prepare('SELECT COUNT(*) AS n FROM comments WHERE build_id = ?')
    .get(build.id).n
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(Math.max(1, parseInt(req.query.page) || 1), pages) // out of range -> last page

  // The unread comments of the viewer (before they are marked as read: this answer is the last time they are "new")
  const newIds = req.userId ? unreadIds(req.userId, build.id) : []
  if (req.userId && page === 1) markSeen(req.userId, build.id)

  const tops = db
    .prepare(
      `
    ${SELECT}
    WHERE c.build_id = ? AND c.parent_id IS NULL
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT ? OFFSET ?
  `,
    )
    .all(build.id, PAGE_SIZE, (page - 1) * PAGE_SIZE)

  const repliesByParent = new Map()
  if (tops.length) {
    const marks = tops.map(() => '?').join(',')
    const replies = db
      .prepare(`${SELECT} WHERE c.parent_id IN (${marks}) ORDER BY c.created_at ASC, c.id ASC`)
      .all(...tops.map((t) => t.id))
    for (const r of replies) {
      if (!repliesByParent.has(r.parent_id)) repliesByParent.set(r.parent_id, [])
      repliesByParent.get(r.parent_id).push(toComment(r))
    }
  }

  res.json({
    page,
    pages,
    pageSize: PAGE_SIZE,
    total, // comments (without replies): what the pager counts
    commentCount, // comments + replies
    newIds, // ids of the comments (or replies) the viewer had not seen yet, on every page
    items: tops.map((t) => ({ ...toComment(t), replies: repliesByParent.get(t.id) ?? [] })),
  })
})

// Post a comment, or a reply when parentId is given
commentsRouter.post('/builds/:id/comments', requireAuth, postLimiter, (req, res) => {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found' })

  const { body, parentId } = commentSchema.parse(req.body)

  let threadId = null
  if (parentId !== undefined) {
    const target = db
      .prepare('SELECT id, parent_id FROM comments WHERE id = ? AND build_id = ?')
      .get(parentId, build.id)
    if (!target) return res.status(404).json({ error: 'Comment to reply to not found' })
    threadId = target.parent_id ?? target.id // replies are one level deep: answering a reply stays in its thread
  }

  const info = db
    .prepare('INSERT INTO comments (build_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)')
    .run(build.id, req.userId, threadId, body)
  markSeen(req.userId, build.id, info.lastInsertRowid) // what a person writes is read, and so is the rest of the page
  const row = db.prepare(`${SELECT} WHERE c.id = ?`).get(info.lastInsertRowid)
  res.status(201).json({ ...toComment(row), replies: [] })
})

// The builds where the person has unread comments (for the menu and the "New comments" list of the profile page)
commentsRouter.get('/me/notifications', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.id AS buildId, b.title, u.username AS author, b.user_id = :me AS mine,
              COUNT(*) AS count, MAX(c.id) AS lastId
       FROM comments c
       JOIN builds b ON b.id = c.build_id
       JOIN users u ON u.id = b.user_id
       LEFT JOIN comment_seen s ON s.user_id = :me AND s.build_id = c.build_id
       WHERE c.user_id != :me AND c.id > COALESCE(s.seen_id, 0) AND ${CONCERNS_ME}
       GROUP BY b.id
       ORDER BY lastId DESC`,
    )
    .all({ me: req.userId })
  const items = rows.map((r) => ({
    buildId: r.buildId,
    title: r.title,
    author: r.author,
    mine: !!r.mine,
    count: r.count,
  }))
  res.json({ total: items.reduce((n, i) => n + i.count, 0), items })
})

// Delete a comment: its author, or the author of the build (to moderate their own page).
// The replies of a deleted comment are deleted with it (ON DELETE CASCADE).
commentsRouter.delete('/comments/:id', requireAuth, (req, res) => {
  const row = db
    .prepare(
      `
    SELECT c.id, c.user_id, b.user_id AS build_owner
    FROM comments c JOIN builds b ON b.id = c.build_id
    WHERE c.id = ?
  `,
    )
    .get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Comment not found' })
  if (row.user_id !== req.userId && row.build_owner !== req.userId) {
    return res.status(403).json({ error: 'You cannot delete this comment' })
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(row.id)
  res.status(204).end()
})
