<script setup>
// Wrapper of the "Changelogs" section (the former VT2 changelogs app): own background, header and footer.
// Its styles (changelogs.css) only apply inside .vt2cl, so the rest of the site is not affected.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Header from '../../components/changelogs/Header.vue'
import DocumentationLinks from '../../components/changelogs/DocumentationLinks.vue'
import '../../styles/changelogs.css'

// One fixed background (the dark one goes best with the colours of the site header and footer)
const backgroundImage = '/changelogs/background-2.webp'
const top = ref('0px')

// The site header is sticky: the sticky title bar of a career page sticks right under it
const measure = () => {
  top.value = (document.querySelector('header.top')?.offsetHeight ?? 0) + 'px'
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <div
    class="vt2cl"
    :style="{ backgroundImage: `url(${backgroundImage})`, '--cl-top': top }">
    <Header />
    <RouterView :key="$route.path" />
    <DocumentationLinks />
  </div>
</template>
