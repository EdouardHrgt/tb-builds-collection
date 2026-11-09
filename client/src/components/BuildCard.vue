<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import LikeButton from './LikeButton.vue'

const props = defineProps({ build: { type: Object, required: true } })
const emit = defineEmits(['liked'])

const { getCareer } = useGameData()

const career = computed(() => getCareer(props.build.heroId, props.build.careerId))

const comments = computed(() => props.build.commentCount ?? 0)
const commentsShown = computed(() => (comments.value > 99 ? '99+' : comments.value))
const commentsLabel = computed(() => `${comments.value} comment${comments.value === 1 ? '' : 's'}`)
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
        <div class="meta-row">
          <p class="meta">by {{ build.author }}</p>
          <span class="comment-count" role="img" :aria-label="commentsLabel" :title="commentsLabel">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round" />
            </svg>
            {{ commentsShown }}
          </span>
        </div>
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
.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 0.9rem;
}
.meta-row .meta {
  margin: 0;
}
.comment-count {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: var(--muted);
}
</style>
