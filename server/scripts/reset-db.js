// Dev tool: wipe ALL data (users, builds, password reset tokens) and restart ids at 1.
// Usage (from the server/ folder):
//   npm run db:reset                                  -> wipes everything, no questions asked
//   node --env-file=.env scripts/reset-db.js          -> dry run: only shows what would be deleted
//   node --env-file=.env scripts/reset-db.js --yes    -> wipes everything
import { db } from '../src/db.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run with NODE_ENV=production.')
  process.exit(1)
}

const TABLES = ['password_resets', 'likes', 'comments', 'builds', 'users']
const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n

for (const t of TABLES) console.log(`${t}: ${count(t)} row(s)`)

if (!process.argv.includes('--yes')) {
  console.log('Dry run: nothing deleted. Add --yes to wipe everything.')
  process.exit(0)
}

db.transaction(() => {
  for (const t of TABLES) db.prepare(`DELETE FROM ${t}`).run()
  db.prepare('DELETE FROM sqlite_sequence').run() // next user / build gets id 1 again
})()

console.log('Database wiped.')
