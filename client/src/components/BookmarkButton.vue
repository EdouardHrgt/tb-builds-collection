<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'

const props = defineProps({ build: { type: Object, required: true } })
const emit = defineEmits(['changed']) // { bookmarked }

const auth = useAuth()
const route = useRoute()
const router = useRouter()

// Local copy: the icon reacts at once, and follows the parent when it refreshes its data
const bookmarked = ref(!!props.build.bookmarkedByMe)
watch(
  () => props.build.bookmarkedByMe,
  (value) => (bookmarked.value = !!value),
)

const busy = ref(false)
const goToLogin = () => router.push({ path: '/login', query: { redirect: route.fullPath } })

async function toggle() {
  if (!auth.user) return goToLogin()
  if (busy.value) return
  busy.value = true
  try {
    const res = await api(`/builds/${props.build.id}/bookmark`, {
      method: bookmarked.value ? 'DELETE' : 'POST',
    })
    bookmarked.value = res.bookmarked
    emit('changed', res)
  } catch (e) {
    if (e.status === 401) goToLogin() // session expired
  } finally {
    busy.value = false
  }
}

const label = () =>
  !auth.user ? 'Log in to bookmark this build' : bookmarked.value ? 'Remove from your bookmarks' : 'Bookmark this build'
</script>

<template>
  <button
    type="button"
    class="bookmark"
    :class="{ on: bookmarked }"
    :aria-pressed="bookmarked"
    :aria-label="label()"
    :title="label()"
    :disabled="busy"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
        :fill="bookmarked ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.bookmark {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.45rem;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
}
.bookmark:hover {
  color: var(--accent);
  border-color: var(--line);
}
.bookmark.on {
  color: var(--accent);
}
.bookmark:disabled {
  cursor: progress;
}
</style>
