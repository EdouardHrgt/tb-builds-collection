<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import BuildCard from '../components/BuildCard.vue'
import FollowButton from '../components/FollowButton.vue'

const auth = useAuth()

const builds = ref([])
const bookmarks = ref([]) // my favorites (private)
const profile = ref(null) // follower count + privacy setting
const following = ref(null) // people I follow (private); null = not loaded yet
const loading = ref(true)
const error = ref('')

const settingsOpen = ref(false)
const settingError = ref('')

onMounted(async () => {
  try {
    ;[builds.value, profile.value, bookmarks.value] = await Promise.all([
      api('/me/builds'),
      api(`/users/${encodeURIComponent(auth.user.username)}`),
      api('/me/bookmarks'),
    ])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// The list of followed people is only fetched the first time the settings are opened
async function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  if (!settingsOpen.value || following.value !== null) return
  try {
    following.value = (await api('/me/following')).items
  } catch (e) {
    settingError.value = e.message
    following.value = []
  }
}

async function setShowCount(show) {
  settingError.value = ''
  try {
    const res = await api('/me/settings', { method: 'PATCH', body: { hideFollowers: !show } })
    profile.value.hideFollowers = res.hideFollowers
  } catch (e) {
    settingError.value = e.message
  }
}

// A build leaves the "Bookmarked builds" list as soon as its bookmark is removed
function onBookmarkChanged(build, res) {
  if (!res.bookmarked) bookmarks.value = bookmarks.value.filter((b) => b.id !== build.id)
}

// On this list a person disappears once unfollowed
function onUnfollowed(username) {
  following.value = following.value.filter((u) => u.username !== username)
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <section class="align-section">
    <header class="head">
      <div>
        <h1>My builds</h1>
        <p v-if="profile && profile.followerCount !== null" class="meta">
          <RouterLink :to="`/u/${profile.username}`" title="How others see your profile">{{
            profile.username
          }}</RouterLink>
          · <span data-test="follower-count">{{ plural(profile.followerCount, 'follower') }}</span>
          <span v-if="profile.hideFollowers"> (only visible to you)</span>
        </p>
      </div>

      <button
        type="button"
        class="gear"
        :class="{ open: settingsOpen }"
        :aria-expanded="settingsOpen"
        aria-controls="settings-panel"
        aria-label="Settings"
        title="Settings"
        @click="toggleSettings"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        </svg>
      </button>
    </header>

    <!-- Settings: only for the account owner -->
    <div v-if="settingsOpen" id="settings-panel" class="settings">
      <h2>Privacy</h2>
      <label v-if="profile" class="check">
        <input
          type="checkbox"
          :checked="!profile.hideFollowers"
          @change="setShowCount($event.target.checked)"
        />
        Show my follower count on my public profile
      </label>
      <p v-if="settingError" class="error" role="alert">{{ settingError }}</p>

      <h2>People I follow <span class="meta">(only visible to you)</span></h2>
      <p v-if="following === null" class="meta">Loading…</p>
      <p v-else-if="!following.length" class="meta">
        You don't follow anyone yet. Open the profile of a build author to follow them.
      </p>
      <ul v-else class="following">
        <li v-for="u in following" :key="u.id">
          <RouterLink :to="`/u/${u.username}`">{{ u.username }}</RouterLink>
          <span class="meta">{{ plural(u.buildCount, 'build') }}</span>
          <FollowButton :username="u.username" following @changed="onUnfollowed(u.username)" />
        </li>
      </ul>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading">Loading…</p>
    <p v-else-if="!builds.length">
      You don't have any builds yet. <RouterLink to="/builds/new">Create your first one</RouterLink>
    </p>
    <div v-else class="grid">
      <BuildCard v-for="b in builds" :key="b.id" :build="b" />
    </div>

    <section v-if="!loading && !error" aria-labelledby="bookmarks-title">
      <h2 id="bookmarks-title">Bookmarked builds <span class="meta">(only visible to you)</span></h2>
      <p v-if="!bookmarks.length" class="meta">
        Nothing here yet. Use the bookmark icon on a build to find it again easily.
      </p>
      <div v-else class="grid">
        <BuildCard
          v-for="b in bookmarks"
          :key="b.id"
          :build="b"
          @bookmarked="(res) => onBookmarkChanged(b, res)"
        />
      </div>
    </section>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.head h1 {
  margin-bottom: 0.3rem;
}
.head .meta {
  margin: 0 0 1rem;
}
.gear {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 50%;
  transition: transform 0.4s, border-color 0.3s;
}
.gear:hover,
.gear.open {
  border-color: var(--accent);
}
.gear.open {
  transform: rotate(60deg);
}
.settings {
  margin-bottom: 1.5rem;
  padding: 0.2rem 1.2rem 1.2rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.following {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.following li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
}
.following li > a {
  font-weight: 600;
}
.following li > .meta {
  flex: 1;
  margin: 0;
}
@media (prefers-reduced-motion: reduce) {
  .gear {
    transition: none;
  }
}
</style>
