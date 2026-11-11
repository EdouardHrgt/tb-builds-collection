<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { showDescriptions } from '../composables/useDescriptions.js'

// The button stays where it is while it is on the screen. When scrolling would take it out of view (above the
// page), it sticks under the header instead, at the same horizontal position. `holder` keeps its place in the
// page, so nothing jumps when it sticks or comes back.
const holder = ref(null)
const stuck = ref(false)
const box = ref({ left: 0, top: 0, width: 0, height: 0 })
let observer = null

const headerHeight = () => document.querySelector('header.top')?.offsetHeight ?? 0

function measure() {
  const r = holder.value.getBoundingClientRect()
  box.value = { left: r.left, top: headerHeight() + 8, width: r.width, height: r.height }
}
function onResize() {
  if (stuck.value) measure()
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      // Out of view because it went above the screen (below it, it just has not been reached yet)
      const above = !entry.isIntersecting && entry.boundingClientRect.top < headerHeight()
      if (above && !stuck.value) measure()
      stuck.value = above
    },
    { rootMargin: `-${headerHeight()}px 0px 0px 0px` },
  )
  observer.observe(holder.value)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <span
    ref="holder"
    class="holder"
    :style="stuck ? { width: box.width + 'px', height: box.height + 'px' } : null">
    <button
      type="button"
      class="toggle"
      :class="{ stuck }"
      :style="stuck ? { left: box.left + 'px', top: box.top + 'px' } : null"
      :aria-expanded="showDescriptions"
      @click="showDescriptions = !showDescriptions">
      {{ showDescriptions ? 'Hide descriptions' : 'Show descriptions' }}
    </button>
  </span>
</template>

<style scoped>
.holder {
  display: inline-block;
}
.toggle {
  background: transparent;
  color: var(--career-color, var(--accent));
  border-color: var(--line);
  transition: all 0.3s ease-out;
}
.toggle:hover {
  border-color: var(--career-color, var(--accent));
}
/* Stuck under the header: a solid background, so the page does not show through the button */
.toggle.stuck {
  position: fixed;
  z-index: 9; /* just under the header (10) */
  background: var(--panel);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.85), 0 2px 4px rgb(0 0 0 / 0.6); /* dark shadow under the button */
}
</style>
