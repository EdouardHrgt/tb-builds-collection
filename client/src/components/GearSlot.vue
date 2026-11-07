<script setup>
import { ref, computed, useId, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  slotIcon: { type: String, default: '' }, // fixed illustration of an equipment slot (necklace, charm, trinket)
  weapons: { type: Array, default: null }, // weapons to choose from; null = not a weapon slot
  traits: { type: Array, required: true },
  properties: { type: Array, required: true },
  readonly: { type: Boolean, default: false },
})
// { weaponId?, traitId, propertyIds: [a, b] } ('' or missing = nothing picked)
const model = defineModel({ type: Object, required: true })

const open = ref(false)
const panelId = useId()
const root = ref(null)
const head = ref(null)

const isWeaponSlot = computed(() => props.weapons !== null)
const weapon = computed(() => props.weapons?.find((w) => w.id === model.value.weaponId) ?? null)
const trait = computed(() => props.traits.find((t) => t.id === model.value.traitId) ?? null)
const propertyNames = computed(() =>
  (model.value.propertyIds ?? [])
    .filter(Boolean)
    .map((id) => props.properties.find((p) => p.id === id)?.name ?? id),
)
// Weapon slots show the picked weapon; equipment slots always show their own fixed illustration
const icon = computed(() => (isWeaponSlot.value ? weapon.value?.icon : props.slotIcon) || '')
const title = computed(() => weapon.value?.name || props.label)
const isEmpty = computed(() => !weapon.value && !trait.value && !propertyNames.value.length)

const update = (patch) => (model.value = { ...model.value, ...patch })

function setProperty(index, value) {
  const ids = [model.value.propertyIds?.[0] ?? '', model.value.propertyIds?.[1] ?? '']
  ids[index] = value
  update({ propertyIds: ids })
}
// The other property select already uses one value: it cannot be picked twice
const propertyChoices = (index) => {
  const other = model.value.propertyIds?.[1 - index] ?? ''
  return props.properties.filter((p) => p.id !== other)
}

// --- Auto-collapse when the user leaves the slot ---
const close = () => (open.value = false)

// Click / tap anywhere else (this also closes the slot when another one is opened)
function onPointerDown(e) {
  if (open.value && !root.value?.contains(e.target)) close()
}
// Keyboard: Tab to something outside the slot. relatedTarget is null when the whole
// window just loses focus (alt-tab): in that case the slot stays open.
function onFocusOut(e) {
  if (e.relatedTarget && !root.value?.contains(e.relatedTarget)) close()
}
function onEscape() {
  if (!open.value) return
  close()
  head.value?.focus()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

// Dev help: names the wrong image path instead of leaving a silent empty box
function onImageError(e) {
  if (import.meta.env.DEV) console.warn(`Image not found: ${new URL(e.target.src).pathname}`)
}
</script>

<template>
  <div ref="root" class="gear" :class="{ open }" @focusout="onFocusOut" @keydown.esc="onEscape">
    <component
      :is="readonly ? 'div' : 'button'"
      ref="head"
      class="gear-head"
      v-bind="readonly ? {} : { type: 'button', 'aria-expanded': open, 'aria-controls': panelId }"
      @click="!readonly && (open = !open)">
      <img
        v-if="icon"
        :src="icon"
        alt=""
        width="56"
        height="56"
        class="gear-icon"
        @error="onImageError" />
      <span v-else class="gear-icon placeholder" aria-hidden="true">+</span>

      <span class="gear-summary">
        <strong>{{ title }}</strong>
        <span v-if="trait" class="line trait-line">
          <img
            v-if="trait.icon"
            :src="trait.icon"
            alt=""
            width="20"
            height="20"
            class="trait-icon"
            @error="onImageError" />
          {{ trait.name }}
        </span>
        <span v-for="name in propertyNames" :key="name" class="line muted">{{ name }}</span>
        <span v-if="isEmpty && !readonly" class="line muted">Click to choose</span>
      </span>

      <span v-if="!readonly" class="chevron" aria-hidden="true">{{ open ? '▲' : '▼' }}</span>
    </component>

    <div v-if="open && !readonly" :id="panelId" class="gear-panel">
      <label v-if="isWeaponSlot">
        Weapon
        <select :value="model.weaponId ?? ''" @change="update({ weaponId: $event.target.value })">
          <option value="">— none —</option>
          <option v-for="w in weapons" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </label>

      <label>
        Trait
        <select :value="model.traitId ?? ''" @change="update({ traitId: $event.target.value })">
          <option value="">— none —</option>
          <option v-for="t in traits" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>

      <label v-for="index in [0, 1]" :key="index">
        Property {{ index + 1 }}
        <select
          :value="model.propertyIds?.[index] ?? ''"
          @change="setProperty(index, $event.target.value)">
          <option value="">— none —</option>
          <option v-for="p in propertyChoices(index)" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>

<style scoped>
.gear {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.gear.open {
  border-color: var(--accent);
}
.gear-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.7rem;
  text-align: left;
  font: inherit;
  color: var(--text);
  background: transparent;
  border: 0;
  border-radius: 6px;
}
button.gear-head {
  cursor: pointer;
}
.gear-icon {
  flex: none;
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--bg);
}
.gear-icon.placeholder {
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  color: var(--muted);
}
.gear-summary {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.line {
  font-size: 0.92rem;
}
.trait-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.trait-icon {
  flex: none;
  object-fit: contain;
}
.muted,
.chevron {
  color: var(--muted);
}
.gear-panel {
  display: grid;
  gap: 0.8rem;
  padding: 0.8rem;
  border-top: 1px solid var(--line);
}
.gear-panel label {
  display: grid;
  gap: 0.3rem;
}
.trait-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.trait-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}
</style>
