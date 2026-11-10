<script setup>
import { ref, onMounted, onUpdated, onBeforeUnmount } from 'vue'

defineProps({
  label: { type: String, default: 'Builds' }, // accessible name of the carousel
  itemWidth: { type: String, default: '340px' }, // width of one card
})

// Arrow style. true: tall translucent strips in the side margins of the page, shown only while the mouse is
// over the carousel (or the keyboard is in it) and never on touch screens. false: the round buttons
// on the edges of the cards, always visible when there is more to see.
const ARROWS_ON_HOVER = true

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

// Mouse: drag the cards sideways like on a video platform (touch screens already swipe, and a
// trackpad or Shift + wheel already scroll sideways). Snapping is switched off during the drag and
// comes back at the end, so the cards settle on the nearest one.
const dragging = ref(false)
let drag = null // { startX, startLeft, moved }
const DRAG_THRESHOLD = 5 // px: under this it is a click, not a drag

function onPointerDown(e) {
  if (e.pointerType !== 'mouse' || e.button !== 0) return
  drag = { startX: e.clientX, startLeft: track.value.scrollLeft, moved: false }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}
function onPointerMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.startX
  if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return
  if (!drag.moved) {
    drag.moved = true
    dragging.value = true
    track.value.style.scrollSnapType = 'none'
  }
  track.value.scrollLeft = drag.startLeft - dx
}
function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  if (drag?.moved) {
    track.value.style.scrollSnapType = ''
    // the click that follows the release must not open the card under the pointer
    suppressClick = true
    setTimeout(() => (suppressClick = false), 0)
  }
  dragging.value = false
  drag = null
}
let suppressClick = false
function onClickCapture(e) {
  if (suppressClick) {
    e.preventDefault()
    e.stopPropagation()
  }
}

onMounted(() => {
  update()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(update)
    observer.observe(track.value)
  }
})
onUpdated(update) // the cards changed (new filter, like...)
onBeforeUnmount(() => {
  observer?.disconnect()
  onPointerUp()
})
</script>

<template>
  <div
    class="carousel"
    :class="{ 'on-hover': ARROWS_ON_HOVER }"
    role="region"
    :aria-label="label"
    :style="{ '--item-w': itemWidth }">
    <button type="button" class="arrow prev" :disabled="!canPrev" aria-label="Previous" @click="go(-1)">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      ref="track"
      class="track"
      :class="{ dragging }"
      @scroll.passive="update"
      @pointerdown="onPointerDown"
      @click.capture="onClickCapture"
      @dragstart.prevent>
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
/* Hover: the area of the carousel gets darker (edge to edge, like the arrow strips), so it reads as a
   section of its own that can be dragged. Mouse only: a touch screen has no hover. */
.carousel::before {
  content: '';
  position: absolute;
  inset: -0.6rem calc(var(--side-padding) * -1) -0.2rem;
  background: rgb(0 0 0 / 0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
}
@media (hover: hover) {
  .carousel:hover::before {
    opacity: 1;
  }
}
.track {
  position: relative; /* above the dark area */
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* no scrollbar: arrows, mouse drag, trackpad or swipe instead */
  cursor: grab;
}
.track.dragging {
  cursor: grabbing;
  user-select: none;
}
.track.dragging > :slotted(*) {
  pointer-events: none; /* no hover effects while dragging */
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
  /* Test 1: light, slightly transparent white with a black outline and arrow.
     Test 2 (glass): background: rgb(255 255 255 / 0.15); backdrop-filter: blur(8px); color: #fff; border: 1px solid rgb(255 255 255 / 0.4); */
  color: #000;
  background: rgb(255 255 255 / 0.85);
  border: 1px solid #000;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.5);
  transform: translateY(-50%);
  transition: opacity 0.2s, background 0.2s;
}
.arrow:hover:not(:disabled) {
  background: #fff;
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
/* Arrows on hover: a full height strip in the side margin of the page (it covers no card, so the like and
   bookmark buttons of the cards at the edges stay clickable) */
.on-hover .arrow {
  top: 0;
  bottom: 0.4rem; /* the space under the track */
  width: var(--side-padding);
  height: auto;
  color: #fff; /* white chevron on the dark strip */
  background: rgb(0 0 0 / 0.55); /* a bit darker than the hover veil of the carousel (0.28) */
  border: 0;
  border-radius: 0;
  box-shadow: none;
  transform: none;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}
.on-hover:hover .arrow:not(:disabled),
.on-hover:focus-within .arrow:not(:disabled) {
  opacity: 1;
}
.on-hover .arrow:hover:not(:disabled) {
  background: rgb(0 0 0 / 0.75);
}
.on-hover .arrow.prev {
  left: calc(var(--side-padding) * -1);
}
.on-hover .arrow.next {
  right: calc(var(--side-padding) * -1);
}
@media (hover: none) {
  .on-hover .arrow {
    display: none; /* touch screens: swipe */
  }
}
@media (prefers-reduced-motion: reduce) {
  .carousel::before {
    transition: none;
  }
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
