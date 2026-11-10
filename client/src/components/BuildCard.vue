<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import LikeButton from './LikeButton.vue'
import BookmarkButton from './BookmarkButton.vue'

const props = defineProps({ build: { type: Object, required: true } })
const emit = defineEmits(['liked', 'bookmarked'])

const { getCareer } = useGameData()

const career = computed(() => getCareer(props.build.heroId, props.build.careerId))

// The career color (heroes.json) colors the top edge of the card
const careerStyle = computed(() => (career.value?.color ? { '--career-color': career.value.color } : {}))

const comments = computed(() => props.build.commentCount ?? 0)
const commentsShown = computed(() => (comments.value > 99 ? '99+' : comments.value))
const commentsLabel = computed(() => `${comments.value} comment${comments.value === 1 ? '' : 's'}`)
</script>

<template>
  <!-- The like and bookmark buttons are siblings of the link, not inside it: a button inside a link is invalid HTML.
       Layout (vertical):   COMMENTS   PORTRAIT   LIKE
                                     TITLE (2 lines max)
                                  by AUTHOR            BOOKMARK -->
  <div class="card-wrap">
    <RouterLink :to="`/builds/${build.id}`" class="card" :style="careerStyle">
      <div class="top-row">
        <span class="comment-count" role="img" :aria-label="commentsLabel" :title="commentsLabel">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round" />
          </svg>
          {{ commentsShown }}
        </span>

        <img
          v-if="career?.icon"
          :src="career.icon"
          :alt="career.name"
          width="64"
          height="79"
          class="portrait"
          loading="lazy" />
        <span v-else class="portrait" aria-hidden="true"></span>
        <!-- (the like button sits in this empty third cell, see .like-corner) -->
      </div>

      <h3 :title="build.title">{{ build.title }}</h3>
      <p class="meta author" :title="build.author">by {{ build.author }}</p>
    </RouterLink>

    <LikeButton class="like-corner" :build="build" @changed="emit('liked')" />
    <BookmarkButton class="bookmark-corner" :build="build" @changed="(res) => emit('bookmarked', res)" />
  </div>
</template>

<style scoped>
.card-wrap {
  --portrait-w: 64px;
  position: relative;
  height: 100%; /* the cards of a row all get the same height */
}
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 0.8rem 0.8rem 0.9rem;
  text-align: center;
  position: relative;
  /* Subtle diagonal gradient: starts from the usual card color (top left) and gets a bit darker
     toward the bottom right. Raise the 82% for an even fainter effect. */
  background: linear-gradient(135deg, var(--panel), color-mix(in srgb, var(--panel) 82%, #000));
}
/* Hover: the border takes the career color (gold when it has none), instead of the global gold */
.card:hover {
  border-color: var(--career-color, var(--accent));
}
/* Colored band on the top edge: the career color (gold when it has none) in the middle,
   fading to the --line color on both sides. The 90% makes it softer: lower it for a fainter band. */
.card::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  left: -1px;
  height: 3px;
  background: linear-gradient(
    to right,
    var(--line),
    color-mix(in srgb, var(--career-color, var(--accent)) 50%, transparent) 50%,
    var(--line)
  );
  border-radius: 4px 4px 0 0;
}
.top-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start; /* comments and like line up with the top of the portrait */
  width: 100%;
}
.comment-count {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  justify-self: start;
  /* same box as the like button (icon 22px, same padding and border), mirrored on the left side */
  margin-left: -0.4rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid transparent;
  font-size: 0.9rem;
  color: var(--muted);
}
/* Like: in the right cell of the top row, level with the top of the portrait */
.like-corner {
  position: absolute;
  top: calc(0.8rem + 1px);
  right: 0.4rem;
}
.bookmark-corner {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
}
/* No background, no border: the portrait stands alone */
.portrait {
  display: block;
  width: var(--portrait-w);
  height: auto; /* overrides the height attribute: the height comes from aspect-ratio */
  aspect-ratio: 154 / 189; /* original image ratio: 64px wide -> about 78.5px tall */
  object-fit: cover;
  overflow: hidden;
  font-size: 0.7rem; /* alt text, only visible if the image fails to load */
  border-radius: 8px;
}
/* The title may take 2 lines; after that "…" (the full title is in the tooltip) */
.card h3 {
  display: -webkit-box;
  max-width: 100%;
  margin: 0.6rem 0 0.2rem;
  overflow: hidden;
  overflow-wrap: anywhere;
  line-height: 1.25;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
/* Same room on both sides, so the centered name never goes under the bookmark in the corner */
.author {
  box-sizing: border-box;
  max-width: 100%;
  margin: 0;
  padding: 0 2rem;
  color: var(--muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
