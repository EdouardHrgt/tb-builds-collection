<template>
  <article :style="{ '--article-index': index }" class="blur-box article-animate">
    <div class="article-img-wrapper">
      <img :src="career.icon" :alt="'picture of ' + career.name" />
      <!-- <button v-if="modName === 'tourney balance'" @click="openModal">See Meta Build</button> -->
    </div>
    <div class="content">
      <h3 v-if="career.untouched" class="untouched">/.\ No changes made /.\</h3>

      <div class="passives" v-if="career.passives?.length">
        <h2>Passives:</h2>
        <ul class="passives-ul">
          <li v-for="passive in career.passives" :key="passive">{{ passive }}</li>
        </ul>
      </div>

      <div class="talents" v-if="career.talents?.length">
        <h2>Talents:</h2>
        <ul v-for="talent in career.talents" :key="talent" class="talents-ul">
          <li>
            <h4>Level {{ talent.level }}: {{ talent.name }}</h4>
            <ul class="sub-talent-ul">
              <li v-for="change in talent.changes" :key="change">{{ change }}</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal Meta Build -->
    <!-- <Teleport to=".vt2cl" defer>
      <Transition name="modal">
        <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeModal">
              <span>&times;</span>
            </button>
            <div v-if="metaBuild" class="modal-body">
              <div class="modal-header">
                <h2 class="modal-title">{{ career.name }}</h2>
                <strong>{{ metaBuild.title || modName }}</strong>
              </div>
            </div>
            <div v-else class="modal-body">
              <p class="modal-empty">Aucun build meta trouvé pour cette carrière.</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport> -->
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
// import metaBuilds from '~/assets/data/metaBuilds.json'

const props = defineProps({
  career: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  modName: {
    type: String,
    required: false,
  },
})

// const isModalOpen = ref(false)

// const metaBuild = computed(() => {
//   return metaBuilds?.[props.modName]?.[props.career.name] ?? null
// })

// const openModal = () => {
//   isModalOpen.value = true
//   document.body.style.overflow = 'hidden'
// }

// const closeModal = () => {
//   isModalOpen.value = false
//   document.body.style.overflow = ''
// }
</script>

<style scoped>
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.article-animate {
  animation: slideInUp 1s ease-out forwards;
  animation-delay: calc(var(--article-index) * 0.1s);
  opacity: 0;
}

article {
  display: flex;
  align-items: start;
  gap: 2rem;
  position: relative;
  max-width: 1440px;
  width: 100%;
  margin-inline: auto;
}

/* The portrait keeps its size (154px): without this the flex row squeezed it when the text next to it was long */
.article-img-wrapper {
  flex: 0 0 154px;
}

.article-img-wrapper button {
  padding: 0.55rem;
  background-color: var(--grey-400);
  color: var(--black-900);
  border: none;
  border-radius: 6px;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-5);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-inline: auto;
  display: block;
  margin-top: 1rem;
}

h2 {
  font-family: 'Quintessential', serif;
  letter-spacing: 1px;
  text-decoration: underline;
  font-size: var(--fs-2);
}

h4 {
  color: var(--yellow-400);
  margin-top: 0.7rem;
  font-size: var(--fs-3);
  list-style: none;
}

li {
  overflow-wrap: break-word;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
}

.passives li {
  list-style: disc;
  margin-left: 1.35rem;
  color: var(--grey-400);
  margin-bottom: 0.3rem;
}

.talents {
  margin-top: 1.7rem;
}

.sub-talent-ul li {
  color: var(--grey-400);
  list-style: disc;
  margin-left: 1.35rem;
}

.untouched {
  text-transform: uppercase;
  font-family: 'Rubik Marker Hatch', system-ui;
  letter-spacing: 1px;
  display: block;
  position: absolute;
  top: 6rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* --- Modal Styles (repris de WeaponsCarousel) --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgb(24 26 32 / 0.88);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, rgb(34 37 46 / 0.97) 0%, rgb(24 26 32 / 0.97) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.modal-close span {
  color: var(--white-100);
  font-size: 32px;
  line-height: 1;
}

@media (hover: hover) {
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.modal-header {
  border-bottom: 2px solid var(--yellow-400);
  padding-bottom: 1rem;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  justify-content: space-between;
}

.modal-header strong {
  font-size: var(--fs-body);
  text-transform: uppercase;
  font-family: 'Rubik Marker Hatch', system-ui;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 1px;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-title {
  font-family: 'Quintessential', serif;
  font-size: var(--fs-1);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--white-900);
  margin: 0;
}

.modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.modal-list li {
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1.5rem;
  line-height: 1.8;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
  overflow-wrap: break-word;
}

.modal-list li::before {
  content: '▸';
  position: absolute;
  left: 0;
  font-size: 20px;
}

.modal-list li:nth-child(odd) {
  color: var(--grey-400);
}

.modal-list li:nth-child(odd)::before {
  color: var(--grey-400);
}

.modal-list li:nth-child(even) {
  color: var(--yellow-400);
}

.modal-list li:nth-child(even)::before {
  color: var(--yellow-400);
}

.modal-empty {
  font-family: 'Lexend Deca', sans-serif;
  color: var(--grey-400);
  text-align: center;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

@media (hover: hover) {
  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

@media (max-width: 750px) {
  article {
    display: block;
  }
  article img {
    width: 8rem;
    margin-inline: auto;
  }
  .talents {
    margin-top: 1rem;
  }
  .passives li,
  .sub-talent-ul li {
    margin-left: 1.5rem;
  }
  .untouched {
    display: block;
    position: relative;
    top: auto;
    text-align: center;
    margin-top: 1rem;
  }
  .modal-content {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  .modal-header {
    display: block;
  }
  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
    width: 25px;
    height: 25px;
  }
  .modal-close span {
    font-size: 20px;
  }
}

@media (max-width: 450px) {
  .modal-content {
    padding: 2rem 0.5rem;
  }
  .modal-title,
  .modal-header strong {
    font-size: 15px;
  }
  .modal-list li {
    padding-left: 1.3rem;
    font-size: 14px;
  }
}
</style>
