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
    hide_followers INTEGER NOT NULL DEFAULT 0, -- privacy: 1 = the follower count is hidden from other users
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
    data        TEXT NOT NULL,          -- JSON: talents, weapons, equipment
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row = one like. The primary key makes a double like impossible.
  CREATE TABLE IF NOT EXISTS likes (
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    build_id   INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, build_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id   INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  parent_id  INTEGER REFERENCES comments(id)        ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

  -- One row = "follower_id follows followed_id". The primary key prevents a double follow.
  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id != followed_id)
  );
  CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);

  -- Bookmarks (favorites): private to their owner, nobody else can see who bookmarked a build.
  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    build_id   INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, build_id)
  );
  CREATE INDEX IF NOT EXISTS idx_bookmarks_build ON bookmarks(build_id);

  CREATE INDEX IF NOT EXISTS idx_comments_build  ON comments(build_id, parent_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
  CREATE INDEX IF NOT EXISTS idx_comments_user   ON comments(user_id);

  CREATE INDEX IF NOT EXISTS idx_builds_user ON builds(user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_build ON likes(build_id);
`)

// --- Migrations for databases created by older versions ---

// users.token_version
if (
  !db
    .prepare('PRAGMA table_info(users)')
    .all()
    .some((c) => c.name === 'token_version')
) {
  db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0')
}

// users.hide_followers
if (
  !db
    .prepare('PRAGMA table_info(users)')
    .all()
    .some((c) => c.name === 'hide_followers')
) {
  db.exec('ALTER TABLE users ADD COLUMN hide_followers INTEGER NOT NULL DEFAULT 0')
}

// users.avatar (NULL = the default avatar of the user, see avatars.js)
if (
  !db
    .prepare('PRAGMA table_info(users)')
    .all()
    .some((c) => c.name === 'avatar')
) {
  db.exec('ALTER TABLE users ADD COLUMN avatar TEXT')
}

// Private builds were removed: drop builds.is_public (and the old index that used it)
if (
  db
    .prepare('PRAGMA table_info(builds)')
    .all()
    .some((c) => c.name === 'is_public')
) {
  db.exec('DROP INDEX IF EXISTS idx_builds_filter')
  db.exec('ALTER TABLE builds DROP COLUMN is_public')
}
db.exec('CREATE INDEX IF NOT EXISTS idx_builds_filter ON builds(hero_id, career_id)')
