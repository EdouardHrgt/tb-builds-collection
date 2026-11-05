import heroes from './heroes.json'

export { heroes }
export const heroName = (id) => heroes.find((h) => h.id === id)?.name ?? id
export const careerName = (heroId, careerId) =>
  heroes.find((h) => h.id === heroId)?.careers.find((c) => c.id === careerId)?.name ?? careerId

export const ITEM_SLOTS = [
  { key: 'melee', label: 'Melee weapon' },
  { key: 'ranged', label: 'Ranged weapon' },
  { key: 'necklace', label: 'Necklace' },
  { key: 'charm', label: 'Charm' },
  { key: 'trinket', label: 'Trinket' },
]
