import heroes from '../data/heroes.json'
import weaponsData from '../data/weapons.json'
import weaponOptions from '../data/weapon-options.json'
import equipmentData from '../data/equipment-options.json'
import enemiesData from '../data/enemies.json'
import breakpointData from '../data/breakpoint-attacks.json'

// Talent tiers in display order (keys of `career.talents` in heroes.json)
const TIERS = ['5', '10', '15', '20', '25', '30']

// The two weapon slots of a build. Their KEYS are what builds store ('melee' / 'ranged').
// A career with `"secondWeaponType": "melee"` in heroes.json (Grail Knight, Slayer, Warrior Priest)
// has no ranged weapon: its second slot, still stored under the key 'ranged', holds a second melee weapon.
const WEAPON_SLOTS = [
  { key: 'melee', label: 'Melee weapon' },
  { key: 'ranged', label: 'Ranged weapon' },
]

// [{ id: 'necklace', name, icon, traits, properties }, ...] (order of equipment-options.json)
const EQUIPMENT_SLOTS = Object.values(equipmentData.equipment)

const weapons = weaponsData.weapons

const getHero = (id) => heroes.find((h) => h.id === id)
const getCareer = (heroId, careerId) => getHero(heroId)?.careers.find((c) => c.id === careerId)
const heroName = (id) => getHero(id)?.name ?? id
const careerName = (heroId, careerId) => getCareer(heroId, careerId)?.name ?? careerId

// Always 6 rows, even if a tier has no data yet: [{ tier: '5', talents: [...] }, ...]
function getCareerTalents(heroId, careerId) {
  const talents = getCareer(heroId, careerId)?.talents ?? {}
  return TIERS.map((tier) => ({ tier, talents: talents[tier] ?? [] }))
}

// The weapon slots of a career: [{ key, type, label }]. `type` ('melee' | 'ranged') decides which
// weapons can be picked and which traits / properties apply; `key` is where the build stores the choice.
function getWeaponSlots(heroId, careerId) {
  const secondType = getCareer(heroId, careerId)?.secondWeaponType ?? 'ranged'
  if (secondType === 'melee') {
    return [
      { key: 'melee', type: 'melee', label: 'Melee weapon 1' },
      { key: 'ranged', type: 'melee', label: 'Melee weapon 2' },
    ]
  }
  return WEAPON_SLOTS.map((s) => ({ ...s, type: s.key }))
}

// Some traits only exist on certain weapons (weapon-options.json):
//   onlyWeaponIds      -> the trait is exclusive to these weapons (e.g. Heat Sink: Sienna's staves)
//   excludedWeaponIds  -> the trait is available everywhere except on these weapons
// Without a weapon picked yet, exclusive traits are hidden and the others are offered.
// Keep in sync with isTraitAllowed in the server (gameData.js).
function isTraitAllowed(trait, weaponId) {
  if (trait.onlyWeaponIds) return !!weaponId && trait.onlyWeaponIds.includes(weaponId)
  return !(weaponId && trait.excludedWeaponIds?.includes(weaponId))
}

const getHeroWeapons = (heroId, type) =>
  weapons.filter((w) => w.heroId === heroId && w.type === type)

const getAvailableWeapons = (heroId, careerId, type) =>
  getHeroWeapons(heroId, type).filter((w) => w.availableFor.includes(careerId))

// { traits, properties } for 'melee' or 'ranged'
const getWeaponOptions = (type) => weaponOptions[type]

// --- Fast breakpoints ---

// [{ id: 'specials', name: 'Specials', enemies: [...] }, { id: 'elites', ... }] (order of enemies.json)
const ENEMY_CATEGORIES = enemiesData.categories.map((c) => ({
  ...c,
  enemies: enemiesData.enemies.filter((e) => e.category === c.id),
}))
const ENEMY_IDS = ENEMY_CATEGORIES.flatMap((c) => c.enemies.map((e) => e.id)) // catalog order
const getEnemy = (id) => enemiesData.enemies.find((e) => e.id === id)

// [{ id: 'ranged', name, icon, attacks: [{ id, name }] }, { id: 'melee', ... }] (order of the JSON file)
const BREAKPOINT_TYPES = Object.entries(breakpointData).map(([id, type]) => ({ id, ...type }))
const getBreakpointType = (id) => BREAKPOINT_TYPES.find((t) => t.id === id)
const getAttack = (typeId, attackId) =>
  getBreakpointType(typeId)?.attacks.find((a) => a.id === attackId)

export function useGameData() {
  return {
    heroes,
    TIERS,
    WEAPON_SLOTS,
    EQUIPMENT_SLOTS,
    ENEMY_CATEGORIES,
    ENEMY_IDS,
    BREAKPOINT_TYPES,
    getHero,
    getCareer,
    heroName,
    careerName,
    getCareerTalents,
    getHeroWeapons,
    getAvailableWeapons,
    getWeaponSlots,
    isTraitAllowed,
    getWeaponOptions,
    getEnemy,
    getBreakpointType,
    getAttack,
  }
}
