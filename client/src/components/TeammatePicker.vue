<script setup>
import { computed, ref } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import BuildPickerModal from './BuildPickerModal.vue'

// Hero of the build: a team has one of each hero, so it can never be a teammate
const props = defineProps({
  heroId: { type: String, required: true },
  buildId: { type: Number, default: 0 }, // the build being edited (0 = new): it cannot recommend itself
  known: { type: Object, default: () => ({}) }, // already recommended builds { id: { title } } (editing)
})
// [{ heroId, careerId, buildId? }], kept in the order of heroes.json
const teammates = defineModel({ type: Array, required: true })

// Keep in sync with MAX_TEAMMATES in the server (routes/builds.js)
const MAX_TEAMMATES = 3

const { heroes } = useGameData()

// Recommended build: the window is open for one teammate at a time
const picking = ref(null) // the teammate being edited, or null
const titles = ref({}) // titles of the builds chosen here
const buildTitle = (id) => titles.value[id] ?? props.known[id]?.title ?? `Build #${id}`
function pickBuild(b) {
  titles.value = { ...titles.value, [b.id]: b.title }
  teammates.value = teammates.value.map((t) => (t === picking.value ? { ...t, buildId: b.id } : t))
  picking.value = null
}
function clearBuild(mate) {
  teammates.value = teammates.value.map((t) => (t === mate ? { heroId: t.heroId, careerId: t.careerId } : t))
}
const careerOf = (mate) => heroes.find((h) => h.id === mate.heroId)?.careers.find((c) => c.id === mate.careerId)

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
      Select the ideal teammates for this build.
      <span class="tm-count">{{ teammates.length }}/{{ MAX_TEAMMATES }}</span>
    </p>

    <div v-for="hero in otherHeroes" :key="hero.id" class="tm-row">
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
          <img :src="c.icon" :alt="c.name" width="60" height="74" />
        </button>
      </div>
    </div>

    <ul v-if="teammates.length" class="tm-builds">
      <li v-for="mate in teammates" :key="mate.heroId">
        <img :src="careerOf(mate)?.icon" :alt="careerOf(mate)?.name" width="30" height="37" />
        <span v-if="mate.buildId" class="tm-chosen">
          {{ buildTitle(mate.buildId) }}
          <button type="button" class="tm-x" title="Remove the recommended build" aria-label="Remove the recommended build" @click="clearBuild(mate)">✕</button>
        </span>
        <button type="button" class="tm-recommend" @click="picking = mate">
          {{ mate.buildId ? 'Change build' : 'Recommend a build' }}
        </button>
      </li>
    </ul>
    <BuildPickerModal
      v-if="picking"
      :career-id="picking.careerId"
      :career-name="careerOf(picking)?.name"
      :exclude-id="buildId"
      @pick="pickBuild"
      @close="picking = null" />
  </div>
</template>

<style scoped>
.tm-picker {
  display: grid;
  gap: 0.5rem; /* same space between the rows as between the portraits */
}
.tm-picker p {
  margin: 0;
  color: var(--muted); /* the instruction; the counter below keeps the normal color */
}
.tm-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}
.tm-count {
  margin-left: 0.5rem;
  color: var(--text);
  font-weight: 600;
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
  background: transparent; /* no background behind the portrait */
  border: 2px solid transparent; /* no visible border until hovered or picked (the space is kept, so nothing moves) */
  border-radius: 8px;
  cursor: pointer;
}
.tm-career img {
  display: block;
  width: 60px;
  height: auto; /* the height comes from aspect-ratio (source images are 154x189) */
  aspect-ratio: 154 / 189;
  object-fit: cover;
  font-size: 0.6rem; /* alt text, only visible if the image fails to load */
}
/* Hovered: border and background take the color of the career */
.tm-career:hover:not(:disabled) {
  border-color: var(--career-color, var(--accent));
  background: var(--career-color, var(--accent));
}
/* Picked: the same, plus a halo (to soften the background: color-mix(in srgb, var(--career-color, #ffd75e) 40%, transparent)) */
.tm-career.on {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
  background: var(--career-color, #ffd75e);
}
.tm-career:disabled {
  cursor: not-allowed;
  opacity: 0.35;
  filter: grayscale(1);
}
.tm-builds {
  display: grid;
  gap: 0.4rem;
  margin: 0.3rem 0 0;
  padding: 0;
  list-style: none;
}
.tm-builds li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.tm-builds img {
  border-radius: 5px;
  aspect-ratio: 154 / 189;
  object-fit: cover;
}
.tm-chosen {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.3rem 0.2rem 0.6rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.tm-x {
  padding: 0 0.3rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.tm-x:hover {
  color: var(--accent);
  background: transparent;
}
.tm-recommend {
  padding: 0.25rem 0.7rem;
  font-size: 0.85rem;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
}
.tm-recommend:hover {
  border-color: var(--accent);
}
</style>
