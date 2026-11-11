<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../api.js'

// Window to choose a recommended build for a teammate: my own builds or my bookmarked ones,
// only those of the teammate's career. Choosing one emits `pick` with { id, title }.
//   <BuildPickerModal v-if="open" :career-id="..." :career-name="..." :exclude-id="..." @pick="..." @close="open = false" />
const props = defineProps({
  careerId: { type: String, required: true },
  careerName: { type: String, default: '' },
  excludeId: { type: Number, default: 0 }, // the build being edited (a build cannot recommend itself)
})
const emit = defineEmits(['pick', 'close'])

const TABS = [
  { key: 'mine', label: 'Mine', url: '/me/builds' },
  { key: 'bookmarked', label: 'Bookmarked', url: '/me/bookmarks' },
]
const tab = ref('mine')
const lists = ref({}) // tab key -> builds
const loading = ref(true)
const error = ref('')

const items = computed(() =>
  (lists.value[tab.value] ?? []).filter(
    (b) => b.careerId === props.careerId && b.data.v === 2 && b.id !== props.excludeId,
  ),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!lists.value[tab.value]) {
      const url = TABS.find((t) => t.key === tab.value).url
      lists.value = { ...lists.value, [tab.value]: await api(url) }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
function setTab(key) {
  tab.value = key
  load()
}

const dialog = ref(null)
let previousOverflow = ''
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  load()
})
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
})
const onBackdropClick = (e) => {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="picker" aria-label="Recommend a build" @close="emit('close')" @click="onBackdropClick">
    <header class="head">
      <h2>Recommend a build<span v-if="careerName"> · {{ careerName }}</span></h2>
      <button type="button" class="close" aria-label="Close" title="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>
    <div class="tabs" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: tab === t.key }"
        :aria-selected="tab === t.key"
        @click="setTab(t.key)">
        {{ t.label }}
      </button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="state">Loading…</p>
    <p v-else-if="!items.length" class="state">
      {{ tab === 'mine' ? 'You have no build for this career yet.' : 'You have no bookmarked build for this career.' }}
    </p>
    <ul v-else class="list">
      <li v-for="b in items" :key="b.id">
        <button type="button" class="row" @click="emit('pick', { id: b.id, title: b.title, author: b.author })">
          <span class="t">{{ b.title }}</span>
          <span class="meta">by {{ b.author }} · ♥ {{ b.likeCount }}</span>
        </button>
      </li>
    </ul>
  </dialog>
</template>

<style scoped>
.picker {
  width: min(520px, 94vw);
  max-height: min(80vh, 640px);
  padding: 0 1.2rem 1.2rem;
  overflow-y: auto;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 60px rgb(0 0 0 / 0.7);
}
.picker::backdrop {
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(3px);
}
.head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0 0.6rem;
  background: var(--bg);
}
.head h2 {
  margin: 0;
  font-size: 1.1rem;
}
.close {
  display: grid;
  place-items: center;
  padding: 0.3rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.close:hover {
  color: var(--accent);
  background: transparent;
}
.tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}
.tab {
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--line);
}
.tab.on {
  color: var(--text);
  border-color: var(--accent);
}
.list {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  padding: 0.55rem 0.8rem;
  text-align: left;
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
}
.row:hover {
  border-color: var(--accent);
}
.t {
  font-weight: 600;
}
.meta {
  font-size: 0.85rem;
  color: var(--muted);
}
.state {
  color: var(--muted);
}
</style>
