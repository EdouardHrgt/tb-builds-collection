<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useGameData } from '../composables/useGameData.js'

const props = defineProps({
  card: { type: Object, required: true }, // { type: 'ranged', attack: '1head', enemyIds: [...] }
  removable: { type: Boolean, default: false },
})
const emit = defineEmits(['remove'])

// TODO: set to false once the real enemy icons exist. Names are only a stand-in while every
// enemy uses the same placeholder icon (they stay available as a tooltip and for screen readers).
const SHOW_ENEMY_NAMES = true
// The card has a fixed height: it previews this many enemies, the rest shows when it is opened
const PREVIEW_COUNT = 3

const { getBreakpointType, getAttack, getEnemy } = useGameData()

const type = computed(() => getBreakpointType(props.card.type))
const attack = computed(() => getAttack(props.card.type, props.card.attack))
const enemies = computed(() => props.card.enemyIds.map((id) => getEnemy(id)).filter(Boolean))

const open = ref(false)
const hiddenCount = computed(() => Math.max(0, enemies.value.length - PREVIEW_COUNT))
// An opened card closes when the user clicks / taps elsewhere, or when the keyboard focus leaves it
const root = ref(null)
const close = () => (open.value = false)
function onFocusOut(e) {
  if (e.relatedTarget && !root.value?.contains(e.relatedTarget)) close()
}
function onPointerDown(e) {
  if (open.value && !root.value?.contains(e.target)) close()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
const visibleEnemies = computed(() => (open.value ? enemies.value : enemies.value.slice(0, PREVIEW_COUNT)))
</script>

<template>
  <article ref="root" class="bp-card" :class="{ open }" @focusout="onFocusOut">
    <div class="bp-body">
      <div class="bp-head">
        <img
          v-if="type?.icon"
          :src="type.icon"
          :alt="type.name"
          :title="type.name"
          width="45"
          height="40"
          class="bp-type" />
        <strong class="bp-attack">{{ attack?.name ?? card.attack }}</strong>
      </div>
      <ul class="bp-enemies">
        <li v-for="e in visibleEnemies" :key="e.id" class="bp-enemy" :title="e.name">
          <img :src="e.icon" :alt="SHOW_ENEMY_NAMES ? '' : e.name" width="36" height="36" />
          <span v-if="SHOW_ENEMY_NAMES">{{ e.name }}</span>
        </li>
      </ul>
      <button
        v-if="hiddenCount"
        type="button"
        class="bp-more"
        :aria-expanded="open"
        @click="open = !open">
        {{ open ? 'Show less ▲' : `+${hiddenCount} more ▼` }}
      </button>
    </div>

    <button
      v-if="removable"
      type="button"
      class="bp-remove"
      :aria-label="`Remove breakpoint: ${type?.name ?? card.type}, ${attack?.name ?? card.attack}`"
      @click="emit('remove')">
      ×
    </button>
  </article>
</template>

<style scoped>
.bp-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  height: 13rem; /* fixed: attack name + 3 enemies + the "more" line */
  overflow: hidden;
  padding: 0.7rem 2.4rem 0.7rem 0.7rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.bp-card.open {
  height: auto;
  min-height: 13rem;
}
.bp-head {
  display: flex;
  align-items: center; /* icon and attack name on the same line */
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.bp-type {
  flex: none;
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.bp-body {
  min-width: 0;
}
.bp-attack {
  min-width: 0;
}
.bp-enemies {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bp-enemy {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.bp-enemy img {
  flex: none;
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--bg);
}
.bp-more {
  margin-top: 0.4rem;
  padding: 0;
  font: inherit;
  font-size: 0.85rem;
  color: var(--career-color, var(--accent));
  background: transparent;
  border: 0;
  cursor: pointer;
}
.bp-more:hover {
  text-decoration: underline;
}
.bp-remove {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
}
.bp-remove:hover {
  color: var(--danger);
  border-color: var(--danger);
}
</style>
