<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'

const props = defineProps({
  card: { type: Object, required: true }, // { type: 'ranged', attack: '1head', enemyIds: [...] }
  removable: { type: Boolean, default: false },
})
const emit = defineEmits(['remove'])

// TODO: set to false once the real enemy icons exist. Names are only a stand-in while every
// enemy uses the same placeholder icon (they stay available as a tooltip and for screen readers).
const SHOW_ENEMY_NAMES = true

const { getBreakpointType, getAttack, getEnemy } = useGameData()

const type = computed(() => getBreakpointType(props.card.type))
const attack = computed(() => getAttack(props.card.type, props.card.attack))
const enemies = computed(() => props.card.enemyIds.map((id) => getEnemy(id)).filter(Boolean))
</script>

<template>
  <article class="bp-card">
    <img
      v-if="type?.icon"
      :src="type.icon"
      :alt="type.name"
      :title="type.name"
      width="40"
      height="40"
      class="bp-type" />

    <div class="bp-body">
      <strong class="bp-attack">{{ attack?.name ?? card.attack }}</strong>
      <ul class="bp-enemies">
        <li v-for="e in enemies" :key="e.id" class="bp-enemy" :title="e.name">
          <img :src="e.icon" :alt="SHOW_ENEMY_NAMES ? '' : e.name" width="36" height="36" />
          <span v-if="SHOW_ENEMY_NAMES">{{ e.name }}</span>
        </li>
      </ul>
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
  padding: 0.7rem 2.4rem 0.7rem 0.7rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
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
  display: block;
  margin-bottom: 0.45rem;
}
.bp-enemies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.7rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bp-enemy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.bp-enemy img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--bg);
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
