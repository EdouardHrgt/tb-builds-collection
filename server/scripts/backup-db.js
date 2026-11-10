// Copies the live database to a dated file, then deletes the oldest copies.
// Safe while the server is running (SQLite online backup: a consistent snapshot, no need to stop anything).
// Usage (from the server/ folder):   npm run db:backup
// Daily with cron (03:30), keeping the 14 latest copies:
//   30 3 * * *  cd /path/to/server && /usr/bin/npm run db:backup >> backup.log 2>&1
// Settings (environment, optional): DB_PATH (same as the server), BACKUP_DIR (default ./backups),
// BACKUP_KEEP (default 14). Copy BACKUP_DIR somewhere else too (another machine / storage): a backup that sits
// on the same disk as the database does not survive the disk.
import fs from 'node:fs'
import path from 'node:path'
import { db } from '../src/db.js'

const dir = process.env.BACKUP_DIR || './backups'
const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14)
fs.mkdirSync(dir, { recursive: true })

const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '') // 2026-11-10-0330
const target = path.join(dir, `app-${stamp}.db`)

await db.backup(target)

// Sanity check: the copy opens and has the users table. Also switched to a plain single file (no -wal / -shm
// files to carry around when the copy is moved).
const { default: Database } = await import('better-sqlite3')
const copy = new Database(target)
copy.pragma('journal_mode = DELETE')
const users = copy.prepare('SELECT COUNT(*) AS n FROM users').get().n
copy.close()
console.log(`Backup written: ${target} (${users} user(s))`)

const old = fs
  .readdirSync(dir)
  .filter((f) => /^app-\d{4}-\d{2}-\d{2}-\d{4}\.db$/.test(f))
  .sort()
  .slice(0, -keep)
for (const f of old) {
  fs.unlinkSync(path.join(dir, f))
  console.log(`Old backup removed: ${f}`)
}
db.close()
