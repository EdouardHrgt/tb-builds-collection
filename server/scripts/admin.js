// Admin tool for the production database: users, builds and comments.
// Usage (from the server/ folder, on the machine that holds the database):
//   npm run admin -- <command> [arguments] [--yes]
// Commands:
//   users [text]            list users (optionally filtered by username / email)
//   user <name|id>          details of one user
//   export <user>           writes all the data of an account to exports/<name>-<date>.json (GDPR access request)
//   reset-password <user>   sets a new random password and prints it (the user is logged out everywhere)
//   logout <user>           logs the user out of every device
//   delete-user <user>      deletes the account AND everything it owns (builds, comments, likes, follows)
//   builds <user>           list the builds of a user
//   delete-build <id>       deletes a build (its likes, bookmarks and comments go with it)
//   comments <build id>     list the comments of a build, with their ids
//   delete-comment <id>     deletes a comment (and the replies under it)
// Destructive commands ask for confirmation; --yes skips the question (scripts).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import bcrypt from 'bcryptjs'
import { db } from '../src/db.js'

const args = process.argv.slice(2)
const yes = args.includes('--yes')
const [command, ...rest] = args.filter((a) => a !== '--yes')
const target = rest.join(' ').trim()

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

function findUser(ref) {
  if (!ref) fail('Missing user (username, email or id).')
  const user = /^\d+$/.test(ref)
    ? db.prepare('SELECT * FROM users WHERE id = ?').get(Number(ref))
    : db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(ref, ref.toLowerCase())
  if (!user) fail(`No user matches "${ref}".`)
  return user
}

async function confirm(question) {
  if (yes) return
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} Type "yes" to continue: `)).trim().toLowerCase()
  rl.close()
  if (answer !== 'yes') fail('Cancelled, nothing changed.')
}

const count = (sql, ...p) => db.prepare(sql).get(...p).n

// Random password that satisfies the site rules (8-72 chars, a number, a special character)
function randomPassword() {
  const pick = (chars) => chars[crypto.randomInt(chars.length)]
  const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const chars = Array.from({ length: 12 }, () => pick(letters))
  chars.push(pick('23456789'), pick('!#$%&*+-=?@'))
  return chars.sort(() => crypto.randomInt(3) - 1).join('')
}

const table = (rows) => (rows.length ? console.table(rows) : console.log('(nothing)'))

switch (command) {
  case 'users': {
    const like = `%${target}%`
    table(
      db
        .prepare(
          `SELECT u.id, u.username, u.email, u.created_at,
                  (SELECT COUNT(*) FROM builds b WHERE b.user_id = u.id) AS builds
           FROM users u WHERE u.username LIKE ? OR u.email LIKE ? ORDER BY u.id`,
        )
        .all(like, like),
    )
    break
  }
  case 'user': {
    const u = findUser(target)
    console.log({
      id: u.id,
      username: u.username,
      email: u.email,
      created_at: u.created_at,
      builds: count('SELECT COUNT(*) AS n FROM builds WHERE user_id = ?', u.id),
      comments: count('SELECT COUNT(*) AS n FROM comments WHERE user_id = ?', u.id),
      followers: count('SELECT COUNT(*) AS n FROM follows WHERE followed_id = ?', u.id),
    })
    break
  }
  case 'export': {
    // Everything the site holds about the account, except the password hash and the session counter.
    const u = findUser(target)
    const all = (sql) => db.prepare(sql).all(u.id)
    const data = {
      exportedAt: new Date().toISOString(),
      account: {
        id: u.id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        hideFollowers: !!u.hide_followers,
        createdAt: u.created_at,
      },
      builds: all(
        'SELECT id, title, description, hero_id, career_id, data, created_at, updated_at FROM builds WHERE user_id = ? ORDER BY id',
      ).map((b) => ({ ...b, data: JSON.parse(b.data) })),
      comments: all('SELECT id, build_id, parent_id, body, created_at FROM comments WHERE user_id = ? ORDER BY id'),
      likedBuilds: all('SELECT build_id, created_at FROM likes WHERE user_id = ? ORDER BY created_at'),
      bookmarkedBuilds: all('SELECT build_id, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at'),
      following: all(
        'SELECT u2.username, f.created_at FROM follows f JOIN users u2 ON u2.id = f.followed_id WHERE f.follower_id = ? ORDER BY f.created_at',
      ),
      followers: all(
        'SELECT u2.username, f.created_at FROM follows f JOIN users u2 ON u2.id = f.follower_id WHERE f.followed_id = ? ORDER BY f.created_at',
      ),
    }
    const dir = process.env.EXPORT_DIR || './exports'
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    const file = path.join(dir, `${u.username}-${new Date().toISOString().slice(0, 10)}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2), { mode: 0o600 })
    console.log(`Export written: ${file}`)
    console.log('It contains personal data: send it to the person privately, then delete the file.')
    break
  }
  case 'reset-password': {
    const u = findUser(target)
    await confirm(`Set a new password for "${u.username}" (${u.email})?`)
    const password = randomPassword()
    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(
        bcrypt.hashSync(password, 10),
        u.id,
      )
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(u.id)
    })()
    console.log(`New password for ${u.username}: ${password}`)
    console.log('Send it to the user privately; they can change it in My builds > Account.')
    break
  }
  case 'logout': {
    const u = findUser(target)
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(u.id)
    console.log(`${u.username} is logged out of every device.`)
    break
  }
  case 'delete-user': {
    const u = findUser(target)
    const nb = count('SELECT COUNT(*) AS n FROM builds WHERE user_id = ?', u.id)
    const nc = count('SELECT COUNT(*) AS n FROM comments WHERE user_id = ?', u.id)
    await confirm(`Delete "${u.username}" (${u.email}) with ${nb} build(s) and ${nc} comment(s)? This cannot be undone.`)
    db.prepare('DELETE FROM users WHERE id = ?').run(u.id) // ON DELETE CASCADE removes everything else
    console.log('Account deleted.')
    break
  }
  case 'builds': {
    const u = findUser(target)
    table(
      db
        .prepare(
          `SELECT id, title, hero_id, career_id, created_at,
                  (SELECT COUNT(*) FROM likes l WHERE l.build_id = builds.id) AS likes
           FROM builds WHERE user_id = ? ORDER BY id`,
        )
        .all(u.id),
    )
    break
  }
  case 'delete-build': {
    const b = db
      .prepare('SELECT b.id, b.title, u.username FROM builds b JOIN users u ON u.id = b.user_id WHERE b.id = ?')
      .get(Number(target))
    if (!b) fail(`No build with id "${target}".`)
    await confirm(`Delete build #${b.id} "${b.title}" by ${b.username}?`)
    db.prepare('DELETE FROM builds WHERE id = ?').run(b.id)
    console.log('Build deleted.')
    break
  }
  case 'comments': {
    table(
      db
        .prepare(
          `SELECT c.id, c.parent_id, u.username, substr(c.body, 1, 80) AS body, c.created_at
           FROM comments c JOIN users u ON u.id = c.user_id WHERE c.build_id = ? ORDER BY c.id`,
        )
        .all(Number(target)),
    )
    break
  }
  case 'delete-comment': {
    const c = db
      .prepare('SELECT c.id, substr(c.body, 1, 80) AS body, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?')
      .get(Number(target))
    if (!c) fail(`No comment with id "${target}".`)
    const replies = count('SELECT COUNT(*) AS n FROM comments WHERE parent_id = ?', c.id)
    await confirm(`Delete comment #${c.id} by ${c.username} ("${c.body}") and its ${replies} repl(ies)?`)
    db.prepare('DELETE FROM comments WHERE id = ?').run(c.id)
    console.log('Comment deleted.')
    break
  }
  default:
    console.log(
      'Commands: users [text] | user <u> | export <u> | reset-password <u> | logout <u> | delete-user <u> | builds <u> | delete-build <id> | comments <build id> | delete-comment <id>   (add --yes to skip confirmations)',
    )
}
db.close()
