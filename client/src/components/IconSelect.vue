<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

// A drop-down list where each option can show a small icon before its name (a native <select> cannot).
// groups: [{ label, items: [{ value, label, icon, round }] }]. `round` = the icon is a portrait: it is zoomed on the
// face and cut in a circle (other icons stay square). '' (the empty value) is the "nothing picked" option,
// shown with `placeholder`.
const props = defineProps({
  groups: { type: Array, required: true },
  placeholder: { type: String, required: true },
  ariaLabel: { type: String, required: true },
})
const model = defineModel({ type: String, default: '' })
const emit = defineEmits(['change'])

const open = ref(false)
const root = ref(null)
const list = ref(null)
const active = ref(-1) // index (in `flat`) of the option highlighted with the keyboard

// All options in one flat list, the "nothing" one first
const flat = computed(() => [
  { value: '', label: props.placeholder, icon: '' },
  ...props.groups.flatMap((g) => g.items),
])
const selected = computed(() => flat.value.find((o) => o.value === model.value) ?? flat.value[0])
const ids = computed(() => new Map(flat.value.map((o, i) => [o.value, i])))

function pick(value) {
  const changed = value !== model.value
  model.value = value
  open.value = false
  if (changed) emit('change')
}

async function openList() {
  open.value = true
  active.value = ids.value.get(model.value) ?? 0
  await nextTick()
  list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' })
}
const toggle = () => (open.value ? (open.value = false) : openList())

function move(step) {
  active.value = Math.min(flat.value.length - 1, Math.max(0, active.value + step))
  nextTick(() => list.value?.querySelector('.active')?.scrollIntoView?.({ block: 'nearest' }))
}
function onKeydown(e) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
    return
  }
  if (e.key === 'Escape') (e.preventDefault(), (open.value = false))
  else if (e.key === 'ArrowDown') (e.preventDefault(), move(1))
  else if (e.key === 'ArrowUp') (e.preventDefault(), move(-1))
  else if (e.key === 'Home') (e.preventDefault(), move(-flat.value.length))
  else if (e.key === 'End') (e.preventDefault(), move(flat.value.length))
  else if (e.key === 'Enter' || e.key === ' ') (e.preventDefault(), pick(flat.value[active.value].value))
  else if (e.key === 'Tab') open.value = false
}

// Closes when the user clicks elsewhere
const onPointerDown = (e) => {
  if (open.value && !root.value?.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="root" class="iselect">
    <button
      type="button"
      class="trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="`${ariaLabel}: ${selected.label}`"
      @click="toggle"
      @keydown="onKeydown">
      <span v-if="selected.icon" class="ico" :class="{ round: selected.round }">
        <img :src="selected.icon" alt="" />
      </span>
      <span class="name">{{ selected.label }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </button>
    <ul v-if="open" ref="list" class="options" role="listbox" :aria-label="ariaLabel">
      <li
        role="option"
        class="option"
        :class="{ active: active === 0 }"
        :aria-selected="model === ''"
        @mouseenter="active = 0"
        @click="pick('')">
        {{ placeholder }}
      </li>
      <template v-for="g in groups" :key="g.label">
        <li class="group" role="presentation">{{ g.label }}</li>
        <li
          v-for="item in g.items"
          :key="item.value"
          role="option"
          class="option"
          :class="{ active: active === ids.get(item.value) }"
          :aria-selected="model === item.value"
          @mouseenter="active = ids.get(item.value)"
          @click="pick(item.value)">
          <span v-if="item.icon" class="ico" :class="{ round: item.round }">
            <img :src="item.icon" alt="" loading="lazy" />
          </span>
          <span>{{ item.label }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.iselect {
  position: relative;
  min-width: 12rem;
}
.trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  font: inherit;
  text-align: left;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
}
.ico {
  flex: none;
  width: 24px;
  height: 24px;
  overflow: hidden;
  border-radius: 4px;
}
.ico img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Portraits (shield shaped, face in the middle): zoomed on the face, cut in a circle */
.ico.round {
  border-radius: 50%;
}
.ico.round img {
  transform: scale(1.50);
  transform-origin: 50% 46%;
}
.name {
  flex: 1;
}
.caret {
  color: var(--muted);
}
.options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  width: max-content;
  max-height: 22rem;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
  list-style: none;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.5);
}
.group {
  padding: 0.4rem 0.7rem 0.15rem;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}
.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}
.option.active {
  background: var(--bg);
}
.option[aria-selected='true'] {
  color: var(--accent);
}
</style>
