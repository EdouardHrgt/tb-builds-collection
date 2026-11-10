<script setup>
// Small line icon (gold) placed before a title. name: top | following | all | mine | bookmarks (lists)
// | perks | passive | talents | equipment | breakpoints | team | comments (page of a build)
defineProps({ name: { type: String, required: true } })

const PATHS = {
  top: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3', // trophy
  following: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74', // two people
  all: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', // list
  mine: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2', // sword
  bookmarks: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z', // bookmark
  perks: 'M6 3h12l4 6-10 12L2 9zM11 3 8 9l4 12 4-12-3-6M2 9h20', // gem
  passive: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z', // lightning bolt
  talents: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', // star
  equipment: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', // shield
  breakpoints: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', // target
  team: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74', // two people
  comments: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', // speech bubble
}
</script>

<template>
  <svg class="section-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      :d="PATHS[name]"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.section-icon {
  flex: none;
  width: 1.4em;
  height: 1.4em;
  color: var(--accent);
}
</style>
