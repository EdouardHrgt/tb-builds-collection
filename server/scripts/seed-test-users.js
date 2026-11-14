// Dev tool: creates 5 fake users with builds, follows, likes, bookmarks and comments, to try the site.
//
// Usage (from the server/ folder):
//   node --env-file=.env scripts/seed-test-users.js
//   node --env-file=.env scripts/seed-test-users.js --follow YourUsername
//
//   --follow NAME   also makes the existing account NAME follow every test user (and the test users
//                   follow NAME back), so the "Followed users" carousel and the follower counts have content.
//
//   --new-builds NAME  to try the "new builds from people I follow" counter: NAME (an existing account) follows every test
//                   user since a day ago, has opened none of their builds, and each test user gets 1-2 builds
//                   published in the last hour. Log in as NAME: the Builds link shows the counter, and a build stops
//                   being "new" when NAME opens it. Can be run several times (each run adds builds and makes
//                   everything new again). Dev database only.
//   --outdated NAME    gives the existing account NAME 2 builds made for an older Tourney Balance version (V37.0), to
//                   see the "Outdated" tag and the notice of the profile page. Each run adds 2 builds. Dev only.
//
//   --new-comments NAME  to try the unread comments: two test users comment the latest build of the existing account NAME,
//                   and, when NAME has already commented a build, a test user answers in that thread. Log in as NAME: the
//                   menu shows a counter, the profile page lists the builds and the comments are marked "New" until
//                   NAME opens the build. Each run adds comments. Dev database only.
//
// Safe to run again: users that already exist are skipped (their avatar and privacy setting are still applied). All test accounts use the password below.
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
  { username: 'Grudge_Hunter', email: 'grudge.hunter@example.com', avatar: 'avatar-2' },
  { username: 'Ember-of-Ulric', email: 'ember.ulric@example.com', avatar: 'avatar-5' },
  { username: 'SkavenSlayer42', email: 'skaven.slayer42@example.com', hideFollowers: true }, // to test the privacy setting
  { username: 'Lady_Moonfire', email: 'lady.moonfire@example.com', avatar: 'avatar-9' },
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
const breakpointOptions = load('breakpoint-attacks.json')
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
  // Weapons cannot have two properties of the same exclusive group (power vs skaven + power vs chaos)
  let propertyIds
  do {
    propertyIds = sample(pool.properties, 2).map((p) => p.id)
  } while ((pool.exclusiveProperties ?? []).some((g) => g.every((id) => propertyIds.includes(id))))
  return { traitId: pick(traits).id, propertyIds }
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
    const type = pick(breakpointOptions.types)
    const hits = Array.from({ length: 1 + int(2) }, () => ({ kind: pick(type.kinds).id, zone: pick(breakpointOptions.zones).id, crit: rnd() < 0.3 }))
    const boosters = rnd() < 0.3 ? [pick(breakpointOptions.boosters).id] : []
    const key = JSON.stringify([type.id, hits, boosters])
    if (used.has(key)) continue
    used.add(key)
    const chosen = new Set(sample(enemies, 1 + int(6)).map((e) => e.id))
    data.breakpoints.push({ type: type.id, hits, boosters, enemyIds: enemies.filter((e) => chosen.has(e.id)).map((e) => e.id) }) // catalog order
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
const outdatedIndex = process.argv.indexOf('--outdated')
const outdatedName = outdatedIndex > -1 ? process.argv[outdatedIndex + 1] : null
const commentsIndex = process.argv.indexOf('--new-comments')
const commentsName = commentsIndex > -1 ? process.argv[commentsIndex + 1] : null
const newIndex = process.argv.indexOf('--new-builds')
const newName = newIndex > -1 ? process.argv[newIndex + 1] : null

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

const setHidden = db.prepare('UPDATE users SET hide_followers = ? WHERE username = ?')
const setAvatar = db.prepare('UPDATE users SET avatar = ? WHERE username = ?')
const ids = []
const buildIds = []
db.transaction(() => {
  for (const u of USERS) {
    if (findUser.get(u.username)) {
      console.log(`skip   ${u.username} (already exists)`)
      if (u.hideFollowers) setHidden.run(1, u.username) // the privacy setting is also applied to an existing account
      if (u.avatar) setAvatar.run(u.avatar, u.username) // and so is the avatar (the others keep the default one)
      continue
    }
    const userId = insertUser.run(u.email, u.username, hash).lastInsertRowid
    ids.push(userId)
    if (u.hideFollowers) setHidden.run(1, u.username)
    if (u.avatar) setAvatar.run(u.avatar, u.username)
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

  if (outdatedName) {
    const me = findUser.get(outdatedName)
    if (!me) console.warn(`--outdated: no account named "${outdatedName}"`)
    else {
      for (let n = 2; n > 0; ) {
        const b = randomBuild()
        if (validateBuildData(b)) continue
        b.data.balance = 'V37.0' // an older version than the current one (client/src/data/balance.json)
        const age = `-${1 + int(5)} minutes`
        insertBuild.run(me.id, `${pick(TITLES)} #${1 + int(99)} (old TB)`, 'Made for an older Tourney Balance version.', b.heroId, b.careerId, JSON.stringify(b.data), age, age)
        n--
      }
      console.log(`${outdatedName} now has 2 builds made for Tourney Balance V37.0`)
    }
  }

  if (commentsName) {
    const me = findUser.get(commentsName)
    const others = USERS.map((u) => findUser.get(u.username)?.id).filter((id) => id && id !== me?.id)
    const mine = me && db.prepare('SELECT id FROM builds WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(me.id)
    if (!me) console.warn(`--new-comments: no account named "${commentsName}"`)
    else if (!mine) console.warn(`--new-comments: ${commentsName} has no build to comment`)
    else {
      let added = 0
      for (const id of sample(others, 2)) {
        comment.run(mine.id, id, pick(COMMENTS))
        added++
      }
      // an answer in a thread where NAME wrote (a comment on somebody else's build)
      const thread = db
        .prepare('SELECT id, build_id FROM comments WHERE user_id = ? AND parent_id IS NULL ORDER BY id DESC LIMIT 1')
        .get(me.id)
      if (thread) {
        db.prepare('INSERT INTO comments (build_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)').run(
          thread.build_id,
          pick(others),
          thread.id,
          pick(COMMENTS),
        )
        added++
      }
      console.log(`${added} unread comment(s) for ${commentsName}: log in as ${commentsName} to see the counter`)
    }
  }

  if (newName) {
    const me = findUser.get(newName)
    if (!me) console.warn(`--new-builds: no account named "${newName}"`)
    else {
      let added = 0
      for (const u of USERS) {
        const id = findUser.get(u.username)?.id
        if (!id || id === me.id) continue
        follow.run(me.id, id)
        db.prepare("UPDATE follows SET created_at = datetime('now', '-1 day') WHERE follower_id = ? AND followed_id = ?").run(me.id, id)
        for (let n = 1 + int(2); n > 0; ) {
          const b = randomBuild()
          if (validateBuildData(b)) continue
          const age = `-${1 + int(59)} minutes`
          const title = `${pick(TITLES)} #${1 + int(99)}`
          insertBuild.run(id, title, pick(DESCRIPTIONS), b.heroId, b.careerId, JSON.stringify(b.data), age, age)
          added++
          n--
        }
      }
      // nothing opened yet: everything published since the follow is new for NAME
      db.prepare('DELETE FROM build_seen WHERE user_id = ?').run(me.id)
      console.log(`${newName} follows the test users, ${added} new build(s) published: log in as ${newName} to see the counter`)
    }
  }
})()

console.log(`Done. Log in with any username above or its email, password: ${PASSWORD}`)
