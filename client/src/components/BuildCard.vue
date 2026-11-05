<script setup>
import { useGameData } from '../composables/useGameData.js'

defineProps({ build: { type: Object, required: true } })

const { heroName, careerName } = useGameData()
</script>

<template>
  <RouterLink :to="`/builds/${build.id}`" class="card">
    <h3>{{ build.title }}</h3>
    <p class="meta">
      {{ heroName(build.heroId) }} — {{ careerName(build.heroId, build.careerId) }}
    </p>
    <p class="meta">by {{ build.author }}<span v-if="!build.isPublic"> (private)</span></p>
  </RouterLink>
</template>
