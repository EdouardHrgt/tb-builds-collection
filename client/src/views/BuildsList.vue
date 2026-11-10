<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import BuildCard from '../components/BuildCard.vue'
import CardCarousel from '../components/CardCarousel.vue'
import SectionTitle from '../components/SectionTitle.vue'
import ListModal from '../components/ListModal.vue'

const { heroes, getHeroWeapons } = useGameData()
const auth = useAuth()

// Filters (the list shows 20 builds per page)
const hero = ref('')
const career = ref('')
const weapon = ref('') // id of a weapon of the picked hero (melee or ranged slot)
const username = ref('')
const sort = ref('newest') // newest (default) | oldest | likes
const page = ref(1)

// Lists hidden with the eye button (remembered by SectionTitle)
const hideTop = ref(false)
const hideFollowed = ref(false)
const hideAll = ref(false)

// Which list is open in the big modal: '' (none) | 'top' | 'followed'
const openList = ref('')

const FEED_DAYS = 30 // keep in step with FEED_MAX_AGE_DAYS in server/src/routes/users.js

const top = ref([]) // best build of each career
const followed = ref([]) // latest build of each followed user (logged in users only)
const followedLoaded = ref(false) // false until the first answer, so the "nothing" message does not flash
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
// Weapons of the picked hero (limited to the ones the career can use once a career is picked), by kind
const weaponGroups = computed(() =>
  hero.value
    ? [
        { type: 'melee', label: 'Melee' },
        { type: 'ranged', label: 'Ranged' },
      ]
        .map((g) => ({
          ...g,
          weapons: getHeroWeapons(hero.value, g.type).filter(
            (w) => !career.value || w.availableFor.includes(career.value),
          ),
        }))
        .filter((g) => g.weapons.length)
    : [],
)
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const weaponName = computed(() => {
  const w = weaponGroups.value.flatMap((g) => g.weapons).find((x) => x.id === weapon.value)
  return w ? capitalize(w.name) : ''
})
// A new career may not be able to use the picked weapon: then the weapon filter is cleared
function onCareerChange() {
  if (weapon.value && !weaponName.value) weapon.value = ''
}
const hasFilters = computed(
  () => hero.value || career.value || weapon.value || username.value.trim() || sort.value !== 'newest',
)

// Name of the hero / career in the filters, for the message of an empty "From people I follow"
const filterLabel = computed(() => {
  const base =
    careers.value.find((c) => c.id === career.value)?.name ?? heroes.find((h) => h.id === hero.value)?.name ?? ''
  return weaponName.value ? `${base} (${weaponName.value})` : base
})
// That list is shown even when empty, but only to explain a filter (otherwise an empty list just stays hidden)
const showFollowed = computed(
  () => followed.value.length > 0 || (!!auth.user && followedLoaded.value && !!(hero.value || career.value || weapon.value)),
)

const heroCareerQuery = () => {
  const q = new URLSearchParams()
  if (hero.value) q.set('hero', hero.value)
  if (career.value) q.set('career', career.value)
  if (weapon.value) q.set('weapon', weapon.value)
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
    followed.value = (await api('/me/following/builds?' + heroCareerQuery())).items
  } catch {
    followed.value = [] // an optional section: never blocks the page
  } finally {
    followedLoaded.value = true
  }
}

const refresh = () => Promise.all([loadTop(), loadList({ silent: true }), loadFollowed()])

// Any filter change goes back to page 1. Nothing is reloaded if the filters did not really change
// (for instance after "Reset filters", which changes several values at once).
let lastKey = ''
const filtersKey = () => [hero.value, career.value, weapon.value, username.value.trim(), sort.value].join('|')
function applyFilters() {
  if (filtersKey() === lastKey) return
  lastKey = filtersKey()
  page.value = 1
  loadList()
}

// Only the hero, the career and the weapon also change the two carousels (top rated, followed).
// (The career reset when the hero changes is done in the select's @change, so this runs only once.)
watch([hero, career, weapon], () => {
  loadTop()
  loadFollowed()
})
watch([hero, career, weapon, sort], applyFilters)

// The author search waits for the end of the typing (300 ms) before asking the server
let typing = null
watch(username, () => {
  clearTimeout(typing)
  typing = setTimeout(applyFilters, 300)
})
onBeforeUnmount(() => {
  clearTimeout(typing)
  window.removeEventListener('scroll', onScroll)
})

function resetFilters() {
  hero.value = ''
  career.value = ''
  weapon.value = ''
  username.value = ''
  sort.value = 'newest'
}

function goTo(p) {
  page.value = p
  loadList()
  document.getElementById('all-title')?.scrollIntoView?.({ block: 'start' })
}

// "Back to top" button under the list: only shown once the page has been scrolled down
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 400)
function toTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  lastKey = filtersKey()
  loadTop()
  loadList()
  loadFollowed()
})
</script>

<template>
  <h1>Builds</h1>

  <div class="filters">
    <select v-model="hero" aria-label="Hero" @change="((career = ''), (weapon = ''))">
      <option value="">All heroes</option>
      <option v-for="h in heroes" :key="h.id" :value="h.id">{{ h.name }}</option>
    </select>
    <select v-model="career" aria-label="Career" :disabled="!hero" @change="onCareerChange">
      <option value="">All careers</option>
      <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
    <select v-model="weapon" aria-label="Weapon" :disabled="!hero">
      <option value="">All weapons</option>
      <optgroup v-for="g in weaponGroups" :key="g.type" :label="g.label">
        <option v-for="w in g.weapons" :key="w.id" :value="w.id">{{ capitalize(w.name) }}</option>
      </optgroup>
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
    <SectionTitle
      id="top-title"
      icon="top"
      label="Top rated builds"
      storage-key="top"
      expandable
      v-model:hidden="hideTop"
      @open="openList = 'top'" />
    <CardCarousel v-if="!hideTop" label="Top rated builds">
      <BuildCard v-for="b in top" :key="b.id" :build="b" @liked="refresh" @bookmarked="refresh" />
    </CardCarousel>
  </section>

  <div v-if="top.length && showFollowed && !hideFollowed" class="ornament" aria-hidden="true">◆</div>

  <section v-if="showFollowed" class="block" aria-labelledby="followed-title">
    <SectionTitle
      id="followed-title"
      icon="following"
      label="From people I follow"
      storage-key="followed"
      expandable
      v-model:hidden="hideFollowed"
      @open="openList = 'followed'" />
    <CardCarousel v-if="!hideFollowed && followed.length" label="From people I follow">
      <BuildCard v-for="b in followed" :key="b.id" :build="b" @liked="refresh" @bookmarked="refresh" />
    </CardCarousel>
    <p v-else-if="!hideFollowed" class="empty-note">
      No {{ filterLabel }} builds published in the last {{ FEED_DAYS }} days by people you follow.
    </p>
  </section>

  <div v-if="(top.length || showFollowed) && !hideAll" class="ornament" aria-hidden="true">◆</div>

  <section aria-labelledby="all-title">
    <SectionTitle id="all-title" icon="all" label="All builds" storage-key="all" v-model:hidden="hideAll" />
    <!-- hidden with the eye: only the title is shown -->
    <template v-if="hideAll"></template>
    <p v-else-if="loading">Loading…</p>
    <p v-else-if="!builds.length">No builds match these filters. Create the first one!</p>
    <template v-else>
      <div class="grid">
        <BuildCard v-for="b in builds" :key="b.id" :build="b" @liked="refresh" @bookmarked="refresh" />
      </div>

      <nav v-if="pages > 1" class="pager" aria-label="Build pages">
        <button type="button" class="ghost" :disabled="page <= 1" @click="goTo(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pages }}</span>
        <button type="button" class="ghost" :disabled="page >= pages" @click="goTo(page + 1)">Next</button>
      </nav>

      <div v-if="scrolled" class="to-top">
        <button type="button" class="ghost" @click="toTop">↑ Back to top</button>
      </div>
    </template>
  </section>

  <ListModal
    v-if="openList === 'top'"
    title="Top rated builds"
    icon="top"
    :url="'/builds/top?' + heroCareerQuery()"
    @close="openList = ''"
    @liked="refresh"
    @bookmarked="refresh" />
  <ListModal
    v-else-if="openList === 'followed'"
    title="From people I follow"
    icon="following"
    :url="'/me/following/builds?' + heroCareerQuery()"
    @close="openList = ''"
    @liked="refresh"
    @bookmarked="refresh" />
</template>

<style scoped>
.block {
  margin-bottom: 2rem;
}
.filters .search {
  width: auto;
  min-width: 14rem;
}
.empty-note {
  margin: 0.4rem 0 0;
  color: var(--muted);
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
.to-top {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
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
