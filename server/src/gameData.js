import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The server reads the same JSON files as the front end (restart the server after editing them).
const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')

const FILES = [
  'balance.json',
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

// Tourney Balance version, saved in every build when it is created or edited
export const BALANCE_VERSION = String(load('balance.json').version)
const heroes = load('heroes.json')
const weapons = load('weapons.json').weapons
const weaponOptions = load('weapon-options.json') // { melee: {traits, properties}, ranged: {...} }
const equipmentOptions = load('equipment-options.json').equipment // { necklace: {...}, charm: {...}, trinket: {...} }
const enemies = load('enemies.json').enemies // [{ id, name, category, icon }]
const breakpointOptions = load('breakpoint-attacks.json') // { types: [{ id, kinds }], zones, boosters }

const TIERS = ['5', '10', '15', '20', '25', '30']
const has = (obj, key) => Object.hasOwn(obj, key)

// Some traits only exist on certain weapons (weapon-options.json):
//   onlyWeaponIds      -> exclusive to these weapons (e.g. Heat Sink: Sienna's staves)
//   excludedWeaponIds  -> available everywhere except on these weapons
// Keep in sync with isTraitAllowed in the client (composables/useGameData.js).
const isTraitAllowed = (trait, weaponId) =>
  trait.onlyWeaponIds
    ? !!weaponId && trait.onlyWeaponIds.includes(weaponId)
    : !(weaponId && trait.excludedWeaponIds?.includes(weaponId))

function checkOptions(sel, pool, slot) {
  if (sel.traitId && !pool.traits.some((t) => t.id === sel.traitId)) return `${slot}: unknown trait`
  for (const id of sel.propertyIds) {
    if (!pool.properties.some((p) => p.id === id)) return `${slot}: unknown property`
  }
  // Properties of which only one can be picked (`exclusiveProperties` in weapon-options.json, weapons only)
  for (const group of pool.exclusiveProperties ?? []) {
    if (group.filter((id) => sel.propertyIds.includes(id)).length > 1) {
      const names = group.map((id) => pool.properties.find((p) => p.id === id)?.name ?? id)
      return `${slot}: pick only one of these properties: ${names.join(' / ')}`
    }
  }
  return null
}

// Names and portrait of a hero / career, for the link previews (server/src/meta.js). null if unknown.
export function getHeroCareer(heroId, careerId) {
  const hero = heroes.find((h) => h.id === heroId)
  const career = hero?.careers.find((c) => c.id === careerId)
  return hero && career ? { heroName: hero.name, careerName: career.name, icon: career.icon ?? null } : null
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

  // Two weapon slots, stored under the keys 'melee' and 'ranged'. What the second one accepts is set by
  // `"secondWeaponTypes"` in heroes.json: ["melee"] (Grail Knight, Warrior Priest: a second melee weapon),
  // ["melee", "ranged"] (Slayer: melee weapon or throwing axes). Default: ["ranged"].
  const slotTypes = { melee: ['melee'], ranged: career.secondWeaponTypes ?? ['ranged'] }
  for (const [slot, sel] of Object.entries(data.weapons)) {
    if (!has(slotTypes, slot)) return `Unknown weapon slot: ${slot}`
    let type = slotTypes[slot][0] // without a weapon: the first accepted kind
    if (sel.weaponId) {
      const weapon = weapons.find((w) => w.id === sel.weaponId && w.heroId === heroId && slotTypes[slot].includes(w.type))
      if (!weapon || !weapon.availableFor.includes(careerId)) {
        return `${slot}: this weapon is not available for this career`
      }
      type = weapon.type // traits and properties depend on the kind of weapon
    }
    const err = checkOptions(sel, weaponOptions[type], slot)
    if (err) return err
    const trait = weaponOptions[type].traits.find((t) => t.id === sel.traitId)
    if (trait && !isTraitAllowed(trait, sel.weaponId)) {
      return `${slot}: this trait is not available on this weapon`
    }
  }

  for (const [slot, sel] of Object.entries(data.equipment)) {
    if (!has(equipmentOptions, slot)) return `Unknown equipment slot: ${slot}`
    const err = checkOptions(sel, equipmentOptions[slot], slot)
    if (err) return err
  }

  // Fast breakpoint cards: 1 or 2 hits (the schema limits that), each a kind of hit of the card's type landing on a
  // known zone; known boosters and enemies, none listed twice. Two cards with the same hits, crit and boosters
  // would only differ by their enemies: the second one is refused.
  // Keep the key in sync with breakpointKey in the client (utils/breakpoints.js).
  const usedCards = new Set()
  for (const card of data.breakpoints ?? []) {
    const type = breakpointOptions.types.find((t) => t.id === card.type)
    if (!type) return 'Breakpoint: unknown attack type'
    for (const hit of card.hits) {
      if (!type.kinds.some((k) => k.id === hit.kind)) {
        return 'Breakpoint: this kind of hit does not exist for this type'
      }
      if (!breakpointOptions.zones.some((z) => z.id === hit.zone)) return 'Breakpoint: unknown target'
    }
    if (new Set(card.boosters).size !== card.boosters.length) return 'Breakpoint: a booster is listed twice'
    if (!card.boosters.every((id) => breakpointOptions.boosters.some((b) => b.id === id))) {
      return 'Breakpoint: unknown booster'
    }
    const key = [
      card.type,
      card.hits.map((h) => `${h.kind}:${h.zone}`).join('>'),
      card.crit ? 'crit' : '',
      [...card.boosters].sort().join(','),
    ].join('|')
    if (usedCards.has(key)) return 'Breakpoint: two cards are identical'
    usedCards.add(key)
    if (new Set(card.enemyIds).size !== card.enemyIds.length)
      return 'Breakpoint: an enemy is listed twice'
    if (!card.enemyIds.every((id) => enemies.some((e) => e.id === id)))
      return 'Breakpoint: unknown enemy'
  }
  // Recommended teammates: careers of OTHER heroes, at most one per hero (a team has one of each hero)
  const teamHeroes = new Set()
  for (const mate of data.teammates ?? []) {
    const mateHero = heroes.find((h) => h.id === mate.heroId)
    if (!mateHero || !mateHero.careers.some((c) => c.id === mate.careerId)) {
      return 'Teammate: unknown hero or career'
    }
    if (mate.heroId === heroId) return 'Teammate: it cannot be the same hero as the build'
    if (teamHeroes.has(mate.heroId)) return 'Teammate: a team has only one of each hero'
    teamHeroes.add(mate.heroId)
  }
  // A team description needs a team
  if (data.teamDescription && !(data.teammates ?? []).length) {
    return 'Team description: pick at least one teammate first'
  }
  return null
}
