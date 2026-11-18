<script setup>
import BellIcon from './BellIcon.vue'

// The bell of the header: a link that appears when there is something new. The number is only in its tooltip.
//   <NavBell :to="..." label="3 unread comments" />
defineProps({
  to: { type: [String, Object], required: true },
  label: { type: String, required: true },
})
</script>

<template>
  <!-- No active class: the bell is a shortcut, never the "page you are on" (it would turn gold like a link) -->
  <RouterLink :to="to" class="bell" :title="label" :aria-label="label" active-class="" exact-active-class=""
    ><BellIcon :size="18"
  /></RouterLink>
</template>

<style scoped>
.bell {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem;
  color: var(--flashy);
  transition: filter 0.2s, transform 0.2s;
}
.bell:hover,
.bell:focus-visible {
  filter: brightness(1.25);
  transform: rotate(-12deg);
  opacity: 1;
}
/* the underline that grows under the header links does not apply to a bell */
.bell::after {
  display: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .bell {
    transition: none;
  }
  .bell:hover,
  .bell:focus-visible {
    transform: none;
  }
}
</style>
