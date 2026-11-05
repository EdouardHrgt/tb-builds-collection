import heroes from '../data/heroes.json'
import weaponsData from '../data/weapons.json'
import weaponOptions from '../data/weapon-options.json'
import equipmentData from '../data/equipment-options.json'

// Talent tiers in display order (keys of `career.talents` in heroes.json)
const TIERS = ['5', '10', '15', '20', '25', '30']

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

const getHeroWeapons = (heroId, type) =>
  weapons.filter((w) => w.heroId === heroId && w.type === type)

const getAvailableWeapons = (heroId, careerId, type) =>
  getHeroWeapons(heroId, type).filter((w) => w.availableFor.includes(careerId))

// { traits, properties } for 'melee' or 'ranged'
const getWeaponOptions = (type) => weaponOptions[type]

export function useGameData() {
  return {
    heroes,
    TIERS,
    WEAPON_SLOTS,
    EQUIPMENT_SLOTS,
    getHero,
    getCareer,
    heroName,
    careerName,
    getCareerTalents,
    getHeroWeapons,
    getAvailableWeapons,
    getWeaponOptions,
  }
}
