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
  const row = db.prepare(`${SELECT} WHERE c.id = ?`).get(info.lastInsertRowid)
  res.status(201).json({ ...toComment(row), replies: [] })
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
