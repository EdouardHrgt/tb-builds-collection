<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'

// Hero of the build: a team has one of each hero, so it can never be a teammate
const props = defineProps({ heroId: { type: String, required: true } })
// [{ heroId, careerId }], kept in the order of heroes.json
const teammates = defineModel({ type: Array, required: true })

// Keep in sync with MAX_TEAMMATES in the server (routes/builds.js)
const MAX_TEAMMATES = 3

const { heroes } = useGameData()

const otherHeroes = computed(() => heroes.filter((h) => h.id !== props.heroId))

const heroOrder = (id) => heroes.findIndex((h) => h.id === id)
const pickFor = (heroId) => teammates.value.find((t) => t.heroId === heroId)
const isPicked = (heroId, careerId) => pickFor(heroId)?.careerId === careerId
// Team full: heroes without a teammate yet are locked (the others can still swap their career)
const isLocked = (heroId) => teammates.value.length >= MAX_TEAMMATES && !pickFor(heroId)

function toggle(heroId, careerId) {
  if (isLocked(heroId)) return
  const others = teammates.value.filter((t) => t.heroId !== heroId) // one career per hero
  teammates.value = isPicked(heroId, careerId)
    ? others
    : [...others, { heroId, careerId }].sort((a, b) => heroOrder(a.heroId) - heroOrder(b.heroId))
}
</script>

<template>
  <div class="tm-picker">
    <p class="meta">
      Pick up to {{ MAX_TEAMMATES }} careers, one per hero ({{ teammates.length }}/{{
        MAX_TEAMMATES
      }}).
    </p>

    <div v-for="hero in otherHeroes" :key="hero.id" class="tm-row">
      <span class="tm-hero">{{ hero.name }}</span>
      <div class="tm-careers" role="group" :aria-label="`${hero.name} career`">
        <button
          v-for="c in hero.careers"
          :key="c.id"
          type="button"
          class="tm-career"
          :class="{ on: isPicked(hero.id, c.id) }"
          :aria-pressed="isPicked(hero.id, c.id)"
          :disabled="isLocked(hero.id)"
          :title="c.name"
          @click="toggle(hero.id, c.id)">
          <img :src="c.icon" :alt="c.name" width="48" height="59" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tm-picker {
  display: grid;
  gap: 0.8rem;
}
.tm-picker p {
  margin: 0;
}
.tm-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}
.tm-hero {
  min-width: 11rem;
  color: var(--muted);
}
.tm-careers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tm-career {
  padding: 0;
  line-height: 0; /* no gap under the image */
  overflow: hidden;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
}
.tm-career img {
  display: block;
  width: 48px;
  height: auto; /* the height comes from aspect-ratio (source images are 154x189) */
  aspect-ratio: 154 / 189;
  object-fit: cover;
  font-size: 0.6rem; /* alt text, only visible if the image fails to load */
}
.tm-career:hover:not(:disabled) {
  border-color: var(--career-color, var(--accent));
}
.tm-career.on {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
}
.tm-career:disabled {
  cursor: not-allowed;
  opacity: 0.35;
  filter: grayscale(1);
}
</style>
