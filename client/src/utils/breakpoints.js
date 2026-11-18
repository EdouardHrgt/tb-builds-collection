// Helpers for the fast breakpoint cards. A card is:
//   { type: 'ranged' | 'melee' | 'stagger', hits: [{ kind, zone, crit }], boosters: [id], enemyIds: [id] }
// A stagger card is simpler: one hit, with no zone and no crit ({ kind } only). The type says so in
// breakpoint-attacks.json (maxHits: 1, zones: false, crits: false), see typeRules().
// Each hit says on its own whether it is a crit. Older cards (already saved) have one `crit` on the card instead:
// it meant "all the hits are crits", see hitCrit().
// 1 or 2 hits (more than 2 is no longer a breakpoint), in the order they are done.
// `gd` is the game data (the object returned by useGameData()), so these functions stay pure.

export const MAX_HITS = 2

// What a type of breakpoint allows (melee and ranged: 2 hits, a zone and a crit per hit; stagger: 1 plain hit)
export const typeRules = (type) => ({
  maxHits: type?.maxHits ?? MAX_HITS,
  hasZones: type?.zones !== false,
  hasCrits: type?.crits !== false,
})

// Is this hit a crit? A hit without its own `crit` takes the old card-level one.
export const hitCrit = (card, hit) => hit.crit ?? !!card.crit

// "1 charged head", "2 light body", "1 charged head crit + 1 light body"
export function breakpointLabel(card, gd) {
  const hitText = (h) =>
    [
      gd.getBreakpointKind(card.type, h.kind)?.name ?? h.kind,
      h.zone ? (gd.getBreakpointZone(h.zone)?.name ?? h.zone) : '', // a stagger hit has no zone
      hitCrit(card, h) ? 'crit' : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  const [first, second] = card.hits
  const parts =
    second && hitText(first) === hitText(second) ? [`2 ${hitText(first)}`] : card.hits.map((h) => `1 ${hitText(h)}`)
  return parts.join(' + ')
}

// ["GK quest", "DoT"]
export const breakpointBoosterNames = (card, gd) =>
  (card.boosters ?? []).map((id) => gd.getBreakpointBooster(id)?.name ?? id)

// Two cards with the same key say the same thing (only their enemies differ), so a build cannot hold both.
// Keep in sync with the check in the server (gameData.js).
export const breakpointKey = (card) =>
  [
    card.type,
    card.hits.map((h) => `${h.kind}:${h.zone ?? ''}${hitCrit(card, h) ? ':crit' : ''}`).join('>'),
    [...card.boosters].sort().join(','),
  ].join('|')
