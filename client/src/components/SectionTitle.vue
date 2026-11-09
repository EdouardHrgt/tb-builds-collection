<script setup>
import SectionIcon from './SectionIcon.vue'

// Title of a list: icon + title + an eye button that hides / shows the list.
// The choice is remembered in this browser (localStorage, one key per list).
//   <SectionTitle id="x-title" icon="top" label="Top rated builds" storage-key="top" v-model:hidden="hideTop" />
const props = defineProps({
  id: { type: String, default: '' }, // id of the <h2> (for aria-labelledby)
  icon: { type: String, required: true }, // see SectionIcon
  label: { type: String, required: true }, // the title text
  storageKey: { type: String, required: true },
  expandable: { type: Boolean, default: false }, // the title is a button: click = "see all" (event `open`)
})
const emit = defineEmits(['open'])
const hidden = defineModel('hidden', { type: Boolean, default: false })

const KEY = `list-hidden:${props.storageKey}`
// Storage can be blocked (private window...): the list is then simply shown
try {
  hidden.value = localStorage.getItem(KEY) === '1'
} catch {
  /* ignore */
}

function toggle() {
  // `hidden.value` only changes after the parent has updated (v-model): do not read it back right after
  // setting it, or the saved choice would be the opposite of what is shown
  const next = !hidden.value
  hidden.value = next
  try {
    if (next) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="section-head" :class="{ off: hidden }">
    <h2 :id="id || undefined" class="with-icon"><SectionIcon :name="icon" />
      <button v-if="expandable" type="button" class="title-btn" :title="`See all: ${label}`" @click="emit('open')">
        {{ label }}<span class="chev" aria-hidden="true">›</span>
      </button>
      <template v-else>{{ label }}</template>
    </h2>
    <button
      type="button"
      class="eye"
      :aria-pressed="hidden"
      :aria-label="hidden ? `Show ${label}` : `Hide ${label}`"
      :title="hidden ? 'Show this list' : 'Hide this list'"
      @click="toggle">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="hidden" d="M3 3l18 18" />
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1.8rem 0 0.6rem;
}
.section-head h2 {
  margin: 0;
}
/* hidden list: only the title remains, a bit dimmed */
.section-head.off h2 {
  opacity: 0.55;
}
.eye {
  display: grid;
  place-items: center;
  padding: 0.25rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.15s;
}
.eye:hover {
  color: var(--accent);
}
.title-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.15s;
}
.title-btn:hover {
  color: var(--accent);
  background: transparent;
}
.chev {
  color: var(--accent);
  transition: transform 0.15s;
}
.title-btn:hover .chev {
  transform: translateX(4px);
}
</style>
