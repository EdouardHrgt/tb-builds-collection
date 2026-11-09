// Text version of a build, for the "Export the build" button (easy to paste in Discord, a forum...).
//
//   TITLE
//   TALENTS: 1-1-2-3-1-2
//   WEAPONS:
//     WEAPON_NAME | trait | property 1 | property 2
//   EQUIPMENT:
//     NECKLACE | trait | property 1 | property 2
//   BREAKPOINTS:
//     ATTACK: ENEMIES_LIST
//   DESCRIPTION:
//   BUILD DESCRIPTION
//
// `gd` is the game data (the object returned by useGameData()): this function stays pure and testable.
export function buildToText(build, gd) {
  const data = build.data ?? {}
  const nameOf = (list, id) => list?.find((x) => x.id === id)?.name ?? '-'
  const gear = (name, sel = {}, traits, properties) =>
    `  ${[name, nameOf(traits, sel.traitId), nameOf(properties, sel.propertyIds?.[0]), nameOf(properties, sel.propertyIds?.[1])].join(' | ')}`

  const lines = [build.title, `TALENTS: ${(data.talents ?? []).join('-')}`, 'WEAPONS:']

  for (const slot of gd.getWeaponSlots(build.heroId, build.careerId)) {
    const sel = data.weapons?.[slot.key] ?? {}
    const options = gd.getSlotOptions(build.heroId, slot, sel.weaponId)
    const weaponName = nameOf(gd.getSlotWeapons(build.heroId, build.careerId, slot), sel.weaponId)
    lines.push(gear(weaponName, sel, options.traits, options.properties))
  }

  lines.push('EQUIPMENT:')
  for (const slot of gd.EQUIPMENT_SLOTS) {
    lines.push(gear(slot.name.toUpperCase(), data.equipment?.[slot.id], slot.traits, slot.properties))
  }

  if (data.breakpoints?.length) {
    lines.push('BREAKPOINTS:')
    for (const card of data.breakpoints) {
      const attack = gd.getAttack(card.type, card.attack)?.name ?? card.attack
      const enemies = card.enemyIds.map((id) => gd.getEnemy(id)?.name ?? id).join(', ')
      lines.push(`  ${attack}: ${enemies}`)
    }
  }

  if (build.description?.trim()) lines.push('DESCRIPTION:', build.description.trim())

  return lines.join('\n')
}
