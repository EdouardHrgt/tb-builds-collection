import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { SELECT, toBuild } from './builds.js'

export const usersRouter = Router()

const PROFILE_BUILDS_LIMIT = 100
const FEED_LIMIT = 20

const viewer = (req) => req.userId ?? 0 // user ids start at 1, so 0 matches nobody
const findByName = (username) =>
  db.prepare('SELECT id, username, hide_followers, created_at FROM users WHERE username = ?').get(username) // column is NOCASE

const followerCount = (userId) =>
  db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followed_id = ?').get(userId).n

// Privacy: the follower count is only sent when its owner allows it (or to the owner himself).
// null = hidden. The email address is never part of a profile.
const visibleCount = (user, viewerId) =>
  !user.hide_followers || user.id === viewerId ? followerCount(user.id) : null

const isFollowing = (followerId, followedId) =>
  !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?').get(followerId, followedId)

// Public profile: the builds of a user + follow state
usersRouter.get('/users/:username', (req, res) => {
  const user = findByName(req.params.username)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const me = viewer(req)
  const isSelf = user.id === me
  const builds = db
    .prepare(`${SELECT} WHERE b.user_id = @uid ORDER BY b.created_at DESC, b.id DESC LIMIT @limit`)
    .all({ uid: user.id, me, limit: PROFILE_BUILDS_LIMIT })

  res.json({
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
    isSelf,
    isFollowing: me ? isFollowing(me, user.id) : false,
    followerCount: visibleCount(user, me),
    hideFollowers: isSelf ? !!user.hide_followers : undefined, // the setting itself is only for its owner
    builds: builds.map(toBuild),
  })
})

// A small per-user limit: a script must not be able to follow / unfollow thousands of times
const followLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) => String(req.userId),
  message: { error: 'Too many follow actions, please wait a moment' },
})

const followState = (target, me) => ({
  following: isFollowing(me, target.id),
  followerCount: visibleCount(target, me),
})

// Follow (idempotent). You cannot follow yourself.
usersRouter.post('/users/:username/follow', requireAuth, followLimiter, (req, res) => {
  const target = findByName(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.id === req.userId) return res.status(403).json({ error: "You can't follow yourself" })
  db.prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)').run(req.userId, target.id)
  res.json(followState(target, req.userId))
})

// Unfollow (idempotent)
usersRouter.delete('/users/:username/follow', requireAuth, followLimiter, (req, res) => {
  const target = findByName(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found' })
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?').run(req.userId, target.id)
  res.json(followState(target, req.userId))
})

// The people I follow. PRIVATE: it is always computed from the logged in user, never from a URL.
usersRouter.get('/me/following', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.hide_followers, f.created_at AS followed_at,
              (SELECT COUNT(*) FROM builds b WHERE b.user_id = u.id) AS build_count
       FROM follows f JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = ?
       ORDER BY u.username COLLATE NOCASE`,
    )
    .all(req.userId)
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      username: r.username,
      followedAt: r.followed_at,
      buildCount: r.build_count,
      followerCount: visibleCount(r, req.userId), // null when this user hides his follower count
    })),
  })
})

// "Latest builds from followed users": only the most recent build of each followed user
usersRouter.get('/me/following/builds', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY created_at DESC, id DESC
             ) AS rank_of_user
      FROM (
        ${SELECT}
        WHERE b.user_id IN (SELECT followed_id FROM follows WHERE follower_id = @uid)
      )
    )
    WHERE rank_of_user = 1
    ORDER BY created_at DESC, id DESC
    LIMIT @limit
  `,
    )
    .all({ uid: req.userId, me: req.userId, limit: FEED_LIMIT })
  res.json({ items: rows.map(toBuild) })
})

// Privacy settings (for now: hide my follower count from other users)
const settingsSchema = z.object({ hideFollowers: z.boolean() }).strict()

usersRouter.patch('/me/settings', requireAuth, (req, res) => {
  const { hideFollowers } = settingsSchema.parse(req.body)
  db.prepare('UPDATE users SET hide_followers = ? WHERE id = ?').run(hideFollowers ? 1 : 0, req.userId)
  res.json({ hideFollowers })
})
