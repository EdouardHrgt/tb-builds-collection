// Dev tool: checks that every "icon" path used in the game data JSON files points to a real file
// in client/public (exact upper/lower case, which matters on Linux servers).
// Usage (from the server/ folder):  npm run check:icons
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(here, '../../client/public')
const FILES = [
  'heroes.json',
  'weapons.json',
  'weapon-options.json',
  'equipment-options.json',
  'enemies.json',
  'breakpoint-attacks.json',
]

// Every value of an "icon" key, with its position in the file
function collect(node, trail, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, `${trail}[${i}]`, out))
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const where = trail ? `${trail}.${key}` : key
      if (key === 'icon' && typeof value === 'string') out.push({ where, icon: value })
      else collect(value, where, out)
    }
  }
}

// Index of every file in public/, by lowercase name without extension -> ["/shared/x/necklace.png", ...]
const index = new Map()
;(function walk(dir, url) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const u = `${url}/${entry.name}`
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), u)
      continue
    }
    const key = path.parse(entry.name).name.toLowerCase()
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(u)
  }
})(PUBLIC_DIR, '')

const elsewhere = (icon) =>
  (index.get(path.parse(icon).name.toLowerCase()) ?? []).filter((u) => u !== icon).slice(0, 3)

// Follows the URL folder by folder with an EXACT name match (readdir returns the real names).
// Returns null when everything exists, else the first folder / file that does not.
function firstMissing(icon) {
  const segments = icon.split('/').filter(Boolean)
  let dir = PUBLIC_DIR
  const done = []
  for (let i = 0; i < segments.length; i++) {
    const exists = fs.existsSync(dir) && fs.readdirSync(dir).includes(segments[i])
    if (!exists)
      return { url: '/' + [...done, segments[i]].join('/'), isFile: i === segments.length - 1 }
    dir = path.join(dir, segments[i])
    done.push(segments[i])
  }
  return null
}

let total = 0
const folders = new Map() // missing folder -> { count, example }
const missingFiles = [] // file missing inside an existing folder
const other = [] // data file missing, bad path format...

for (const file of FILES) {
  const fullPath = path.join(DATA_DIR, file)
  if (!fs.existsSync(fullPath)) {
    other.push(`${file}: data file not found in ${DATA_DIR}`)
    continue
  }
  const icons = []
  collect(JSON.parse(fs.readFileSync(fullPath, 'utf8')), '', icons)
  for (const { where, icon } of icons) {
    total++
    if (!icon.startsWith('/')) {
      other.push(`${file} ${where}: "${icon}" must start with "/"`)
      continue
    }
    const missing = firstMissing(icon)
    if (!missing) continue
    if (missing.isFile) {
      missingFiles.push({ file, where, icon })
      continue
    }
    const entry = folders.get(missing.url) ?? { count: 0, file, where, icon }
    entry.count++
    folders.set(missing.url, entry)
  }
}

const show = (icon) => {
  const found = elsewhere(icon)
  if (found.length) console.log(`      same file name found at: ${found.join('  |  ')}`)
}

console.log(`Checked ${total} icon path(s) against ${PUBLIC_DIR}\n`)

if (other.length) {
  console.log('PROBLEMS')
  other.forEach((o) => console.log(`  ${o}`))
  console.log()
}

if (folders.size) {
  console.log('FOLDER NOT FOUND (every icon below this folder will be blank)')
  for (const [url, e] of folders) {
    console.log(`  ${url}   (${e.count} icon(s), first: ${e.file} ${e.where})\n      ${e.icon}`)
    show(e.icon)
  }
  console.log()
}

if (missingFiles.length) {
  console.log(`FILE NOT FOUND in an existing folder (${missingFiles.length})`)
  for (const f of missingFiles.slice(0, 25)) {
    console.log(`  ${f.icon}   (${f.file} ${f.where})`)
    show(f.icon)
  }
  if (missingFiles.length > 25) console.log(`  ... and ${missingFiles.length - 25} more`)
  console.log()
}

const bad = other.length + folders.size + missingFiles.length
if (!bad) console.log('All icons found.')
process.exit(bad ? 1 : 0)
