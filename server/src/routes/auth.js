import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { setSession, clearSession, requireAuth } from '../auth.js'

export const authRouter = Router()

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email')
    .max(120)
    .transform((s) => s.toLowerCase()),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, _ and -'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9\s]/, 'Password must contain at least one special character'),
})

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1),
})

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email })

authRouter.post(
  '/register',
  ah(async (req, res) => {
    const { email, username, password } = registerSchema.parse(req.body)
    const hash = await bcrypt.hash(password, 10)
    try {
      const info = db
        .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
        .run(email, username, hash)
      const user = { id: info.lastInsertRowid, email, username }
      setSession(res, user)
      res.status(201).json(publicUser(user))
    } catch (e) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Email or username already in use' })
      }
      throw e
    }
  }),
)

authRouter.post(
  '/login',
  ah(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    const ok = user && (await bcrypt.compare(password, user.password_hash))
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password' })
    setSession(res, user)
    res.json(publicUser(user))
  }),
)

authRouter.post('/logout', (_req, res) => {
  clearSession(res)
  res.status(204).end()
})

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(req.userId)
  if (!user) {
    clearSession(res)
    return res.status(401).json({ error: 'Session expired' })
  }
  res.json(user)
})
