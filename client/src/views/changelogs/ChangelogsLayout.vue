<script setup>
// Wrapper of the "Changelogs" section (the former VT2 changelogs app): own background and header (the footer is the one of the whole site).
// Its styles (changelogs.css) only apply inside .vt2cl, so the rest of the site is not affected.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Header from '../../components/changelogs/Header.vue'
import '../../styles/changelogs.css'

// One fixed background (the dark one goes best with the colours of the site header and footer)
const backgroundImage = '/changelogs/background-2.webp'
const top = ref('0px')

// The site header is sticky: the sticky title bar of a career page sticks right under it
const measure = () => {
  top.value = (document.querySelector('header.top')?.offsetHeight ?? 0) + 'px'
}

// The header height also changes when its links wrap onto a second line or when the fonts finish loading
let observer
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  const header = document.querySelector('header.top')
  if (header && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(header)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  observer?.disconnect()
})
</script>

<template>
  <div
    class="vt2cl"
    :style="{ backgroundImage: `url(${backgroundImage})`, '--cl-top': top }">
    <Header />
    <RouterView :key="$route.path" />
  </div>
</template>
