<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api.js'
import { useGameData } from '../composables/useGameData.js'
import BuildCard from '../components/BuildCard.vue'

const { heroes } = useGameData()

const hero = ref('')
const career = ref('')
const top = ref([])
const builds = ref([])
const loading = ref(true)
const error = ref('')

const careers = computed(() => heroes.find((h) => h.id === hero.value)?.careers ?? [])

// `silent` = refresh in place (after a like) without the "Loading…" flash
async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  const q = new URLSearchParams()
  if (hero.value) q.set('hero', hero.value)
  if (career.value) q.set('career', career.value)
  try {
    const [list, topList] = await Promise.all([api('/builds?' + q), api('/builds/top?' + q)])
    builds.value = list.items
    top.value = topList.items
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
const refresh = () => load({ silent: true })

watch(hero, () => {
  career.value = ''
})
watch([hero, career], () => load())
onMounted(() => load())
</script>

<template>
  <h1>Builds</h1>
  <div class="filters">
    <select v-model="hero">
      <option value="">All heroes</option>
      <option v-for="h in heroes" :key="h.id" :value="h.id">{{ h.name }}</option>
    </select>
    <select v-model="career" :disabled="!hero">
      <option value="">All careers</option>
      <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
  </div>

  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="loading">Loading…</p>
  <template v-else>
    <section v-if="top.length" class="top-rated" aria-labelledby="top-title">
      <h2 id="top-title">Top rated builds</h2>
      <div class="grid">
        <BuildCard v-for="b in top" :key="b.id" :build="b" @liked="refresh" />
      </div>
    </section>

    <section aria-labelledby="all-title">
      <h2 id="all-title">All builds</h2>
      <p v-if="!builds.length">No builds match these filters. Create the first one!</p>
      <div v-else class="grid">
        <BuildCard v-for="b in builds" :key="b.id" :build="b" @liked="refresh" />
      </div>
    </section>
  </template>
</template>

<style scoped>
.top-rated {
  margin-bottom: 2rem;
}
</style>
