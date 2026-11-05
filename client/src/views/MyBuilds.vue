<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api.js'
import BuildCard from '../components/BuildCard.vue'

const builds = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    builds.value = await api('/me/builds')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <h1>My builds</h1>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="loading">Loading…</p>
  <p v-else-if="!builds.length">
    You don't have any builds yet. <RouterLink to="/builds/new">Create your first one</RouterLink>
  </p>
  <div v-else class="grid">
    <BuildCard v-for="b in builds" :key="b.id" :build="b" />
  </div>
</template>
