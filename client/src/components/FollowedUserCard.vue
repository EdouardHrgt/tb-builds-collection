<script setup>
import { avatarSrc } from '../utils/avatars.js'
import { SHIELD } from '../utils/shield.js'

// A followed account as a shield: only its outline is drawn, the avatar fills it (cropped on its top),
// name / builds / followers are on its lower half, and a small unfollow icon sits astride its edge.
// The shapes it uses (#shield-clip, #shield-fade) are defined once by the page (see MyBuilds.vue).
//   <FollowedUserCard :user="u" @unfollow="(username) => ..." />
defineProps({
  user: { type: Object, required: true }, // { username, avatar, buildCount, followerCount (null = hidden) }
})
defineEmits(['unfollow'])

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <div class="user-card">
    <svg class="shield" viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <image
        :href="avatarSrc(user.avatar)"
        width="100"
        height="120"
        preserveAspectRatio="xMidYMin slice"
        clip-path="url(#shield-clip)" />
      <path :d="SHIELD" fill="url(#shield-fade)" />
      <path :d="SHIELD" class="outline" fill="none" />
    </svg>
    <div class="shield-text">
      <RouterLink :to="`/u/${user.username}`" class="user-link">
        <strong class="user-name" :title="user.username">{{ user.username }}</strong>
        <span class="meta">{{ plural(user.buildCount, 'build') }}</span>
        <span v-if="user.followerCount !== null" class="meta">{{ plural(user.followerCount, 'follower') }}</span>
      </RouterLink>
    </div>
    <button
      type="button"
      class="unfollow"
      :aria-label="`Unfollow ${user.username}`"
      :title="`Unfollow ${user.username}`"
      @click="$emit('unfollow', user.username)">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 8h5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.user-card {
  position: relative; /* the link stretches over the whole card (see .user-link::after) */
  aspect-ratio: 100 / 120;
}
.shield {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.5));
}
.shield .outline {
  stroke: var(--line);
  stroke-width: 2;
  stroke-linejoin: round;
  transition: stroke 0.2s;
}
.user-card:hover .outline {
  stroke: var(--accent);
}
.shield-text {
  position: absolute;
  right: 14%;
  bottom: 22%;
  left: 14%;
  min-height: 3.6rem; /* room for 3 lines, the text starts at the top: with a hidden follower count (2 lines)
                         the name stays at the same height as on the other cards */
  text-align: center;
}
.user-link {
  display: flex;
  flex-direction: column;
  align-items: center; /* a name wider than the shield sticks out equally on both sides */
  gap: 0.1rem;
  min-width: 0;
  color: var(--text);
  text-decoration: none;
}
/* the whole card is clickable: the link stretches over it (the unfollow icon stays above) */
.user-link::after {
  content: '';
  position: absolute;
  inset: 0;
}
.user-name {
  white-space: nowrap; /* never cut: a long name goes beyond the edges of the shield */
  text-shadow: 0 1px 4px #000, 0 0 2px #000; /* stays readable where it leaves the shield */
}
.user-card .meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
/* Unfollow: small icon astride the sloping top right edge of the shield, on a disc with a thin border
   so it shows on the avatar as well as on the page background */
.unfollow {
  position: absolute;
  top: 2.5%;
  right: 17%;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 0.25rem;
  color: var(--danger);
  background: var(--panel);
  border: 1px solid var(--line);
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
}
/* hover: the icon grows, gets a light red background and a brighter red */
.unfollow:hover,
.unfollow:focus-visible {
  color: #ff6b5e;
  background: color-mix(in srgb, var(--danger) 30%, var(--panel));
  border-color: var(--danger);
  transform: scale(1.15);
}
</style>
