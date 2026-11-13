<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { parseDbDate } from '../utils/time.js'
import BuildCard from '../components/BuildCard.vue'
import FollowButton from '../components/FollowButton.vue'
import UserAvatar from '../components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const profile = ref(null)
const loading = ref(true)
const error = ref('')

// `silent` = refresh in place (after a like) without the "Loading…" flash
async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const data = await api(`/users/${encodeURIComponent(route.params.username)}`)
    // My own profile is the /me page (builds + settings): no second page for the same thing
    if (data.isSelf) return router.replace('/me')
    profile.value = data
  } catch (e) {
    profile.value = null
    error.value = e.message
  } finally {
    loading.value = false
  }
}
const refresh = () => load({ silent: true })
watch(() => route.params.username, () => load(), { immediate: true })

function onFollowChanged(res) {
  profile.value.isFollowing = res.following
  profile.value.followerCount = res.followerCount
}

const memberSince = (s) =>
  parseDbDate(s).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="loading">Loading…</p>
  <template v-else-if="profile">
    <header class="profile-head">
      <div class="profile-who">
        <!-- the portrait sits in the hole of the frame, which is drawn over it -->
        <span class="framed">
          <UserAvatar :id="profile.avatar" />
          <img src="/shared/frame.png" alt="" class="frame" width="119" height="137" />
        </span>
        <div>
        <h1>{{ profile.username }}</h1>
        <p class="meta">
          Member since {{ memberSince(profile.createdAt) }}
          <br />
          {{ plural(profile.builds.length, 'build') }}
          <!-- followerCount is null when its owner chose to hide it -->
          <template v-if="profile.followerCount !== null">
            · <span data-test="follower-count">{{ plural(profile.followerCount, 'follower') }}</span>
          </template>
        </p>
        </div>
      </div>

      <FollowButton
        v-if="auth.user"
        :username="profile.username"
        :following="profile.isFollowing"
        @changed="onFollowChanged"
      />
      <p v-else class="meta">
        <RouterLink :to="{ path: '/login', query: { redirect: route.fullPath } }">Log in</RouterLink> to follow
        {{ profile.username }}.
      </p>
    </header>

    <section aria-labelledby="builds-title">
      <h2 id="builds-title">Builds</h2>
      <p v-if="!profile.builds.length" class="meta">{{ profile.username }} has not published any build yet.</p>
      <div v-else class="grid">
        <BuildCard v-for="b in profile.builds" :key="b.id" :build="b" @liked="refresh" />
      </div>
    </section>
  </template>
</template>

<style scoped>
.profile-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.profile-who {
  display: flex;
  align-items: center;
  gap: 1rem;
}
/* frame.png is 119x137 px and its hole is a circle of about 72 px centred at (54.5, 69.5): the portrait is
   centred on that point and a little wider than the hole, so its edge hides under the ring */
.framed {
  --frame-w: 140px;
  --avatar-size: calc(var(--frame-w) * 0.622);
  position: relative;
  flex: none;
  width: var(--frame-w);
  aspect-ratio: 119 / 137;
}
.framed :deep(.avatar) {
  position: absolute;
  left: 45.8%;
  top: 50.7%;
  transform: translate(-50%, -50%);
}
.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
/* Phone: everything in one centred column, with a smaller frame */
@media (max-width: 600px) {
  .profile-head {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .profile-who {
    flex-direction: column;
    gap: 0.4rem;
  }
  .framed {
    --frame-w: 100px;
  }
}
.profile-head h1 {
  margin: 0 0 0.3rem;
  overflow-wrap: anywhere;
}
.profile-head .meta {
  margin: 0;
}
</style>
