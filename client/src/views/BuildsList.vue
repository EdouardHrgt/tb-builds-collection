<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api.js'
import { useGameData } from '../composables/useGameData.js'
import BuildCard from '../components/BuildCard.vue'

const { heroes } = useGameData()

const hero = ref('')
const career = ref('')
const builds = ref([])
const loading = ref(true)
const error = ref('')

const careers = computed(() => heroes.find((h) => h.id === hero.value)?.careers ?? [])

async function load() {
  loading.value = true
  error.value = ''
  const q = new URLSearchParams()
  if (hero.value) q.set('hero', hero.value)
  if (career.value) q.set('career', career.value)
  try {
    builds.value = (await api('/builds?' + q)).items
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(hero, () => {
  career.value = ''
})
watch([hero, career], load)
onMounted(load)
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
  <p v-else-if="!builds.length">No builds match these filters. Create the first one!</p>
  <div v-else class="grid">
    <BuildCard v-for="b in builds" :key="b.id" :build="b" />
  </div>
</template>
