import jwt from 'jsonwebtoken'
import { db } from './db.js'

const isProd = process.env.NODE_ENV === 'production'
const SECRET = process.env.JWT_SECRET || (isProd ? null : 'dev-only-secret')
if (!SECRET) throw new Error('JWT_SECRET is missing (required in production)')

const COOKIE = 'token'
const cookieOpts = {
  httpOnly: true, // not readable by browser JS
  sameSite: 'lax',
  secure: isProd, // HTTPS only in production
}

export function setSession(res, user) {
  // `v` ties the token to users.token_version: bumping it logs everyone out
  const token = jwt.sign({ sub: user.id, v: user.token_version ?? 0 }, SECRET, { expiresIn: '7d' })
  res.cookie(COOKIE, token, { ...cookieOpts, maxAge: 7 * 24 * 3600 * 1000 })
}

export function clearSession(res) {
  res.clearCookie(COOKIE, cookieOpts)
}

// Reads the cookie and sets req.userId (or null). Never blocks.
export function loadUser(req, _res, next) {
  req.userId = null
  const token = req.cookies?.[COOKIE]
  if (token) {
    try {
      const { sub, v } = jwt.verify(token, SECRET)
      const row = db.prepare('SELECT token_version FROM users WHERE id = ?').get(sub)
      if (row && row.token_version === (v ?? 0)) req.userId = sub
    } catch {
      /* invalid token */
    }
  }
  next()
}

export function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Login required' })
  next()
}
