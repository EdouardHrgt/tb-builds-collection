<script setup>
import { ref, computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import BreakpointCard from './BreakpointCard.vue'

// The cards of the build: [{ type, attack, enemyIds }]
const cards = defineModel({ type: Array, required: true })

const { BREAKPOINT_TYPES, ENEMY_CATEGORIES, ENEMY_IDS, getBreakpointType } = useGameData()

const typeId = ref(BREAKPOINT_TYPES[0].id)
const attackId = ref('')
const enemyIds = ref([])

const attacks = computed(() => getBreakpointType(typeId.value).attacks)
// One card per attack: an attack that already has a card cannot be picked again
const usedAttacks = computed(
  () => new Set(cards.value.filter((c) => c.type === typeId.value).map((c) => c.attack)),
)
const canAdd = computed(() => attackId.value !== '' && enemyIds.value.length > 0)

function setType(id) {
  typeId.value = id
  attackId.value = '' // attacks are different for melee and ranged
}

const isPicked = (id) => enemyIds.value.includes(id)
function toggleEnemy(id) {
  enemyIds.value = isPicked(id) ? enemyIds.value.filter((e) => e !== id) : [...enemyIds.value, id]
}

const isCategoryFull = (category) => category.enemies.every((e) => isPicked(e.id))
function toggleCategory(category) {
  const ids = category.enemies.map((e) => e.id)
  enemyIds.value = isCategoryFull(category)
    ? enemyIds.value.filter((id) => !ids.includes(id))
    : [...new Set([...enemyIds.value, ...ids])]
}

function addCard() {
  if (!canAdd.value || usedAttacks.value.has(attackId.value)) return
  cards.value = [
    ...cards.value,
    {
      type: typeId.value,
      attack: attackId.value,
      enemyIds: ENEMY_IDS.filter(isPicked), // always stored in catalog order
    },
  ]
  attackId.value = ''
  enemyIds.value = []
}

const removeCard = (index) => (cards.value = cards.value.filter((_, i) => i !== index))
</script>

<template>
  <div class="bp-builder">
    <div class="bp-form">
      <!-- Melee / Ranged icons, with the attack selector on their right -->
      <div class="bp-top">
        <div class="bp-types" role="radiogroup" aria-label="Attack type">
          <label v-for="t in BREAKPOINT_TYPES" :key="t.id" class="bp-type-option" :title="t.name">
            <input
              type="radio"
              name="breakpoint-type"
              class="sr-only"
              :value="t.id"
              :checked="typeId === t.id"
              @change="setType(t.id)" />
            <img :src="t.icon" :alt="t.name" width="44" height="44" />
          </label>
        </div>

        <label class="bp-attack-select">
          Attack
          <select v-model="attackId">
            <option value="">Choose an attack…</option>
            <option v-for="a in attacks" :key="a.id" :value="a.id" :disabled="usedAttacks.has(a.id)">
              {{ a.name }}{{ usedAttacks.has(a.id) ? ' (already added)' : '' }}
            </option>
          </select>
        </label>
      </div>

      <div v-for="category in ENEMY_CATEGORIES" :key="category.id" class="bp-category">
        <div class="bp-category-head">
          <span>{{ category.name }}</span>
          <button type="button" class="link-btn" @click="toggleCategory(category)">
            {{ isCategoryFull(category) ? 'Clear' : 'Select All' }}
          </button>
        </div>
        <div class="bp-chips">
          <button
            v-for="e in category.enemies"
            :key="e.id"
            type="button"
            class="chip"
            :class="{ on: isPicked(e.id) }"
            :aria-pressed="isPicked(e.id)"
            @click="toggleEnemy(e.id)">
            <img :src="e.icon" alt="" width="32" height="32" />
            <span>{{ e.name }}</span>
          </button>
        </div>
      </div>

      <div class="bp-actions">
        <button type="button" class="btn add" :disabled="!canAdd" @click="addCard">
          Add Breakpoint
        </button>
        <small v-if="!canAdd" class="meta">Pick an attack and at least one enemy.</small>
      </div>
    </div>

    <div v-if="cards.length" class="bp-list">
      <BreakpointCard
        v-for="(card, i) in cards"
        :key="`${card.type}-${card.attack}`"
        :card="card"
        removable
        @remove="removeCard(i)" />
    </div>
  </div>
</template>

<style scoped>
.bp-builder {
  display: grid;
  gap: 1.2rem;
}
.bp-form {
  display: grid;
  gap: 1rem;
}
.bp-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
.bp-types {
  display: flex;
  gap: 0.6rem;
}
/* Buttons use the color of the selected career (gold without one) */
.add {
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.55);
  background: var(--career-color, var(--accent));
  border-color: var(--career-color, var(--accent));
}
.bp-type-option {
  position: relative;
  display: block;
  cursor: pointer;
}
.bp-type-option img {
  display: block;
  padding: 0.3rem;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 8px;
}
.bp-type-option:hover img {
  border-color: var(--career-color, var(--accent));
}
.bp-type-option input:checked + img {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
}
.bp-type-option input:focus-visible + img {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.bp-attack-select {
  display: grid;
  gap: 0.3rem;
  max-width: 360px;
}
.bp-category {
  display: grid;
  gap: 0.5rem;
}
.bp-category-head {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  color: var(--muted);
}
.link-btn {
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
  color: var(--career-color, var(--accent));
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
}
.bp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.7rem 0.3rem 0.35rem;
  font: inherit;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--panel);
  border: 2px solid var(--line);
  border-radius: 999px;
  cursor: pointer;
}
.chip img {
  object-fit: cover;
  border-radius: 50%;
  background: var(--bg);

}
.chip:hover {
  border-color: var(--career-color, var(--accent));
}
.chip.on {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
}
.bp-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.bp-list {
  display: grid;
  gap: 0.8rem;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
</style>
