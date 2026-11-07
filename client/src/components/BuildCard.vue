<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import LikeButton from './LikeButton.vue'

const props = defineProps({ build: { type: Object, required: true } })
const emit = defineEmits(['liked'])

const { getCareer } = useGameData()

const career = computed(() => getCareer(props.build.heroId, props.build.careerId))
</script>

<template>
  <!-- The star is a sibling of the link, not inside it: a button inside a link is invalid HTML -->
  <div class="card-wrap">
    <RouterLink :to="`/builds/${build.id}`" class="card">
      <img
        v-if="career?.icon"
        :src="career.icon"
        :alt="career.name"
        width="64"
        height="79"
        class="portrait"
        loading="lazy" />
      <span v-else class="portrait" aria-hidden="true"></span>

      <div class="info">
        <h3>{{ build.title }}</h3>
        <p class="meta">by {{ build.author }}</p>
      </div>
    </RouterLink>

    <LikeButton class="like-corner" :build="build" @changed="emit('liked')" />
  </div>
</template>

<style scoped>
.card-wrap {
  position: relative;
}
.card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding-right: 4.5rem; /* room for the star in the top right corner */
}
.like-corner {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}
.portrait {
  flex: none;
  width: 64px;
  height: auto; /* overrides the height attribute: the height comes from aspect-ratio */
  aspect-ratio: 154 / 189; /* original image ratio: 64px wide -> about 78.5px tall */
  object-fit: cover;
  overflow: hidden;
  font-size: 0.7rem; /* alt text, only visible if the image fails to load */
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
}
.info {
  min-width: 0; /* lets long titles wrap instead of stretching the card */
}
.info h3 {
  overflow-wrap: anywhere;
}
</style>
