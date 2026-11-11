<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import BuildCard from '../components/BuildCard.vue'
import UserAvatar from '../components/UserAvatar.vue'
import { AVATARS, avatarSrc } from '../utils/avatars.js'
import CardCarousel from '../components/CardCarousel.vue'
import SectionIcon from '../components/SectionIcon.vue'
import FollowedUserCard from '../components/FollowedUserCard.vue'
import FollowingModal from '../components/FollowingModal.vue'
import { SHIELD } from '../utils/shield.js'
import AccountSettings from '../components/AccountSettings.vue'
import { BALANCE } from '../utils/balance.js'

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

// Builds saved for an older Tourney Balance version: listed in a notice, so their owner can check them
const outdated = computed(() => builds.value.filter((b) => b.data?.balance && b.data.balance !== BALANCE.version))
const onlyOutdated = ref(false)
const shownBuilds = computed(() => (onlyOutdated.value && outdated.value.length ? outdated.value : builds.value))

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
const followingOpen = ref(false) // the big window with every followed account
async function unfollow(username) {
  if (!confirm(`Unfollow ${username}?`)) return
  followError.value = ''
  try {
    await api(`/users/${encodeURIComponent(username)}/follow`, { method: 'DELETE' })
    following.value = following.value.filter((u) => u.username !== username)
    if (!following.value.length) followingOpen.value = false
  } catch (e) {
    followError.value = e.message
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

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
      <!-- My current avatar, with the button that opens the list (it also shows that the change worked) -->
      <div class="avatar-current">
        <UserAvatar v-if="profile" :id="profile.avatar" large />
        <button
          type="button"
          class="btn change-avatar"
          :aria-expanded="avatarsOpen"
          @click="avatarsOpen = !avatarsOpen"
        >
          {{ avatarsOpen ? 'Close' : 'Change avatar' }}
        </button>
      </div>
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

      <h2>Account</h2>
      <AccountSettings />

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
      <h2 id="following-title" class="list-title with-icon">
        <SectionIcon name="following" />
        <button type="button" class="title-btn" title="See all: People I follow" @click="followingOpen = true">
          People I follow<span class="chev" aria-hidden="true">›</span>
        </button>
      </h2>
      <!-- Shared by every shield (referenced by id): the shape that crops the avatar, and the dark fade under the text.
           Same path as the outline drawn in each card. -->
      <svg class="shield-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="shield-clip"><path :d="SHIELD" /></clipPath>
          <linearGradient id="shield-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.3" stop-color="#000" stop-opacity="0" />
            <stop offset="0.7" stop-color="#000" stop-opacity="0.85" />
          </linearGradient>
        </defs>
      </svg>
      <CardCarousel label="People I follow" item-width="180px">
        <FollowedUserCard v-for="u in following" :key="u.id" :user="u" @unfollow="unfollow" />
      </CardCarousel>
      <p v-if="followError" class="error" role="alert">{{ followError }}</p>
    </section>

    <FollowingModal
      v-if="followingOpen && following?.length"
      :users="following"
      @close="followingOpen = false"
      @unfollow="unfollow" />

    <div v-if="!loading && !error && following?.length" class="ornament" aria-hidden="true">◆</div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading">Loading…</p>
    <!-- Two lists side by side: my builds (3 columns) and my bookmarks (1 column, on the right) -->
    <div v-else class="lists">
      <section aria-labelledby="builds-title">
        <h2 id="builds-title" class="list-title with-icon"><SectionIcon name="mine" />My builds</h2>
        <p v-if="!builds.length">
          You don't have any builds yet.
          <RouterLink to="/builds/new">Create your first one</RouterLink>
        </p>
        <template v-else>
          <p v-if="outdated.length" class="notice">
            {{ plural(outdated.length, 'build') }} made for an older {{ BALANCE.name }} version (the current one is
            {{ BALANCE.version }}). Check the talents, weapons and traits, then open Edit and Save to update them.
            <button type="button" class="link-btn" @click="onlyOutdated = !onlyOutdated">
              {{ onlyOutdated ? 'Show all my builds' : 'Show only these' }}
            </button>
          </p>
          <div class="cards builds-cards">
            <BuildCard v-for="b in shownBuilds" :key="b.id" :build="b" />
          </div>
        </template>
      </section>

      <section class="bookmarks" aria-labelledby="bookmarks-title">
        <h2 id="bookmarks-title" class="list-title with-icon"><SectionIcon name="bookmarks" />Bookmarked builds</h2>
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
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  color: var(--accent);
  background: var(--panel);
  border: 2px solid var(--accent); /* always visible: it is the only way to reach the settings */
  border-radius: 50%;
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 35%, transparent);
  transition: transform 0.4s, background 0.3s, box-shadow 0.3s;
}
.gear svg {
  width: 28px;
  height: 28px;
}
.gear:hover,
.gear.open {
  background: color-mix(in srgb, var(--accent) 18%, var(--panel));
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent);
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
/* The title of the list is a button: click = the window with everyone (same look as SectionTitle) */
.title-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.15s;
}
.title-btn:hover {
  color: var(--accent);
  background: transparent;
}
.chev {
  color: var(--accent);
  transition: transform 0.15s;
}
.title-btn:hover .chev {
  transform: translateX(4px);
}
/* The shield cards themselves are styled in FollowedUserCard.vue */
.shield-defs {
  position: absolute;
}
.avatar-current {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.change-avatar {
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
.notice {
  margin: 0 0 0.9rem;
  padding: 0.6rem 0.8rem;
  color: var(--muted);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.notice .link-btn {
  padding: 0;
  font: inherit;
  color: var(--accent);
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
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
