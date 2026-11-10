<script setup>
import { showDescriptions } from '../composables/useDescriptions.js'
</script>

<template>
  <button
    type="button"
    class="toggle"
    :aria-expanded="showDescriptions"
    @click="showDescriptions = !showDescriptions">
    {{ showDescriptions ? 'Hide descriptions' : 'Show descriptions' }}
  </button>
</template>

<style scoped>
.toggle {
  background: transparent;
  color: var(--career-color, var(--accent));
  border-color: var(--line);
  transition: all 0.3s ease-out;
}
.toggle:hover {
  border-color: var(--career-color, var(--accent));
}
</style>
