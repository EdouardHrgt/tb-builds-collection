import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const file = process.env.DB_PATH || './data/app.db'
fs.mkdirSync(path.dirname(file), { recursive: true })

export const db = new Database(file)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 0,  -- bumped on password reset to invalidate sessions
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,           -- SHA-256 of the emailed token
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS builds (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    hero_id     TEXT NOT NULL,
    career_id   TEXT NOT NULL,
    data        TEXT NOT NULL,          -- JSON: talents, items...
    is_public   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_builds_user   ON builds(user_id);
  CREATE INDEX IF NOT EXISTS idx_builds_filter ON builds(is_public, hero_id, career_id);
`)

// Migration for databases created before token_version existed
if (
  !db
    .prepare('PRAGMA table_info(users)')
    .all()
    .some((c) => c.name === 'token_version')
) {
  db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0')
}
