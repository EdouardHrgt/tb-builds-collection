import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZodError } from 'zod'
import './db.js'
import { loadUser } from './auth.js'
import { authRouter } from './routes/auth.js'
import { buildsRouter } from './routes/builds.js'
import { commentsRouter } from './routes/comments.js'
import { usersRouter } from './routes/users.js'

const app = express()
const isProd = process.env.NODE_ENV === 'production'
if (isProd) app.set('trust proxy', 1) // behind the host's proxy

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
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
