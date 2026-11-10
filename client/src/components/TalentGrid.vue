<script setup>
import { showDescriptions } from '../composables/useDescriptions.js'

const props = defineProps({
  // [{ tier: '5', talents: [{ id, name, description, icon }, x3] }, ...] (6 rows)
  tiers: { type: Array, required: true },
  readonly: { type: Boolean, default: false },
})
// One entry per tier: 0 = nothing picked, 1..3 = position of the picked talent
const model = defineModel({ type: Array, required: true })

const describe = (talent) => talent.description
const chosen = (row) => model.value[row] ?? 0

function pick(row, position) {
  if (props.readonly) return
  const next = [...model.value]
  next[row] = chosen(row) === position ? 0 : position // clicking the picked talent un-picks it
  model.value = next
}
</script>

<template>
  <div class="talent-grid">
    <div
      v-for="(row, i) in tiers"
      :key="row.tier"
      class="tier-row"
      role="group"
      :aria-label="`Level ${row.tier} talents`">
      <div class="tier-badge" aria-hidden="true">
        <span>{{ row.tier }}</span>
      </div>

      <p v-if="!row.talents.length" class="empty">Sigmar hasn't provided data...</p>

      <button
        v-for="t in row.talents"
        :key="t.id"
        type="button"
        class="talent"
        :class="{
          selected: chosen(i) === Number(t.id),
          dimmed: chosen(i) !== 0 && chosen(i) !== Number(t.id),
        }"
        :aria-pressed="chosen(i) === Number(t.id)"
        :disabled="readonly"
        @click="pick(i, Number(t.id))">
        <span class="talent-main">
          <img :src="t.icon" alt="" width="44" height="44" class="talent-icon" loading="lazy" />
          <span class="talent-name">{{ t.name }}</span>
        </span>
        <span v-if="showDescriptions" class="talent-desc">{{ describe(t) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tier-row {
  display: grid;
  grid-template-columns: 4.2rem repeat(3, 1fr);
  gap: 0.6rem;
  align-items: stretch;
  margin-bottom: 0.6rem;
}
.tier-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}
.tier-badge span {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: 2px solid var(--career-color, var(--accent));
  background: color-mix(in srgb, var(--career-color, var(--accent)) 20%, var(--bg));
  color: var(--career-color, var(--accent));
  font:
    600 1.3rem Georgia,
    'Times New Roman',
    serif;
}

.talent {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
  text-align: left;
  padding: 0.6rem;
  font: inherit;
  color: var(--text);
  background: var(--panel);
  border: 2px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  transition:
    filter 0.15s,
    box-shadow 0.15s,
    border-color 0.15s;
}
.talent:hover:not(:disabled) {
  border-color: var(--career-color, var(--accent));
}
.talent:disabled {
  opacity: 0.8; /* read-only view: cancel the global button:disabled fade (style.css) */
  cursor: default;
  color: var(--text);
}
/* --career-color is set by the parent view (career.color in heroes.json); gold when missing */
.talent.selected {
  border-color: var(--career-color, #ffd75e);
  box-shadow:
    0 0 0 1px var(--career-color, #ffd75e),
    0 0 14px color-mix(in srgb, var(--career-color, #ffd75e) 55%, transparent);
}
.talent.dimmed {
  filter: grayscale(1) brightness(0.55);
}
/* the grey filter would also grey the hover border: lift it on hover */
.talent.dimmed:hover:not(:disabled) {
  filter: none;
}

.talent-main {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.talent-icon {
  flex: none;
  width: var(--icon-size);
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bg);
}
.talent-name {
  font-weight: 600;
}
.talent-desc {
  font-size: 0.9rem;
  color: var(--muted);
}
.empty {
  grid-column: 2 / -1;
  align-self: center;
  margin: 0;
  color: var(--muted);
  font-style: italic;
}

@media (max-width: 1024px) {
  .tier-row {
    grid-template-columns: 1fr;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--line);
  }
  .empty {
    grid-column: 1;
  }
}
</style>
