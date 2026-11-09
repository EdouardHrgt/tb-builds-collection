<script setup>
import { ref } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  username: { type: String, required: true },
  following: { type: Boolean, default: false },
})
const emit = defineEmits(['changed']) // { following, followerCount }

const busy = ref(false)
const error = ref('')
const burst = ref(0) // changes at every action: restarts the animation

async function toggle() {
  if (busy.value) return
  // Unfollowing asks for a confirmation (following does not)
  if (props.following && !confirm(`Unfollow ${props.username}?`)) return
  busy.value = true
  error.value = ''
  try {
    const res = await api(`/users/${encodeURIComponent(props.username)}/follow`, {
      method: props.following ? 'DELETE' : 'POST',
    })
    burst.value++
    emit('changed', res)
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <span class="follow-wrap">
    <button
      type="button"
      class="follow-btn"
      :class="{ on: following }"
      :aria-pressed="following"
      :disabled="busy"
      @click="toggle"
    >
      <!-- keyed: a new element at every action, so the CSS animations play again -->
      <span v-if="burst" :key="burst" class="ring" :class="following ? 'ring-on' : 'ring-off'" aria-hidden="true"></span>
      <span :key="`icon-${burst}`" class="icon" :class="{ pop: burst > 0 }" aria-hidden="true">
        <svg v-if="following" viewBox="0 0 24 24" width="18" height="18">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
        </svg>
      </span>
      <span class="label">
        <template v-if="following">
          <span class="when-idle">Following</span>
          <span class="when-hover">Unfollow</span>
        </template>
        <template v-else>Follow</template>
      </span>
    </button>
    <span v-if="error" class="error" role="alert">{{ error }}</span>
  </span>
</template>

<style scoped>
.follow-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}
.follow-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1.1rem;
  font: inherit;
  font-weight: 600;
  color: #1a1405;
  background: var(--accent);
  border: 2px solid var(--accent);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.25s, color 0.25s, transform 0.15s;
}
.follow-btn:active {
  transform: scale(0.95);
}
.follow-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
/* Following: outlined button; the hover turns it red to announce the unfollow */
.follow-btn.on {
  color: var(--accent);
  background: transparent;
}
.follow-btn.on:hover:not(:disabled) {
  color: #ff6b5e;
  border-color: #ff6b5e;
}
.when-hover {
  display: none;
}
.follow-btn.on:hover .when-idle {
  display: none;
}
.follow-btn.on:hover .when-hover {
  display: inline;
}

.icon {
  display: inline-flex;
}
.icon.pop {
  animation: pop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1);
}
@keyframes pop {
  0% {
    transform: scale(0) rotate(-40deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}

/* A ring expands from the button when the action succeeds */
.ring {
  position: absolute;
  inset: -2px;
  border-radius: 999px;
  border: 2px solid var(--accent);
  pointer-events: none;
  animation: ring 0.6s ease-out forwards;
}
.ring-off {
  border-color: #ff6b5e;
}
@keyframes ring {
  from {
    opacity: 0.9;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.5, 1.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon.pop,
  .ring {
    animation: none;
  }
  .ring {
    display: none;
  }
}
</style>
