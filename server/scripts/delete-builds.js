// Admin tool: delete builds in bulk.
// Usage (from the server/ folder):
//   node --env-file=.env scripts/delete-builds.js old          -> dry run: builds in the outdated format
//   node --env-file=.env scripts/delete-builds.js old --yes    -> really delete them
//   node --env-file=.env scripts/delete-builds.js all [--yes]  -> same, for EVERY build
import { db } from '../src/db.js'

// Fixed conditions only (no user input is ever put in the SQL)
const CONDITIONS = {
  old: "json_extract(data, '$.v') IS NOT 2",
  all: '1',
}

const mode = process.argv[2]
if (!Object.hasOwn(CONDITIONS, mode)) {
  console.error('Usage: node --env-file=.env scripts/delete-builds.js <old|all> [--yes]')
  process.exit(1)
}

const where = CONDITIONS[mode]
const { n } = db.prepare(`SELECT COUNT(*) AS n FROM builds WHERE ${where}`).get()
console.log(`${n} build(s) match "${mode}"`)

if (process.argv[3] !== '--yes') {
  console.log('Dry run: nothing deleted. Add --yes to delete.')
  process.exit(0)
}

const result = db.prepare(`DELETE FROM builds WHERE ${where}`).run()
console.log(`Deleted ${result.changes} build(s).`)
