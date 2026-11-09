// Dev tool: creates 5 fake users with builds, follows, likes, bookmarks and comments, to try the site.
//
// Usage (from the server/ folder):
//   node --env-file=.env scripts/seed-test-users.js
//   node --env-file=.env scripts/seed-test-users.js --follow YourUsername
//
//   --follow NAME   also makes the existing account NAME follow every test user (and the test users
//                   follow NAME back), so the "Followed users" carousel and the follower counts have content.
//
// Safe to run again: users that already exist are skipped. All test accounts use the password below.
// The builds are generated from the real game data and checked with the same validation as the API.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { db } from '../src/db.js'
import { validateBuildData } from '../src/gameData.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run with NODE_ENV=production.')
  process.exit(1)
}

const PASSWORD = 'Test1234!'
const USERS = [
  { username: 'Grudge_Hunter', email: 'grudge.hunter@example.com' },
  { username: 'Ember-of-Ulric', email: 'ember.ulric@example.com' },
  { username: 'SkavenSlayer42', email: 'skaven.slayer42@example.com' },
  { username: 'Lady_Moonfire', email: 'lady.moonfire@example.com' },
  { username: 'Sigmars_Hammer', email: 'sigmars.hammer@example.com' },
]
const TITLES = [
  'Horde Clearer',
  'Boss Melter',
  'Cataclysm Ready',
  'Crit Machine',
  'Low Stamina Tank',
  'Ranged Support',
  'Slayer of Chaos',
  'Zero Dodge Run',
  'Elite Sniper',
  'Team Anchor',
]
const DESCRIPTIONS = [
  'A solid all-rounder for Modded Realm.',
  'Great against hordes, a bit weak against bosses.',
  'Take the team along and stay close to your allies.',
  '',
  'Needs good positioning. Dodge less, block more.',
]
const COMMENTS = [
  'Nice build, thanks for sharing!',
  'Works great on cataclysm.',
  'Which talent would you swap for the last row?',
  'Tried it yesterday, very fun.',
  'Love the breakpoints section.',
]

// --- Game data (same files as the server validation) ---
const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'))
const heroes = load('heroes.json')
const weapons = load('weapons.json').weapons
const weaponOptions = load('weapon-options.json')
const equipmentOptions = load('equipment-options.json').equipment
const enemies = load('enemies.json').enemies
const breakpointAttacks = load('breakpoint-attacks.json')
const TIERS = ['5', '10', '15', '20', '25', '30']

// Small seeded random generator: the same data every time
let seed = 20261109
function rnd() {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (n) => Math.floor(rnd() * n)
const pick = (list) => list[int(list.length)]
const sample = (list, n) => [...list].sort(() => rnd() - 0.5).slice(0, n)

const gear = (pool, weaponId) => {
  const traits = pool.traits.filter((t) => (t.onlyWeaponIds ? t.onlyWeaponIds.includes(weaponId) : !t.excludedWeaponIds?.includes(weaponId)))
  return { traitId: pick(traits).id, propertyIds: sample(pool.properties, 2).map((p) => p.id) }
}

function randomBuild() {
  const hero = pick(heroes)
  const career = pick(hero.careers)
  const slotTypes = { melee: ['melee'], ranged: career.secondWeaponTypes ?? ['ranged'] }
  const data = { v: 2, talents: TIERS.map((t) => Number(pick(career.talents[t]).id)), weapons: {}, equipment: {}, breakpoints: [], teammates: [] }

  for (const [slot, types] of Object.entries(slotTypes)) {
    const choices = weapons.filter((w) => w.heroId === hero.id && types.includes(w.type) && w.availableFor.includes(career.id))
    const weapon = pick(choices)
    data.weapons[slot] = { weaponId: weapon.id, ...gear(weaponOptions[weapon.type], weapon.id) }
  }
  for (const [slot, pool] of Object.entries(equipmentOptions)) data.equipment[slot] = gear(pool)

  const used = new Set()
  for (let i = int(4); i > 0; i--) {
    const type = pick(Object.keys(breakpointAttacks))
    const attack = pick(breakpointAttacks[type].attacks).id
    if (used.has(`${type}/${attack}`)) continue
    used.add(`${type}/${attack}`)
    const chosen = new Set(sample(enemies, 1 + int(6)).map((e) => e.id))
    data.breakpoints.push({ type, attack, enemyIds: enemies.filter((e) => chosen.has(e.id)).map((e) => e.id) }) // catalog order
  }
  for (const h of sample(heroes.filter((x) => x.id !== hero.id), int(4))) {
    data.teammates.push({ heroId: h.id, careerId: pick(h.careers).id })
  }
  return { heroId: hero.id, careerId: career.id, data }
}

// --- Insert ---
const hash = bcrypt.hashSync(PASSWORD, 10)
const followIndex = process.argv.indexOf('--follow')
const followName = followIndex > -1 ? process.argv[followIndex + 1] : null

const insertUser = db.prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
const findUser = db.prepare('SELECT id FROM users WHERE username = ?')
const insertBuild = db.prepare(
  `INSERT INTO builds (user_id, title, description, hero_id, career_id, data, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`,
)
const follow = db.prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)')
const like = db.prepare('INSERT OR IGNORE INTO likes (user_id, build_id) VALUES (?, ?)')
const bookmark = db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, build_id) VALUES (?, ?)')
const comment = db.prepare('INSERT INTO comments (build_id, user_id, body) VALUES (?, ?, ?)')

const ids = []
const buildIds = []
db.transaction(() => {
  for (const u of USERS) {
    if (findUser.get(u.username)) {
      console.log(`skip   ${u.username} (already exists)`)
      continue
    }
    const userId = insertUser.run(u.email, u.username, hash).lastInsertRowid
    ids.push(userId)
    let created = 0
    for (let n = 2 + int(3); created < n; ) {
      const b = randomBuild()
      if (validateBuildData(b)) continue // (never expected) invalid combination: draw again
      const age = `-${1 + int(200)} hours`
      const title = `${pick(TITLES)} #${1 + int(99)}`
      const info = insertBuild.run(userId, title, pick(DESCRIPTIONS), b.heroId, b.careerId, JSON.stringify(b.data), age, age)
      buildIds.push(info.lastInsertRowid)
      created++
    }
    console.log(`create ${u.username} (${created} builds)`)
  }

  // Everybody follows a few others; likes, bookmarks and comments on random builds
  for (const a of ids) {
    for (const b of sample(ids.filter((x) => x !== a), 1 + int(3))) follow.run(a, b)
    for (const b of sample(buildIds, 3 + int(5))) {
      like.run(a, b)
      if (rnd() < 0.4) bookmark.run(a, b)
      if (rnd() < 0.3) comment.run(b, a, pick(COMMENTS))
    }
  }

  if (followName) {
    const me = findUser.get(followName)
    if (!me) console.warn(`--follow: no account named "${followName}"`)
    else {
      for (const u of USERS) {
        const id = findUser.get(u.username)?.id
        if (!id) continue
        follow.run(me.id, id)
        follow.run(id, me.id)
      }
      console.log(`${followName} and the test users now follow each other`)
    }
  }
})()

console.log(`Done. Log in with any username above or its email, password: ${PASSWORD}`)
