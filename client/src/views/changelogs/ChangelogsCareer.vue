<template>
  <div class="career-page" v-if="career">
    
      <section class="title-mods" :class="{ 'title-mods-scrolled': isSticky }" ref="stickySection">
        <div class="title-infos" v-if="modName">
          <h1>{{ career }} :</h1>
          <p class="title-mod-name">{{ modName }}</p>
        </div>
        <h1 v-else>
          {{ career }} :
          <span class="sub-h1">(Please select a Mod)</span>
        </h1>
        <ModPicker @modSelected="handleModSelection" :selectedModId="selectedModId" />
      </section>
    
    <div v-if="modName">
      <p class="err" v-if="errorMsg">... No Changelogs found for this Mod ...</p>
      <!-- WEAPONS -->
      <!-- (modData is still null while the file of the mod is loading: without "?." the page crashes and the next navigation breaks) -->
      <WeaponsCarousel :weapons="modData.weapons" :mod="modName" v-if="modData?.weapons" />
      <!-- CAREERS CHANGES -->
      <div class="articles-container" v-if="errorMsg == false">
        <GlobalChanges :modLabel="modName" />
        <CareerArticle
          v-for="(cls, index) in careersList"
          :key="cls.name || index"
          :career="cls"
          :index="index"
          :mod-name="modName" />
        <button @click="scrollToTop" class="back-to-top">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span>Scroll to top</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import ModPicker from '../../components/changelogs/ModPicker.vue'
import WeaponsCarousel from '../../components/changelogs/WeaponsCarousel.vue'
import GlobalChanges from '../../components/changelogs/GlobalChanges.vue'
import CareerArticle from '../../components/changelogs/CareerArticle.vue'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const route = useRoute()
const career = ref(route.params.career)
const modData = ref(null)
const modName = ref('')
const errorMsg = ref(false)
const isSticky = ref(false)
const stickySection = ref(null)
const selectedModId = ref(null)

const modFiles = {
  1: 'tourney-balance.json',
  2: 'class-balance.json',
  3: 'core-balance.json',
  4: 'linesman-balance.json',
  5: 'live-remastered.json'
}

const handleModSelection = async (mod) => {
  modName.value = mod.label
  selectedModId.value = mod.id
  try {
    const fileName = modFiles[mod.id]
    const response = await fetch(`/changelogs/data/${fileName}`)

    if (!response.ok) {
      throw new Error(`Error while loading of : ${fileName}`)
      errorMsg.value = true
    }

    const jsonData = await response.json()
    modData.value = jsonData[career.value] || null
    errorMsg.value = false
  } catch (error) {
    console.error('Error:', error)
    modData.value = null
    errorMsg.value = true
  }
}

// The site header (sticky) sits above: the title bar sticks right under it
const stickyTop = () => document.querySelector('header.top')?.offsetHeight ?? 0

const handleScroll = () => {
  if (!stickySection.value) return

  const rect = stickySection.value.getBoundingClientRect()
  isSticky.value = rect.top <= stickyTop()
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  await nextTick()

  handleScroll()

  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const careersList = computed(() => {
  const careers = modData.value?.careers
  if (!careers) return []
  return Array.isArray(careers) ? careers : Object.values(careers)
})
</script>

<style scoped>
.title-mods {
  position: sticky;
  top: var(--cl-top, 0px);
  background-color: none;
  z-index: 10;
  transition:
    background-color 0.5s ease,
    box-shadow 0.5s ease,
    padding 0.5s ease;
}

.title-mods-scrolled {
  /* same dark blue as the site header */
  background: linear-gradient(rgb(0 0 0 / 0.09), rgb(0 0 0 / 0.24)), var(--panel);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding-block: 1rem;
  border-bottom: 1px solid var(--line);
}

.title-infos {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

h1,
.title-mod-name {
  font-size: var(--fs-mega);
  text-align: center;
  margin-block: 0.5rem;
  text-transform: uppercase;
  font-family: 'Rubik Marker Hatch', system-ui;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-mod-name {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-h1 {
  font-size: var(--fs-1);
  color: var(--grey-400);
  margin-left: 1rem;
}

.articles-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-inline: 2rem;
  margin-top: 3rem;
}

@keyframes scaleup {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.err {
  font-family: 'Rubik Marker Hatch', system-ui;
  font-weight: 400;
  font-style: normal;
  text-align: center;
  font-size: var(--fs-1);
  background: linear-gradient(to top, rgb(203 155 81 / 0.3), rgb(246 226 122 / 0.25));
  margin-inline: auto;
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  padding-block: 5rem;
  transform: translateY(-50%);
  animation: scaleup 0.3s ease-out forwards;
}

.back-to-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 3rem; /* (was 18rem to leave room for the former absolute footer) */
  margin-inline: auto;
  width: 14rem;
  padding: 1rem 2rem;
  font-size: var(--fs-3);
  font-family: 'Lexend Deca', sans-serif;
  font-weight: 600;
  color: var(--black-400);
  background: linear-gradient(to right, #cb9b51, #f6e27a, #cb9b51);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgb(246 226 122 / 0.3);
}

@media (hover: hover) {
  .back-to-top:hover {
    transform: translateY(-3px);
    filter: brightness(1.25); /* same hover as the site logo */
    box-shadow: 0 6px 20px rgb(246 226 122 / 0.5);
  }
}

.back-to-top:active {
  transform: translateY(-1px);
}

.back-to-top svg {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media (max-width: 750px) {
  .back-to-top {
    padding: 0.8rem 1.5rem;
  }
}

@media (max-width: 1130px) {
  .title-mods {
    padding-inline: 2rem;
  }
}

@media (max-width: 750px) {
  .title-mods,
  .articles-container {
    padding-inline: 1.2rem;
  }
  .title-infos {
    display: block;
    margin-bottom: 1rem;
    gap: 0;
  }
  .sub-h1 {
    display: none;
  }
  h1 {
    margin-block: 0;
  }
}

@media (max-width: 550px) {
  h1,
  .title-mod-name {
    margin: 0;
  }
  .title-infos {
    display: block;
    margin-bottom: 0rem;
  }
  .title-mods-scrolled {
    padding-block: 0.5rem;
  }
}
</style>
