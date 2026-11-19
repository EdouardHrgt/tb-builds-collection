<script setup>
// One small icon per role (ids from data/roles.json). Takes the color of the text around it.
// An id without an icon (a role added to the JSON later) shows nothing.
defineProps({
  id: { type: String, required: true },
  size: { type: Number, default: 22 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false">
    <!-- Melee DPS: sword -->
    <template v-if="id === 'meleedps'">
      <path d="M20 4l-9.5 9.5" />
      <path d="M14 4h6v6" />
      <path d="M7 11l6 6" />
      <path d="M4 20l3.5-3.5" />
    </template>
    <!-- Ranged DPS: crosshair -->
    <template v-else-if="id === 'rangeddps'">
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
    </template>
    <!-- Tank: shield -->
    <path v-else-if="id === 'tank'" d="M12 3l8 3v6c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V6z" />
    <!-- Support: plus -->
    <path v-else-if="id === 'support'" d="M12 5v14M5 12h14" stroke-width="2.6" />
    <!-- Backliner: two chevrons pointing back (down) -->
    <path v-else-if="id === 'backliner'" d="M6 6l6 6 6-6M6 13l6 6 6-6" />
    <!-- Objective runner: flag -->
    <template v-else-if="id === 'objectiverunner'">
      <path d="M6 21V4" />
      <path d="M6 5h12l-3 4 3 4H6" />
    </template>
  </svg>
</template>
