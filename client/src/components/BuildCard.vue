<script setup>
import { computed } from 'vue'
import { useGameData } from '../composables/useGameData.js'
import LikeButton from './LikeButton.vue'
import BookmarkButton from './BookmarkButton.vue'
import { BALANCE } from '../utils/balance.js'
import { buildRoles } from '../utils/roles.js'

const props = defineProps({
  build: { type: Object, required: true },
  isNew: { type: Boolean, default: false }, // published since the person last looked (followed people)
  newComments: { type: Number, default: 0 }, // unread comments for the person (on their build, or replies to them)
})
const emit = defineEmits(['liked', 'bookmarked'])

const { getCareer } = useGameData()

const career = computed(() => getCareer(props.build.heroId, props.build.careerId))

// The career color (heroes.json) colors the top edge of the card
const careerStyle = computed(() => (career.value?.color ? { '--career-color': career.value.color } : {}))

// Made for an older Tourney Balance version than the current one: a small tag in the corner
const oldVersion = computed(() => {
  const v = props.build.data?.balance
  return v && v !== BALANCE.version ? v : ''
})

// "Tank · Support": the roles of the build, in a single small line
const rolesText = computed(() =>
  buildRoles(props.build)
    .map((r) => r.name)
    .join(' · '),
)

const comments = computed(() => props.build.commentCount ?? 0)
const commentsShown = computed(() => (comments.value > 99 ? '99+' : comments.value))
const commentsLabel = computed(
  () =>
    `${comments.value} comment${comments.value === 1 ? '' : 's'}` +
    (props.newComments ? `, ${props.newComments} unread` : ''),
)
</script>

<template>
  <!-- The like and bookmark buttons are siblings of the link, not inside it: a button inside a link is invalid HTML.
       Layout (vertical):   COMMENTS   PORTRAIT   LIKE
                                  [NEW]
                                     TITLE (2 lines max)
                                  by AUTHOR
                                      ROLES -->
  <div class="card-wrap">
    <RouterLink :to="`/builds/${build.id}`" class="card" :style="careerStyle">
      <div class="top-row">
        <div class="side left">
          <span class="comment-count" :class="{ unread: newComments > 0 }" role="img" :aria-label="commentsLabel" :title="commentsLabel">
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
        </div>

        <!-- The tags sit on the lower half of the portrait (out of the flow: the card keeps its height) -->
        <div class="portrait-box">
          <img
            v-if="career?.icon"
            :src="career.icon"
            :alt="career.name"
            width="64"
            height="79"
            class="portrait"
            loading="lazy" />
          <span v-else class="portrait" aria-hidden="true"></span>
          <div v-if="isNew || oldVersion" class="tags">
            <span v-if="isNew" class="tag new-tag" title="Published since your last visit">New</span>
            <span v-if="oldVersion" class="tag old-tag" :title="`Made for an older ${BALANCE.name} version`">Outdated</span>
          </div>
        </div>

        <!-- (bookmark and like sit in the top of this cell, see .corner-actions) -->
        <div class="side right"></div>
      </div>

      <h3 :title="build.title">{{ build.title }}</h3>
      <p class="meta author" :title="build.author">by {{ build.author }}</p>
      <p v-if="rolesText" class="roles" :title="rolesText">{{ rolesText }}</p>
    </RouterLink>

    <!-- Top right corner: bookmark, then like (they are siblings of the link, see above) -->
    <div class="corner-actions">
      <BookmarkButton :build="build" @changed="(res) => emit('bookmarked', res)" />
      <LikeButton :build="build" @changed="emit('liked')" />
    </div>
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
  /* same box as the like button (icon 22px, same padding and border), mirrored on the left side */
  margin-left: -0.4rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid transparent;
  font-size: 0.9rem;
  color: var(--muted);
}
/* Unread comments: the counter turns into a --flashy pill (same size as the border box, so the card does not change) */
.comment-count.unread {
  color: #1a1a1a;
  font-weight: 700;
  background: var(--flashy);
  border-radius: 999px;
}
/* Bookmark (left) and like (right): in the top right corner, level with the top of the portrait */
.corner-actions {
  position: absolute;
  top: calc(0.8rem + 1px);
  right: 0.25rem;
  display: flex;
  align-items: center;
}
/* Tighter side paddings than on the other pages, so the pair stays beside the portrait (the cell is only about 85px wide) */
.corner-actions :deep(.bookmark) {
  padding-inline: 0.3rem;
}
.corner-actions :deep(.like) {
  padding-inline: 0.35rem;
  gap: 0.2rem;
}
/* "New" and "Outdated": on the lower half of the portrait, a bit wider than it. Out of the flow (position: absolute)
   so a card with tags is as high as one without. Raise the negative bottom to move them lower. */
.portrait-box {
  position: relative;
}
.tags {
  position: absolute;
  bottom: -6px;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: translateX(-50%);
}
.tag {
  box-sizing: border-box;
  min-width: calc(var(--portrait-w) + 14px);
  padding-inline: 0.6rem;
  line-height: 18px;
  font-size: 0.68rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  color: #1a1a1a;
  border-radius: 999px;
}
.new-tag {
  background: var(--accent);
}
.old-tag {
  background: var(--flashy);
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
  font-family: 'Quintessential', serif; /* same font as the "Talents" titles of the Changelogs */
  font-weight: 400; /* this font only has one weight: a bold would be faked by the browser */
  line-height: 1.25;
  letter-spacing: 0.7px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
/* Roles: one small line under the author */
.roles {
  box-sizing: border-box;
  max-width: 100%;
  margin: 0.25rem 0 0;
  padding: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  color: var(--career-color, var(--accent));
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* Author name: one line, "…" when too long */
.author {
  box-sizing: border-box;
  max-width: 100%;
  margin: 0;
  padding: 0;
  color: var(--muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
