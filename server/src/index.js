import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZodError } from 'zod'
import './db.js'
import { loadUser } from './auth.js'
import { authRouter } from './routes/auth.js'
import { buildsRouter } from './routes/builds.js'
import { commentsRouter } from './routes/comments.js'
import { usersRouter } from './routes/users.js'
import { buildPageHtml } from './meta.js'

const app = express()
const isProd = process.env.NODE_ENV === 'production'
app.disable('x-powered-by')
// Behind a reverse proxy (Caddy, Nginx, the host's proxy) req.ip is the visitor's address only if we trust
// it, otherwise every rate limit would count all visitors as ONE. TRUST_PROXY = number of proxies in front
// (default 1 in production, 0 = none, e.g. if the Node server is exposed directly).
const trustProxy = Number(process.env.TRUST_PROXY ?? (isProd ? 1 : 0))
if (trustProxy > 0) app.set('trust proxy', trustProxy)

// Security headers (production only: the Vite dev server needs inline scripts).
// Google Fonts is the only external resource of the site.
if (isProd) {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Vue sets some style="" attributes
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  app.use((_req, res, next) => {
    res.set({
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=15552000', // 180 days: HTTPS only (ignored over plain http)
    })
    next()
  })
}

app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(loadUser)

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRouter)
app.use('/api', buildsRouter)
app.use('/api', commentsRouter)
app.use('/api', usersRouter)

// Centralized error handling
app.use('/api', (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || 'Invalid data' })
  }
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

// In production the server also serves the front end (same origin, no CORS)
if (isProd) {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist')
  // index.html carries the link-preview tags (Open Graph), which need absolute addresses: __APP_URL__ is
  // replaced once, here, with APP_URL (never built from request headers). `index: false` so that "/" goes
  // through the catch-all below instead of serving the raw file.
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
  const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8').replaceAll('__APP_URL__', appUrl)
  app.use(express.static(dist, { index: false }))
  // The page of a build: same page, with the link-preview tags of that build (title, career, author)
  app.get('/builds/:id(\\d+)', (req, res) => res.type('html').send(buildPageHtml(indexHtml, appUrl, req.params.id)))
  app.get('*', (_req, res) => res.type('html').send(indexHtml))
}

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
