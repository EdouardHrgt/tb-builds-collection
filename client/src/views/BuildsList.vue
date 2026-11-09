<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import BuildCard from '../components/BuildCard.vue'
import CardCarousel from '../components/CardCarousel.vue'

const { heroes } = useGameData()
const auth = useAuth()

// Filters (the list shows 20 builds per page)
const hero = ref('')
const career = ref('')
const username = ref('')
const sort = ref('newest') // newest (default) | oldest | likes
const page = ref(1)

const top = ref([]) // best build of each career
const followed = ref([]) // latest build of each followed user (logged in users only)
const builds = ref([])
const pages = ref(1)
const total = ref(0)
const loading = ref(true)
const error = ref('')

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'likes', label: 'Most liked' },
]

const careers = computed(() => heroes.find((h) => h.id === hero.value)?.careers ?? [])
const hasFilters = computed(
  () => hero.value || career.value || username.value.trim() || sort.value !== 'newest',
)

const heroCareerQuery = () => {
  const q = new URLSearchParams()
  if (hero.value) q.set('hero', hero.value)
  if (career.value) q.set('career', career.value)
  return q
}

async function loadTop() {
  try {
    top.value = (await api('/builds/top?' + heroCareerQuery())).items
  } catch (e) {
    error.value = e.message
  }
}

// `silent` = refresh in place (after a like) without the "Loading…" flash
async function loadList({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  const q = heroCareerQuery()
  if (username.value.trim()) q.set('username', username.value.trim())
  q.set('sort', sort.value)
  q.set('page', page.value)
  try {
    const data = await api('/builds?' + q)
    builds.value = data.items
    pages.value = data.pages
    total.value = data.total
    page.value = data.page // the server brings us back to the last page if ours no longer exists
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadFollowed() {
  if (!auth.user) {
    followed.value = []
    return
  }
  try {
    followed.value = (await api('/me/following/builds')).items
  } catch {
    followed.value = [] // an optional section: never blocks the page
  }
}

const refresh = () => Promise.all([loadTop(), loadList({ silent: true }), loadFollowed()])

// Any filter change goes back to page 1. Nothing is reloaded if the filters did not really change
// (for instance after "Reset filters", which changes several values at once).
let lastKey = ''
const filtersKey = () => [hero.value, career.value, username.value.trim(), sort.value].join('|')
function applyFilters() {
  if (filtersKey() === lastKey) return
  lastKey = filtersKey()
  page.value = 1
  loadList()
}

// Only the hero and the career also change the top rated carousel.
// (The career reset when the hero changes is done in the select's @change, so this runs only once.)
watch([hero, career], loadTop)
watch([hero, career, sort], applyFilters)

// The author search waits for the end of the typing (300 ms) before asking the server
let typing = null
watch(username, () => {
  clearTimeout(typing)
  typing = setTimeout(applyFilters, 300)
})
onBeforeUnmount(() => clearTimeout(typing))

function resetFilters() {
  hero.value = ''
  career.value = ''
  username.value = ''
  sort.value = 'newest'
}

function goTo(p) {
  page.value = p
  loadList()
  document.getElementById('all-title')?.scrollIntoView?.({ block: 'start' })
}

onMounted(() => {
  lastKey = filtersKey()
  loadTop()
  loadList()
  loadFollowed()
})
</script>

<template>
  <h1>Builds</h1>

  <div class="filters">
    <select v-model="hero" aria-label="Hero" @change="career = ''">
      <option value="">All heroes</option>
      <option v-for="h in heroes" :key="h.id" :value="h.id">{{ h.name }}</option>
    </select>
    <select v-model="career" aria-label="Career" :disabled="!hero">
      <option value="">All careers</option>
      <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
    <input
      v-model="username"
      class="search"
      type="search"
      maxlength="24"
      placeholder="Search by author…"
      aria-label="Search builds by author"
    />
    <select v-model="sort" aria-label="Sort builds">
      <option v-for="s in SORTS" :key="s.value" :value="s.value">{{ s.label }}</option>
    </select>
    <button v-if="hasFilters" type="button" class="reset" @click="resetFilters">Reset filters</button>
  </div>

  <p v-if="error" class="error">{{ error }}</p>

  <section v-if="top.length" class="block" aria-labelledby="top-title">
    <h2 id="top-title">Top rated builds</h2>
    <CardCarousel label="Top rated builds">
      <BuildCard v-for="b in top" :key="b.id" :build="b" @liked="refresh" />
    </CardCarousel>
  </section>

  <section v-if="followed.length" class="block" aria-labelledby="followed-title">
    <h2 id="followed-title">Latest builds from followed users</h2>
    <CardCarousel label="Latest builds from followed users">
      <BuildCard v-for="b in followed" :key="b.id" :build="b" @liked="refresh" />
    </CardCarousel>
  </section>

  <section aria-labelledby="all-title">
    <h2 id="all-title">All builds <span v-if="!loading" class="meta">({{ total }})</span></h2>
    <p v-if="loading">Loading…</p>
    <p v-else-if="!builds.length">No builds match these filters. Create the first one!</p>
    <template v-else>
      <div class="grid">
        <BuildCard v-for="b in builds" :key="b.id" :build="b" @liked="refresh" />
      </div>

      <nav v-if="pages > 1" class="pager" aria-label="Build pages">
        <button type="button" class="ghost" :disabled="page <= 1" @click="goTo(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pages }}</span>
        <button type="button" class="ghost" :disabled="page >= pages" @click="goTo(page + 1)">Next</button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 2rem;
}
.filters .search {
  width: auto;
  min-width: 14rem;
}
.reset {
  color: var(--accent);
  background: transparent;
  border-color: var(--line);
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
}
.ghost {
  color: var(--text);
  background: transparent;
  border-color: var(--line);
}
.ghost:disabled {
  opacity: 0.4;
}
</style>
