import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The server reads the same JSON files as the front end (restart the server after editing them).
const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')

const FILES = [
  'heroes.json',
  'weapons.json',
  'weapon-options.json',
  'equipment-options.json',
  'enemies.json',
  'breakpoint-attacks.json',
]
const missing = FILES.filter((f) => !fs.existsSync(path.join(DATA_DIR, f)))
if (missing.length) {
  throw new Error(`Missing game data file(s) in ${DATA_DIR}: ${missing.join(', ')}`)
}

const load = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))

const heroes = load('heroes.json')
const weapons = load('weapons.json').weapons
const weaponOptions = load('weapon-options.json') // { melee: {traits, properties}, ranged: {...} }
const equipmentOptions = load('equipment-options.json').equipment // { necklace: {...}, charm: {...}, trinket: {...} }
const enemies = load('enemies.json').enemies // [{ id, name, category, icon }]
const breakpointAttacks = load('breakpoint-attacks.json') // { ranged: { attacks: [...] }, melee: { attacks: [...] } }

const TIERS = ['5', '10', '15', '20', '25', '30']
const has = (obj, key) => Object.hasOwn(obj, key)

function checkOptions(sel, pool, slot) {
  if (sel.traitId && !pool.traits.some((t) => t.id === sel.traitId)) return `${slot}: unknown trait`
  for (const id of sel.propertyIds) {
    if (!pool.properties.some((p) => p.id === id)) return `${slot}: unknown property`
  }
  return null
}

// Checks that every id in a (structurally valid) build exists and is compatible.
// Returns an error message, or null when the build is valid.
export function validateBuildData({ heroId, careerId, data }) {
  const hero = heroes.find((h) => h.id === heroId)
  if (!hero) return 'Unknown hero'
  const career = hero.careers.find((c) => c.id === careerId)
  if (!career) return 'Unknown career for this hero'

  for (let i = 0; i < TIERS.length; i++) {
    const pick = data.talents[i]
    const tierTalents = career.talents?.[TIERS[i]] ?? []
    if (pick && !tierTalents.some((t) => t.id === String(pick))) {
      return `Invalid talent for level ${TIERS[i]}`
    }
  }

  for (const [slot, sel] of Object.entries(data.weapons)) {
    if (!has(weaponOptions, slot)) return `Unknown weapon slot: ${slot}`
    if (sel.weaponId) {
      const weapon = weapons.find((w) => w.id === sel.weaponId && w.heroId === heroId)
      if (!weapon || weapon.type !== slot || !weapon.availableFor.includes(careerId)) {
        return `${slot}: this weapon is not available for this career`
      }
    }
    const err = checkOptions(sel, weaponOptions[slot], slot)
    if (err) return err
  }

  for (const [slot, sel] of Object.entries(data.equipment)) {
    if (!has(equipmentOptions, slot)) return `Unknown equipment slot: ${slot}`
    const err = checkOptions(sel, equipmentOptions[slot], slot)
    if (err) return err
  }

  // Fast breakpoint cards: the attack must belong to the card's type, enemies must exist,
  // and an attack can only have one card (a second one would just be more enemies on the first)
  const usedAttacks = new Set()
  for (const card of data.breakpoints ?? []) {
    if (!has(breakpointAttacks, card.type)) return 'Breakpoint: unknown attack type'
    if (!breakpointAttacks[card.type].attacks.some((a) => a.id === card.attack)) {
      return 'Breakpoint: this attack does not exist for this type'
    }
    const key = `${card.type}/${card.attack}`
    if (usedAttacks.has(key)) return 'Breakpoint: two cards use the same attack'
    usedAttacks.add(key)
    if (new Set(card.enemyIds).size !== card.enemyIds.length)
      return 'Breakpoint: an enemy is listed twice'
    if (!card.enemyIds.every((id) => enemies.some((e) => e.id === id)))
      return 'Breakpoint: unknown enemy'
  }

  return null
}
