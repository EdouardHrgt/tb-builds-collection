<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FollowedUserCard from './FollowedUserCard.vue'
import SectionIcon from './SectionIcon.vue'

// Large window with every followed account in a grid (opened from the title "People I follow").
// Closes with the × button, Esc, or a click on the dark area around it.
//   <FollowingModal v-if="open" :users="following" @close="open = false" @unfollow="unfollow" />
defineProps({
  users: { type: Array, required: true },
})
const emit = defineEmits(['close', 'unfollow'])

const dialog = ref(null)
let previousOverflow = ''

onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden' // the page behind does not scroll
  dialog.value.showModal()
})
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
})

function onBackdropClick(e) {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="list-modal" aria-label="People I follow" @close="emit('close')" @click="onBackdropClick">
    <header class="modal-head">
      <h2 class="with-icon"><SectionIcon name="following" />People I follow</h2>
      <button type="button" class="close" aria-label="Close" title="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>
    <div class="modal-grid">
      <FollowedUserCard v-for="u in users" :key="u.id" :user="u" @unfollow="(name) => emit('unfollow', name)" />
    </div>
  </dialog>
</template>

<style scoped>
.list-modal {
  width: min(1300px, 94vw);
  max-width: none;
  height: min(90vh, 1000px);
  padding: 0 1.5rem 1.5rem;
  overflow-y: auto;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 60px rgb(0 0 0 / 0.7);
}
.list-modal::backdrop {
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(3px);
}
.modal-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0 0.8rem;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
.modal-head h2 {
  margin: 0;
}
.close {
  display: grid;
  place-items: center;
  padding: 0.3rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.close:hover {
  color: var(--accent);
  background: transparent;
}
/* Fixed width shields (the same size as in the carousel); a long name may go beyond one, so the gaps are wide */
.modal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 180px);
  gap: 1.6rem 1.8rem;
  justify-content: center;
  padding-top: 1.8rem;
}
</style>
