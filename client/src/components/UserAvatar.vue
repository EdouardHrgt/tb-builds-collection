<script setup>
import { computed } from 'vue'
import { avatarSrc } from '../utils/avatars.js'

// Round profile picture. Sizes come from CSS variables (style.css):
//   --avatar-size      normal size (cards, comments, build page)
//   --avatar-size-lg   `large` size (public profile, avatar picker)
// A variable can also be overridden on any parent element to change the size in one place only.
const props = defineProps({
  id: { type: String, default: '' }, // avatar id sent by the API
  large: { type: Boolean, default: false },
})
const src = computed(() => avatarSrc(props.id))
</script>

<template>
  <!-- alt is empty on purpose: the username is always written next to the picture -->
  <img :src="src" alt="" class="avatar" :class="{ large }" loading="lazy" decoding="async" />
</template>

<style scoped>
.avatar {
  flex: none;
  display: block;
  width: var(--avatar-size, 44px);
  height: var(--avatar-size, 44px);
  border-radius: 50%;
  object-fit: cover;
  object-position: center top; /* the images are not always square: keep the top (the face) in the middle */
  background: var(--panel);
}
.avatar.large {
  width: var(--avatar-size-lg, 88px);
  height: var(--avatar-size-lg, 88px);
}
</style>
