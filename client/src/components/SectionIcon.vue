<script setup>
// Small line icon placed before the title of a list. name: top | following | all | mine | bookmarks
defineProps({ name: { type: String, required: true } })

const PATHS = {
  top: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3', // trophy
  following: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74', // two people
  all: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', // list
  mine: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2', // sword
  bookmarks: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z', // bookmark
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
