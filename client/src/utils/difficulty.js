// Difficulty of the breakpoints of a build (Legend, Cata, Cata 3), with or without Deathwish.
// The list lives in data/difficulties.json, shared with the server (which checks it when a build is saved).
// Builds saved before the choice existed were all "C3DW": that is the default.
import difficulties from '../data/difficulties.json'

export const DIFFICULTIES = difficulties.difficulties
export const DEFAULT_DIFFICULTY = difficulties.defaultDifficulty
export const DEFAULT_DEATHWISH = difficulties.defaultDeathwish

// "Cata 3 DW", "Cata", "Legend DW"...
export function difficultyLabel(difficulty = DEFAULT_DIFFICULTY, deathwish = DEFAULT_DEATHWISH) {
  const d = DIFFICULTIES.find((x) => x.id === difficulty) ?? DIFFICULTIES.find((x) => x.id === DEFAULT_DIFFICULTY)
  return d.label + (deathwish ? ' DW' : '')
}

// The label of a build (its data.difficulty / data.deathwish may be missing on an old build)
export const buildDifficultyLabel = (data = {}) => difficultyLabel(data.difficulty, data.deathwish ?? DEFAULT_DEATHWISH)
