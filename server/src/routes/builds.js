import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

export const buildsRouter = Router()

// The exact shape of `data` will be refined once the game data reference exists.
const buildSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(80),
  description: z.string().max(2000).default(''),
  heroId: z.string().min(1).max(50),
  careerId: z.string().min(1).max(50),
  isPublic: z.boolean().default(true),
  data: z.object({
    talents: z.array(z.number().int().min(0).max(3)).length(6),
    items: z.record(z.string().max(120)).default({}),
  }),
})

const SELECT = `
  SELECT b.*, u.username AS author
  FROM builds b JOIN users u ON u.id = b.user_id
`

const toBuild = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  heroId: r.hero_id,
  careerId: r.career_id,
  data: JSON.parse(r.data),
  isPublic: !!r.is_public,
  author: r.author,
  authorId: r.user_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

// Public list (hero / career filters, pagination)
buildsRouter.get('/builds', (req, res) => {
  const limit = 20
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const rows = db
    .prepare(
      `
    ${SELECT}
    WHERE b.is_public = 1
      AND (@hero   IS NULL OR b.hero_id   = @hero)
      AND (@career IS NULL OR b.career_id = @career)
    ORDER BY b.created_at DESC
    LIMIT @limit OFFSET @offset
  `,
    )
    .all({
      hero: req.query.hero || null,
      career: req.query.career || null,
      limit,
      offset: (page - 1) * limit,
    })
  res.json({ page, items: rows.map(toBuild) })
})

// My builds (declared before /builds/:id so it is not captured by it)
buildsRouter.get('/me/builds', requireAuth, (req, res) => {
  const rows = db
    .prepare(`${SELECT} WHERE b.user_id = ? ORDER BY b.updated_at DESC`)
    .all(req.userId)
  res.json(rows.map(toBuild))
})

// View a build (private: visible to its author only)
buildsRouter.get('/builds/:id', (req, res) => {
  const row = db.prepare(`${SELECT} WHERE b.id = ?`).get(req.params.id)
  if (!row || (!row.is_public && row.user_id !== req.userId)) {
    return res.status(404).json({ error: 'Build not found' })
  }
  res.json(toBuild(row))
})

// Create
buildsRouter.post('/builds', requireAuth, (req, res) => {
  const b = buildSchema.parse(req.body)
  const info = db
    .prepare(
      `
    INSERT INTO builds (user_id, title, description, hero_id, career_id, data, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      req.userId,
      b.title,
      b.description,
      b.heroId,
      b.careerId,
      JSON.stringify(b.data),
      b.isPublic ? 1 : 0,
    )
  const row = db.prepare(`${SELECT} WHERE b.id = ?`).get(info.lastInsertRowid)
  res.status(201).json(toBuild(row))
})

// Update (owner only)
buildsRouter.put('/builds/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT user_id FROM builds WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Build not found' })
  if (existing.user_id !== req.userId)
    return res.status(403).json({ error: 'You do not own this build' })

  const b = buildSchema.parse(req.body)
  db.prepare(
    `
    UPDATE builds SET title=?, description=?, hero_id=?, career_id=?, data=?, is_public=?,
                      updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    b.title,
    b.description,
    b.heroId,
    b.careerId,
    JSON.stringify(b.data),
    b.isPublic ? 1 : 0,
    req.params.id,
  )
  const row = db.prepare(`${SELECT} WHERE b.id = ?`).get(req.params.id)
  res.json(toBuild(row))
})

// Delete (owner only)
buildsRouter.delete('/builds/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT user_id FROM builds WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Build not found' })
  if (existing.user_id !== req.userId)
    return res.status(403).json({ error: 'You do not own this build' })
  db.prepare('DELETE FROM builds WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
