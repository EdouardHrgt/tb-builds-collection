<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'

const props = defineProps({ build: { type: Object, required: true } })

const { getCareer } = useGameData()

const career = computed(() => getCareer(props.build.heroId, props.build.careerId))
</script>

<template>
  <RouterLink :to="`/builds/${build.id}`" class="card">
    <img
      v-if="career?.icon"
      :src="career.icon"
      :alt="career.name"
      width="64"
      height="79"
      class="portrait"
      loading="lazy"
    />
    <span v-else class="portrait placeholder" aria-hidden="true"></span>

    <div class="info">
      <h3>{{ build.title }}</h3>
      <p class="meta author">by {{ build.author }}<span v-if="!build.isPublic"> (private)</span></p>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.portrait {
  flex: none;
  width: 64px;
  height: auto;
  aspect-ratio: 154 / 189;
  object-fit: cover;
  overflow: hidden;
  font-size: 0.7rem;
  /* border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg); */
}
.info {
  min-width: 0; /* lets long titles wrap instead of stretching the card */
}
.info h3 {
  overflow-wrap: anywhere;
}
.author {
  font-style: oblique;
}
</style>