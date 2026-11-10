import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db } from '../db.js'
import { setSession, clearSession, requireAuth } from '../auth.js'
import { sendMail } from '../mailer.js'

export const authRouter = Router()

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Base URL used in reset links. Never built from request headers (host header injection).
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
if (process.env.NODE_ENV === 'production' && !process.env.APP_URL) {
  console.warn('APP_URL is not set: password reset links will point to http://localhost:5173')
}

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10) // keeps login timing similar for unknown users
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9\s]/, 'Password must contain at least one special character')

const identifierSchema = z.string().trim().min(1, 'Email or username is required').max(120)

const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .max(120)
    .transform((s) => s.toLowerCase()),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, _ and -'),
  password: passwordSchema,
})

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Password is required'),
})

const forgotSchema = z.object({ identifier: identifierSchema })

const resetSchema = z.object({
  token: z
    .string()
    .min(1, 'Invalid or expired reset link')
    .max(200, 'Invalid or expired reset link'),
  password: passwordSchema,
})

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email })

// Usernames cannot contain "@", so the identifier is unambiguous.
function findUser(identifier) {
  return identifier.includes('@')
    ? db.prepare('SELECT * FROM users WHERE email = ?').get(identifier.toLowerCase())
    : db.prepare('SELECT * FROM users WHERE username = ?').get(identifier) // column is NOCASE
}

authRouter.post(
  '/register',
  ah(async (req, res) => {
    const { email, username, password } = registerSchema.parse(req.body)
    const hash = await bcrypt.hash(password, 10)
    try {
      const info = db
        .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
        .run(email, username, hash)
      const user = { id: info.lastInsertRowid, email, username, token_version: 0 }
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
    const { identifier, password } = loginSchema.parse(req.body)
    const user = findUser(identifier)
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH)
    if (!user || !ok) return res.status(401).json({ error: 'Incorrect email/username or password' })
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

// --- Password reset -------------------------------------------------------

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many requests, please try again later' },
})

// Limits on the emails themselves, besides the per-address limiter above (an attacker can change address, and a
// victim's inbox or the email quota must not be flooded). Both use the password_resets table: one row = one email sent.
const RESET_COOLDOWN = "-5 minutes" // at most one reset email per account every 5 minutes
const RESET_MAILS_PER_HOUR = 30 // and at most 30 for the whole site per hour

// Always answers the same message, whether or not an account matches (no account enumeration).
authRouter.post('/forgot-password', forgotLimiter, (req, res) => {
  const { identifier } = forgotSchema.parse(req.body)

  db.prepare("DELETE FROM password_resets WHERE expires_at <= datetime('now')").run()

  const user = findUser(identifier)
  // Over a limit: nothing is sent, and the answer stays the same (it must not reveal anything)
  const tooSoon =
    user &&
    db.prepare("SELECT 1 FROM password_resets WHERE user_id = ? AND created_at > datetime('now', ?)").get(user.id, RESET_COOLDOWN)
  const sentThisHour = db
    .prepare("SELECT COUNT(*) AS n FROM password_resets WHERE created_at > datetime('now', '-1 hour')")
    .get().n
  if (user && !tooSoon && sentThisHour < RESET_MAILS_PER_HOUR) {
    const token = crypto.randomBytes(32).toString('hex')
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id) // one active link at a time
    db.prepare(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))",
    ).run(user.id, sha256(token)) // only the hash is stored

    // Not awaited: the response time must not reveal whether the account exists.
    sendMail({
      to: user.email,
      subject: "Reset your Sigmar's Arsenal password",
      text: `Hi ${user.username},

Someone asked to reset the password of your account. Use the link below to choose a new one (valid for 1 hour):

${APP_URL}/reset-password?token=${token}

If you didn't ask for this, ignore this email: your password will not change.`,
    }).catch((e) => console.error('Failed to send reset email:', e))
  }

  res.json({ message: 'If an account matches, a reset link has been sent to its email address ;)' })
})

authRouter.post(
  '/reset-password',
  ah(async (req, res) => {
    const { token, password } = resetSchema.parse(req.body)
    const row = db
      .prepare(
        "SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > datetime('now')",
      )
      .get(sha256(token))
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset link' })

    const hash = await bcrypt.hash(password, 10)
    db.transaction(() => {
      // token_version + 1 invalidates every existing session of this account
      db.prepare(
        'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
      ).run(hash, row.user_id)
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(row.user_id)
    })()

    clearSession(res)
    res.json({ message: 'Password updated. You can now log in.' })
  }),
)

// --- Account settings (logged in) -----------------------------------------

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many attempts, please try again later' },
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(72),
  newPassword: passwordSchema,
})

const changeEmailSchema = z.object({
  password: z.string().min(1, 'Password is required').max(72),
  email: z
    .string()
    .trim()
    .email('Invalid email')
    .max(120)
    .transform((s) => s.toLowerCase()),
})

// Loads the account and checks its password (403 = wrong password, so the client never mistakes it for a lost session).
async function accountWithPassword(req, res, password) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  if (!user) {
    clearSession(res)
    res.status(401).json({ error: 'Session expired' })
    return null
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    res.status(403).json({ error: 'Current password is incorrect' })
    return null
  }
  return user
}

authRouter.post(
  '/change-password',
  requireAuth,
  accountLimiter,
  ah(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await accountWithPassword(req, res, currentPassword)
    if (!user) return
    const hash = await bcrypt.hash(newPassword, 10)
    // token_version + 1 logs out every other device; this one gets a fresh session right below
    db.prepare(
      'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
    ).run(hash, user.id)
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id) // a pending reset link is now useless
    setSession(res, { ...user, token_version: user.token_version + 1 })
    res.json({ message: 'Password updated.' })
  }),
)

authRouter.post(
  '/change-email',
  requireAuth,
  accountLimiter,
  ah(async (req, res) => {
    const { password, email } = changeEmailSchema.parse(req.body)
    const user = await accountWithPassword(req, res, password)
    if (!user) return
    if (email !== user.email) {
      try {
        db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, user.id)
      } catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({ error: 'Email already in use' })
        }
        throw e
      }
      // Warns the OLD address (someone with a stolen session could be changing it)
      sendMail({
        to: user.email,
        subject: "Your Sigmar's Arsenal email was changed",
        text: `Hi ${user.username},

The email of your account was just changed to ${email}.

If this was not you, use "Forgot password" with your username to take your account back.`,
      }).catch((e) => console.error('Failed to send email-change notice:', e))
    }
    res.json(publicUser({ ...user, email }))
  }),
)

// Deletes the account. Every table references users with ON DELETE CASCADE, so one DELETE also removes the
// builds (with their likes, comments and bookmarks), the comments and likes of this user, follows and reset links.
const deleteAccountSchema = z.object({ password: z.string().min(1, 'Password is required').max(72) })

authRouter.post(
  '/delete-account',
  requireAuth,
  accountLimiter,
  ah(async (req, res) => {
    const { password } = deleteAccountSchema.parse(req.body)
    const user = await accountWithPassword(req, res, password)
    if (!user) return
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
    clearSession(res)
    res.status(204).end()
  }),
)
