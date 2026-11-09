<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'

const props = defineProps({ build: { type: Object, required: true } })
const emit = defineEmits(['changed'])

const auth = useAuth()
const route = useRoute()
const router = useRouter()

// Local copy: the star reacts at once, and follows the parent when it refreshes its data
const liked = ref(props.build.likedByMe)
const count = ref(props.build.likeCount)
watch(
  () => [props.build.likedByMe, props.build.likeCount],
  ([isLiked, total]) => {
    liked.value = isLiked
    count.value = total
  },
)

const busy = ref(false)
const isOwn = computed(() => auth.user?.id === props.build.authorId)
const label = computed(() => {
  if (isOwn.value) return "You can't like your own build"
  if (!auth.user) return 'Log in to like this build'
  return liked.value ? 'Remove your like' : 'Like this build'
})

const goToLogin = () => router.push({ path: '/login', query: { redirect: route.fullPath } })

async function toggle() {
  if (!auth.user) return goToLogin()
  if (isOwn.value || busy.value) return
  busy.value = true
  try {
    const res = await api(`/builds/${props.build.id}/like`, {
      method: liked.value ? 'DELETE' : 'POST',
    })
    liked.value = res.liked
    count.value = res.likeCount
    emit('changed', res)
  } catch (e) {
    if (e.status === 401) goToLogin() // session expired
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="like"
    :class="{ liked }"
    :aria-pressed="liked"
    :aria-disabled="isOwn"
    :aria-label="`${label} (${count} like${count === 1 ? '' : 's'})`"
    :title="label"
    :disabled="busy"
    @click="toggle">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        :fill="liked ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round" />
    </svg>
    <span class="count">{{ count }}</span>
  </button>
</template>

<style scoped>
.like {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  font: inherit;
  font-size: 0.9rem;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
}
.like:hover:not([aria-disabled='true']) {
  color: var(--accent);
  border-color: var(--line);
}
.like.liked {
  color: var(--accent);
}
.like[aria-disabled='true'] {
  cursor: default;
  opacity: 0.7;
}
.like:disabled {
  cursor: progress;
}
</style>
