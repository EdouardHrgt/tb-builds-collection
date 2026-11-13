<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import IconSelect from '../components/IconSelect.vue'
import BuildCard from '../components/BuildCard.vue'
import CardCarousel from '../components/CardCarousel.vue'
import SectionTitle from '../components/SectionTitle.vue'
import ListModal from '../components/ListModal.vue'

const { heroes, getHeroWeapons } = useGameData()
const auth = useAuth()

// Filters (the list shows 20 builds per page)
const career = ref('') // careers of all heroes in one list: nobody looks for a hero, always for a career
// A weapon is stored as "heroId:weaponId" because some weapon ids exist for several heroes (sword, axe, ...)
const weapon = ref('') // '' = no weapon filter
const weaponHero = computed(() => weapon.value.split(':')[0])
const weaponId = computed(() => weapon.value.split(':')[1] ?? '')
// The hero the server filters on: the one of the picked career, or else the one of the picked weapon
const hero = computed(
  () => heroes.find((h) => h.careers.some((c) => c.id === career.value))?.id ?? weaponHero.value,
)
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

// Weapons grouped by hero (melee and ranged together). Once a career is picked: only its hero, only its weapons.
const weaponGroups = computed(() =>
  heroes
    .filter((h) => !career.value || h.id === hero.value)
    .map((h) => ({
      hero: h,
      weapons: ['melee', 'ranged']
        .flatMap((type) => getHeroWeapons(h.id, type))
        .filter((w) => !career.value || w.availableFor.includes(career.value)),
    }))
    .filter((g) => g.weapons.length),
)
// Options of the two icon drop-downs
const careerGroups = computed(() =>
  heroes.map((h) => ({
    label: h.name,
    items: h.careers.map((c) => ({ value: c.id, label: c.name, icon: c.icon, round: true })),
  })),
)
const weaponOptions = computed(() =>
  weaponGroups.value.map((g) => ({
    label: g.hero.name,
    items: g.weapons.map((w) => ({ value: `${g.hero.id}:${w.id}`, label: capitalize(w.name), icon: w.icon })),
  })),
)
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const weaponName = computed(() => {
  const w = weaponGroups.value.flatMap((g) => g.weapons).find((x) => x.heroId === weaponHero.value && x.id === weaponId.value)
  return w ? capitalize(w.name) : ''
})
// A new career may not be able to use the picked weapon: then the weapon filter is cleared
function onCareerChange() {
  if (weapon.value && !weaponName.value) weapon.value = ''
}
const hasFilters = computed(
  () => career.value || weapon.value || username.value.trim() || sort.value !== 'newest',
)

// Name of the career in the filters, for the message of an empty "From people I follow"
const filterLabel = computed(() => {
  const base = heroes.flatMap((h) => h.careers).find((c) => c.id === career.value)?.name ?? ''
  return base && weaponName.value ? `${base} (${weaponName.value})` : base || weaponName.value
})
// That list is shown even when empty, but only to explain a filter (otherwise an empty list just stays hidden)
const showFollowed = computed(
  () => followed.value.length > 0 || (!!auth.user && followedLoaded.value && !!(career.value || weapon.value)),
)

const heroCareerQuery = () => {
  const q = new URLSearchParams()
  if (hero.value) q.set('hero', hero.value)
  if (career.value) q.set('career', career.value)
  if (weaponId.value) q.set('weapon', weaponId.value)
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
    const res = await api('/me/following/builds?' + heroCareerQuery())
    followed.value = res.items
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

// Only the career and the weapon also change the two carousels (top rated, followed).
watch([career, weapon], () => {
  loadTop()
  loadFollowed()
})
watch([career, weapon, sort], applyFilters)

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
    <IconSelect v-model="career" :groups="careerGroups" placeholder="Careers" aria-label="Career" @change="onCareerChange" />
    <IconSelect v-model="weapon" :groups="weaponOptions" placeholder="Weapons" aria-label="Weapon" />
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
      <BuildCard
        v-for="b in followed"
        :key="b.id"
        :build="b"
        :is-new="b.isNew"
        @liked="refresh"
        @bookmarked="refresh" />
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
