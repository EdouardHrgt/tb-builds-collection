<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../api.js'
import BuildCard from './BuildCard.vue'
import SectionIcon from './SectionIcon.vue'

// Large modal with every build of a list in a grid ("see all"). Closes with the × button, Esc,
// or a click on the dark area around it. Opening a build leaves the page, which closes the modal.
// It loads the whole list when it opens (the carousel is capped), 40 builds at a time with a "Load more"
// button: `url` is the list's API address, with the current filters; `all=1` and the paging are added to it.
//   <ListModal v-if="open" title="Top rated builds" icon="top" url="/builds/top?hero=..." @close="open = false" @liked="refresh" />
const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true }, // see SectionIcon
  url: { type: String, required: true },
})
const emit = defineEmits(['close', 'liked', 'bookmarked'])

const PAGE = 40
const items = ref([])
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')

const pageUrl = (offset, limit) =>
  `${props.url}${props.url.includes('?') ? '&' : '?'}all=1&offset=${offset}&limit=${limit}`

// First page. `silent` = refresh in place (after a like) without the "Loading…" flash; the builds
// already shown (loaded with "Load more") are fetched again, so the list does not shrink.
async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const res = await api(pageUrl(0, Math.max(PAGE, items.value.length)))
    items.value = res.items
    hasMore.value = res.hasMore
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
async function loadMore() {
  loadingMore.value = true
  try {
    const res = await api(pageUrl(items.value.length, PAGE))
    items.value = [...items.value, ...res.items]
    hasMore.value = res.hasMore
  } catch (e) {
    error.value = e.message
  } finally {
    loadingMore.value = false
  }
}
// A like or a bookmark: the page refreshes its own lists (the same build may be in several of them),
// and this window is reloaded too
function onLiked() {
  emit('liked')
  load({ silent: true })
}
function onBookmarked() {
  emit('bookmarked')
  load({ silent: true })
}

const dialog = ref(null)
let previousOverflow = ''

onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden' // the page behind does not scroll
  dialog.value.showModal()
  load()
})
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
})

// A click on the dialog itself (not on its content) = a click on the dark area
function onBackdropClick(e) {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="list-modal" :aria-label="title" @close="emit('close')" @click="onBackdropClick">
    <header class="modal-head">
      <h2 class="with-icon"><SectionIcon :name="icon" />{{ title }}</h2>
      <button type="button" class="close" aria-label="Close" title="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="state">Loading…</p>
    <p v-else-if="!items.length" class="state">Nothing here yet.</p>
    <div v-else class="modal-grid">
      <BuildCard v-for="b in items" :key="b.id" :build="b" @liked="onLiked" @bookmarked="onBookmarked" />
    </div>
    <div v-if="hasMore" class="more">
      <button type="button" class="more-btn" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.list-modal {
  width: min(1300px, 94vw);
  max-width: none;
  height: min(90vh, 1000px);
  padding: 0 1.5rem 1.5rem;
  overflow-y: auto;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 60px rgb(0 0 0 / 0.7);
}
.list-modal::backdrop {
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(3px);
}
/* The title stays at the top while the grid scrolls */
.modal-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0 0.8rem;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
.modal-head h2 {
  margin: 0;
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
.more {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.more-btn {
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
}
.more-btn:hover:not(:disabled) {
  border-color: var(--accent);
}
.state {
  padding-top: 1.2rem;
}
.modal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  padding-top: 1.2rem;
}
</style>
