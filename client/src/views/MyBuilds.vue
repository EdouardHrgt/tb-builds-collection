<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import BuildCard from '../components/BuildCard.vue'
import UserAvatar from '../components/UserAvatar.vue'
import { AVATARS, avatarSrc } from '../utils/avatars.js'
import CardCarousel from '../components/CardCarousel.vue'

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
    ;[builds.value, profile.value, bookmarks.value, following.value] = await Promise.all([
      api('/me/builds'),
      api(`/users/${encodeURIComponent(auth.user.username)}`),
      api('/me/bookmarks'),
      api('/me/following').then((res) => res.items),
    ])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const toggleSettings = () => (settingsOpen.value = !settingsOpen.value)
const avatarsOpen = ref(false) // the avatar list is hidden until "Change avatar" is clicked

async function setHideCount(hide) {
  settingError.value = ''
  try {
    const res = await api('/me/settings', { method: 'PATCH', body: { hideFollowers: hide } })
    profile.value.hideFollowers = res.hideFollowers
  } catch (e) {
    settingError.value = e.message
  }
}

// A build leaves the "Bookmarked builds" list as soon as its bookmark is removed
function onBookmarkChanged(build, res) {
  if (!res.bookmarked) bookmarks.value = bookmarks.value.filter((b) => b.id !== build.id)
}

// Unfollow from a card of the carousel: asks first, then the card disappears
const followError = ref('')
async function unfollow(username) {
  if (!confirm(`Unfollow ${username}?`)) return
  followError.value = ''
  try {
    await api(`/users/${encodeURIComponent(username)}/follow`, { method: 'DELETE' })
    following.value = following.value.filter((u) => u.username !== username)
  } catch (e) {
    followError.value = e.message
  }
}

// Avatar picker (in the settings): the choice is saved as soon as an image is clicked
async function setAvatar(id) {
  if (profile.value?.avatar === id) return
  settingError.value = ''
  try {
    const res = await api('/me/settings', { method: 'PATCH', body: { avatar: id } })
    profile.value.avatar = res.avatar
    avatarsOpen.value = false
  } catch (e) {
    settingError.value = e.message
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <section class="align-section">
    <header class="head">
      <div>
        <h1>
          <RouterLink :to="`/u/${auth.user.username}`" title="How others see your profile">{{
            auth.user.username
          }}</RouterLink>
        </h1>
        <p v-if="profile && profile.followerCount !== null" class="meta">
          <span data-test="follower-count">{{ plural(profile.followerCount, 'follower') }}</span>
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
      <h2>Avatar</h2>
      <button
        type="button"
        class="btn change-avatar"
        :aria-expanded="avatarsOpen"
        @click="avatarsOpen = !avatarsOpen"
      >
        {{ avatarsOpen ? 'Close' : 'Change avatar' }}
      </button>
      <div v-if="profile && avatarsOpen" class="avatar-grid" role="radiogroup" aria-label="Avatar">
        <button
          v-for="a in AVATARS"
          :key="a.id"
          type="button"
          role="radio"
          class="avatar-option"
          :class="{ on: profile.avatar === a.id }"
          :aria-checked="profile.avatar === a.id"
          :aria-label="a.id"
          @click="setAvatar(a.id)"
        >
          <UserAvatar :id="a.id" large />
        </button>
      </div>

      <h2>Privacy</h2>
      <label v-if="profile" class="check">
        <input
          type="checkbox"
          :checked="profile.hideFollowers"
          @change="setHideCount($event.target.checked)"
        />
        Hide my follower count on my public profile
      </label>
      <p v-if="settingError" class="error" role="alert">{{ settingError }}</p>
    </div>

    <!-- People I follow: name, number of builds and of followers, unfollow button -->
    <section v-if="!loading && !error && following?.length" class="block" aria-labelledby="following-title">
      <h2 id="following-title" class="list-title">People I follow</h2>
      <CardCarousel label="People I follow" item-width="260px">
        <!-- The avatar is the background of the card (cropped on its top) -->
        <div
          v-for="u in following"
          :key="u.id"
          class="user-card"
          :style="{ '--avatar-url': `url('${avatarSrc(u.avatar)}')` }"
        >
          <!-- Black semi transparent bar over the whole bottom of the card: text on the left, unfollow icon on the right -->
          <div class="user-bar">
            <RouterLink :to="`/u/${u.username}`" class="user-link">
              <strong class="user-name" :title="u.username">{{ u.username }}</strong>
              <span class="meta">{{ plural(u.buildCount, 'build') }}</span>
              <span v-if="u.followerCount !== null" class="meta">{{
                plural(u.followerCount, 'follower')
              }}</span>
            </RouterLink>
            <button
              type="button"
              class="unfollow"
              :aria-label="`Unfollow ${u.username}`"
              :title="`Unfollow ${u.username}`"
              @click="unfollow(u.username)"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 8h5"
                />
              </svg>
            </button>
          </div>
        </div>
      </CardCarousel>
      <p v-if="followError" class="error" role="alert">{{ followError }}</p>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading">Loading…</p>
    <!-- Two lists side by side: my builds (3 columns) and my bookmarks (1 column, on the right) -->
    <div v-else class="lists">
      <section aria-labelledby="builds-title">
        <h2 id="builds-title" class="list-title">My builds</h2>
        <p v-if="!builds.length">
          You don't have any builds yet.
          <RouterLink to="/builds/new">Create your first one</RouterLink>
        </p>
        <div v-else class="cards builds-cards">
          <BuildCard v-for="b in builds" :key="b.id" :build="b" />
        </div>
      </section>

      <section class="bookmarks" aria-labelledby="bookmarks-title">
        <h2 id="bookmarks-title" class="list-title">Bookmarked builds</h2>
        <p v-if="!bookmarks.length" class="meta">
          Nothing here yet. Use the bookmark icon on a build to find it again easily.
        </p>
        <div v-else class="cards bookmark-cards">
          <BuildCard
            v-for="b in bookmarks"
            :key="b.id"
            :build="b"
            @bookmarked="(res) => onBookmarkChanged(b, res)"
          />
        </div>
      </section>
    </div>
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
.head h1 a {
  color: inherit;
  text-decoration: none;
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
.settings h2 {
  letter-spacing: 0.5px;
}
.block {
  margin-bottom: 1.5rem;
}
.user-card {
  position: relative; /* the link of the bar stretches over the whole card (see .user-link::after) */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 9rem;
  overflow: hidden;
  background: var(--panel) var(--avatar-url) center top / cover no-repeat; /* cropped on its top (the face) */
  border: 1px solid var(--line);
  border-radius: 6px;
}
/* Bottom of the card, full width: black semi transparent (lower the last number to see more of the image) */
.user-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  background: rgb(0 0 0 / 0.65);
}
.user-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  color: var(--text);
  text-decoration: none;
}
/* the whole card is clickable: the link stretches over it (the unfollow icon stays above) */
.user-link::after {
  content: '';
  position: absolute;
  inset: 0;
}
.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-card .meta {
  margin: 0;
  color: var(--muted);
}
.unfollow {
  position: relative;
  z-index: 1;
  flex: none;
  display: grid;
  place-items: center;
  padding: 0.2rem;
  color: var(--danger);
  background: transparent;
  border: 0;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.15s, background 0.15s, color 0.15s;
}
/* hover: the icon grows, gets a light red background and a brighter red */
.unfollow:hover,
.unfollow:focus-visible {
  color: #ff6b5e;
  background: rgb(196 86 74 / 0.25);
  transform: scale(1.15);
}
.change-avatar {
  margin-bottom: 0.8rem;
  color: #fff;
  background: transparent;
  border: 1px solid var(--line);
}
.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.avatar-option {
  padding: 0;
  line-height: 0;
  background: none;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.2s;
}
.avatar-option:hover {
  border-color: var(--line);
}
.avatar-option.on {
  border-color: var(--accent);
}
.user-card:hover {
  border-color: var(--accent);
}
.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-card .meta {
  margin: 0;
  color: var(--muted);
}
/* Both list titles share one style (smaller than the page title) */
.list-title {
  margin: 0 0 0.8rem;
}
.lists {
  display: grid;
  gap: 1.5rem 2rem;
  align-items: start;
}
.bookmarks {
  padding-top: 1.5rem;
  border-top: 1px solid var(--line); /* stacked layout: a line above the bookmarks */
}
.cards {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
/* Wide screens: builds on the left (3 columns), bookmarks alone on the right (1 column) */
@media (min-width: 1100px) {
  .lists {
    grid-template-columns: 3fr 1fr;
  }
  .builds-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .bookmark-cards {
    grid-template-columns: minmax(0, 1fr);
  }
  /* side by side: a vertical line between the two lists instead */
  .bookmarks {
    padding-top: 0;
    padding-left: 2rem;
    border-top: 0;
    border-left: 1px solid var(--line);
  }
}
@media (prefers-reduced-motion: reduce) {
  .gear {
    transition: none;
  }
}
</style>
