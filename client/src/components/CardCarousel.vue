<script setup>
import { ref, onMounted, onUpdated, onBeforeUnmount } from 'vue'

defineProps({
  label: { type: String, default: 'Builds' }, // accessible name of the carousel
  itemWidth: { type: String, default: '340px' }, // width of one card
})

const track = ref(null)
const canPrev = ref(false)
const canNext = ref(false)
let observer = null

function update() {
  const el = track.value
  if (!el) return
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

// One click = one full "page": the carousel jumps to the next cards that were not visible yet
// (or the previous ones), not just by one card.
function go(direction) {
  const el = track.value
  el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
}

onMounted(() => {
  update()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(update)
    observer.observe(track.value)
  }
})
onUpdated(update) // the cards changed (new filter, like...)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="carousel" role="region" :aria-label="label" :style="{ '--item-w': itemWidth }">
    <button type="button" class="arrow prev" :disabled="!canPrev" aria-label="Previous" @click="go(-1)">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div ref="track" class="track" @scroll.passive="update">
      <slot />
    </div>

    <button type="button" class="arrow next" :disabled="!canNext" aria-label="Next" @click="go(1)">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
}
.track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* the arrows replace the scrollbar (touch screens can still swipe) */
}
.track::-webkit-scrollbar {
  display: none;
}
.track > :slotted(*) {
  flex: 0 0 min(var(--item-w), 85%);
  scroll-snap-align: start;
}

.arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  color: var(--accent);
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 50%;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.5);
  transform: translateY(-50%);
  transition: opacity 0.2s, background 0.2s;
}
.arrow:hover:not(:disabled) {
  background: var(--line);
}
.arrow.prev {
  left: -1.1rem;
}
.arrow.next {
  right: -1.1rem;
}
/* No arrow when there is nothing more to see on that side */
.arrow:disabled {
  opacity: 0;
  pointer-events: none;
}
@media (max-width: 700px) {
  .arrow.prev {
    left: -0.4rem;
  }
  .arrow.next {
    right: -0.4rem;
  }
}
</style>
