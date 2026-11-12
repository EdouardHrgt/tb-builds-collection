<script setup>
import { ref, computed, nextTick } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import { breakpointKey, MAX_HITS } from '../utils/breakpoints.js'
import BreakpointCard from './BreakpointCard.vue'

// The cards of the build: [{ type, hits: [{ kind, zone }], crit, boosters, enemyIds }]
const cards = defineModel({ type: Array, required: true })

const {
  BREAKPOINT_TYPES,
  BREAKPOINT_ZONES,
  BREAKPOINT_BOOSTERS,
  ENEMY_CATEGORIES,
  ENEMY_IDS,
  getBreakpointType,
} = useGameData()

const editingIndex = ref(-1) // index of the card loaded in the form (-1 = a new card is being made)
const formEl = ref(null)
const typeId = ref(BREAKPOINT_TYPES[0].id)
const hits = ref([{ kind: '', zone: '' }]) // 1 or 2 hits, in the order they are done
const crit = ref(false)
const boosterIds = ref([])
const enemyIds = ref([])

const kinds = computed(() => getBreakpointType(typeId.value).kinds)

// The card being built, in the format of a finished card
const draft = computed(() => ({
  type: typeId.value,
  hits: hits.value.map((h) => ({ kind: h.kind, zone: h.zone })),
  crit: crit.value,
  boosters: BREAKPOINT_BOOSTERS.map((b) => b.id).filter((id) => boosterIds.value.includes(id)), // catalog order
  enemyIds: ENEMY_IDS.filter((id) => enemyIds.value.includes(id)), // always stored in catalog order
}))
const hitsDone = computed(() => hits.value.every((h) => h.kind && h.zone))
// Same hits, crit and boosters as a card of the build: only its enemies would differ
// (the card being edited is not compared with itself)
const alreadyAdded = computed(
  () =>
    hitsDone.value &&
    cards.value.some((c, i) => i !== editingIndex.value && breakpointKey(c) === breakpointKey(draft.value)),
)
const canAdd = computed(() => hitsDone.value && enemyIds.value.length > 0 && !alreadyAdded.value)
const hint = computed(() => {
  if (!hitsDone.value) return 'Pick the attack and the body part of each hit.'
  if (alreadyAdded.value) return 'This breakpoint is already in the build: remove its card to change the enemies.'
  if (!enemyIds.value.length) return 'Pick at least one enemy.'
  return ''
})

function setType(id) {
  typeId.value = id
  // Melee has heavy attacks and ranged has charged ones: a kind that does not exist for the new type is cleared
  const valid = new Set(getBreakpointType(id).kinds.map((k) => k.id))
  hits.value = hits.value.map((h) => ({ kind: valid.has(h.kind) ? h.kind : '', zone: h.zone }))
}
const addHit = () => {
  if (hits.value.length < MAX_HITS) hits.value = [...hits.value, { kind: '', zone: '' }]
}
const removeHit = (index) => (hits.value = hits.value.filter((_, i) => i !== index))

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

const isBoosterOn = (id) => boosterIds.value.includes(id)
function toggleBooster(id) {
  boosterIds.value = isBoosterOn(id)
    ? boosterIds.value.filter((b) => b !== id)
    : [...boosterIds.value, id]
}

function resetForm() {
  editingIndex.value = -1
  hits.value = [{ kind: '', zone: '' }]
  crit.value = false
  boosterIds.value = []
  enemyIds.value = []
}

// Add a new card, or save the changes of the card being edited (it keeps its place in the list)
function addCard() {
  if (!canAdd.value) return
  cards.value =
    editingIndex.value >= 0
      ? cards.value.map((c, i) => (i === editingIndex.value ? draft.value : c))
      : [...cards.value, draft.value]
  resetForm()
}

// The pencil of a card: its values go back into the form, the form is scrolled into view
async function editCard(index) {
  const c = cards.value[index]
  editingIndex.value = index
  typeId.value = c.type
  hits.value = c.hits.map((h) => ({ kind: h.kind, zone: h.zone }))
  crit.value = !!c.crit
  boosterIds.value = [...(c.boosters ?? [])]
  enemyIds.value = [...c.enemyIds]
  await nextTick()
  formEl.value?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
}

function removeCard(index) {
  cards.value = cards.value.filter((_, i) => i !== index)
  if (editingIndex.value === index) resetForm()
  else if (editingIndex.value > index) editingIndex.value--
}
</script>

<template>
  <div class="bp-builder">
    <div ref="formEl" class="bp-form">
      <p v-if="editingIndex >= 0" class="bp-editing" role="status">Editing breakpoint {{ editingIndex + 1 }}</p>
      <!-- Melee / Ranged icons -->
      <div class="bp-types" role="radiogroup" aria-label="Weapon type">
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

      <!-- One line per hit (1 or 2): the kind of hit, then where it lands -->
      <div v-for="(hit, i) in hits" :key="i" class="bp-hit">
        <span class="bp-hit-label">Hit {{ i + 1 }}</span>
        <div class="bp-group">
          <span class="bp-sub">Attack</span>
          <div class="bp-seg" role="group" :aria-label="`Hit ${i + 1}: attack`">
            <button
              v-for="k in kinds"
              :key="k.id"
              type="button"
              class="seg"
              :class="{ on: hit.kind === k.id }"
              :aria-pressed="hit.kind === k.id"
              @click="hit.kind = k.id">
              {{ k.name }}
            </button>
          </div>
        </div>
        <div class="bp-group bp-group-sep">
          <span class="bp-sub">Body part</span>
          <div class="bp-seg" role="group" :aria-label="`Hit ${i + 1}: body part`">
            <button
              v-for="z in BREAKPOINT_ZONES"
              :key="z.id"
              type="button"
              class="seg"
              :class="{ on: hit.zone === z.id }"
              :aria-pressed="hit.zone === z.id"
              @click="hit.zone = z.id">
              {{ z.name }}
            </button>
          </div>
        </div>
        <button v-if="i > 0" type="button" class="link-btn" @click="removeHit(i)">Remove</button>
      </div>
      <div class="bp-options">
        <button v-if="hits.length < MAX_HITS" type="button" class="link-btn" @click="addHit">
          + Add a second hit
        </button>
        <label class="bp-check">
          <input v-model="crit" type="checkbox" />
          Critical hit
        </label>
      </div>

      <div class="bp-category">
        <div class="bp-category-head">
          <span>Boosters (optional)</span>
        </div>
        <div class="bp-chips">
          <button
            v-for="b in BREAKPOINT_BOOSTERS"
            :key="b.id"
            type="button"
            class="chip plain"
            :class="{ on: isBoosterOn(b.id) }"
            :aria-pressed="isBoosterOn(b.id)"
            @click="toggleBooster(b.id)">
            {{ b.name }}
          </button>
        </div>
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
          {{ editingIndex >= 0 ? 'Save changes' : 'Add Breakpoint' }}
        </button>
        <button v-if="editingIndex >= 0" type="button" class="btn ghost" @click="resetForm">Cancel</button>
        <small v-if="!canAdd" class="bp-hint">{{ hint }}</small>
      </div>
    </div>

    <div v-if="cards.length" class="bp-list">
      <BreakpointCard
        v-for="(card, i) in cards"
        :key="breakpointKey(card)"
        :card="card"
        :class="{ 'is-editing': i === editingIndex }"
        removable
        editable
        @edit="editCard(i)"
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
.bp-hit {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.6rem 1rem;
}
.bp-hit-label {
  min-width: 3.2rem;
  padding: calc(0.35rem + 2px) 0; /* same height as the buttons beside it, so the text lines up with theirs */
  color: var(--muted);
}
.bp-hit > .link-btn {
  padding: calc(0.35rem + 2px) 0;
}
.bp-group {
  display: grid;
  gap: 0.25rem;
}
.bp-group-sep {
  padding-left: 1rem;
  border-left: 1px solid var(--line); /* vertical line between the attack and the body part */
}
.bp-sub {
  font-size: 0.8rem;
  color: var(--muted);
}
.bp-seg {
  display: inline-flex;
  gap: 0.4rem;
}
.seg {
  padding: 0.35rem 0.9rem;
  font: inherit;
  color: var(--text);
  background: var(--panel);
  border: 2px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
}
.seg:hover {
  border-color: var(--career-color, var(--accent));
}
.seg.on {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
}
.bp-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1.4rem;
}
.bp-check {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}
.bp-check input {
  flex: none;
  width: auto; /* the global input style stretches fields to the full width */
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
.chip.plain {
  padding: 0.35rem 0.85rem;
}
.chip:hover {
  border-color: var(--career-color, var(--accent));
}
.chip.on {
  border-color: var(--career-color, #ffd75e);
  box-shadow: 0 0 0 1px var(--career-color, #ffd75e);
}
.bp-hint {
  color: var(--muted);
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
.bp-editing {
  margin: 0;
  color: var(--career-color, var(--accent));
  font-weight: 600;
}
.is-editing {
  outline: 2px solid var(--career-color, var(--accent));
  outline-offset: 2px;
}
.ghost {
  color: #fff;
  background: transparent;
  border: 1px solid var(--line);
}
</style>
