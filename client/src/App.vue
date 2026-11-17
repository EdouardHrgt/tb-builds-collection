<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'
import { useFeed } from './stores/feed.js'
import { useNotifications } from './stores/notifications.js'
import FooterCard from './components/FooterCard.vue'
import { BALANCE } from './utils/balance.js'

const auth = useAuth()
const router = useRouter()
const route = useRoute()
const feed = useFeed()
const notif = useNotifications()

// The counters of new builds from followed people and of unread comments are refreshed at each page change
// (and cleared on logout)
watch(
  () => [route.path, auth.user?.id],
  () => {
    if (auth.user) {
      feed.refresh()
      notif.refresh()
    } else {
      feed.reset()
      notif.reset()
    }
  },
  { immediate: true },
)

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="top">
    <div class="brand-row">
      <!-- The logo leads to the home page -->
      <RouterLink to="/" class="brand-block" aria-label="Sigmar's Arsenal, home page">
        <strong id="main__logo">Sigmar's Arsenal</strong>
        <div class="ornament" aria-hidden="true">◆</div>
      </RouterLink>
      <!-- Tells visitors which balance the builds are based on (the Tourney Balance mod, not the official game) -->
      <a
        class="balance-tag"
        :href="BALANCE.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="`Builds are based on the ${BALANCE.name} mod ${BALANCE.version}, not on the official game balance`">
        Made for {{ BALANCE.name }} {{ BALANCE.version }}
      </a>
    </div>
    <nav>
      <!-- Stays highlighted on every page of the Changelogs section (/changelogs/<hero>) -->
      <RouterLink to="/changelogs" :class="{ 'router-link-exact-active': route.meta.wide }" title="Balance mods changelogs: what each mod changes">Balance Changelogs</RouterLink>
      <span class="nav-sep" aria-hidden="true">|</span>
      <RouterLink to="/"
        >Builds<span
          v-if="auth.user && feed.count"
          class="new-count"
          :title="`${feed.count} new build${feed.count === 1 ? '' : 's'} from people you follow`"
          >{{ feed.count > 9 ? '9+' : feed.count }}</span
        ></RouterLink
      >
      <template v-if="auth.user">
        <RouterLink to="/builds/new">New build</RouterLink>
        <RouterLink to="/me" class="who"
          >{{ auth.user.username
          }}<span
            v-if="notif.total"
            class="new-count"
            :title="`${notif.total} unread comment${notif.total === 1 ? '' : 's'}`"
            >{{ notif.total > 9 ? '9+' : notif.total }}</span
          ></RouterLink
        >
        <button class="link logout" title="Log out" aria-label="Log out" @click="logout">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </template>
      <template v-else>
        <RouterLink to="/login">Log in</RouterLink>
        <RouterLink to="/register">Sign up</RouterLink>
      </template>
    </nav>
  </header>
  <main :class="{ wide: route.meta.wide }"
    ><RouterView :key="route.meta.wide ? 'wide' : $route.path + ($route.query.from ?? '')"
  /></main>
  <!-- Pages with their own look (Changelogs) have their own footer -->
  <FooterCard :flush="route.meta.wide" />
</template>

<style scoped>
/* "Log out" is an icon, always red */
.top nav button.logout {
  display: inline-flex;
  align-items: center;
  color: var(--danger);
}
.top nav button.logout:hover {
  color: color-mix(in srgb, var(--danger) 75%, white);
}
/* Counters (new builds from followed people on the Builds link, unread comments on the profile link) */
.new-count {
  display: inline-grid;
  place-items: center;
  min-width: 1.1rem;
  height: 1.1rem;
  margin-left: 0.35rem;
  padding: 0 0.3rem;
  font-family: Verdana, Geneva, Tahoma, sans-serif; /* the text font of the site: the digit stays readable */
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  color: #1a1a1a;
  background: var(--flashy); /* it stands out on the dark header */
  border-radius: 999px;
  vertical-align: middle;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
/* Small tag next to the logo: "Made for Tourney Balance V28.2" */
.balance-tag {
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--muted);
  text-decoration: none;
}
.balance-tag:hover {
  color: var(--accent);
  border-color: var(--accent);
  opacity: 1;
}
/* Wide screens: the tag sits in the middle of the header (the header is the positioned parent).
   Below 1400px there is no room (the logged-in menu is wide): it stays next to the logo. */
@media (min-width: 1400px) {
  .balance-tag {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
@media (max-width: 600px) {
  /* Phones: everything is centered, one line each: the logo, the balance tag under it, then the links */
  .top {
    justify-content: center;
  }
  .brand-row {
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }
  nav {
    justify-content: center;
    width: 100%;
  }
}
/* The logo with the golden ornament line (global .ornament) under it, as wide as the logo */
.nav-sep {
  color: var(--muted, #8a8a8a);
  opacity: 0.6;
  user-select: none;
}
.brand-block {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}
.brand-block:hover {
  opacity: 1;
  filter: brightness(1.25);
}
.brand-block .ornament {
  margin: 0.1rem 0 0;
  font-size: 0.6rem;
}
#main__logo {
  padding: 0;
  font-size: 1.8rem;
  letter-spacing: 0.5px;
  font-family: 'New Rocker', system-ui;
  letter-spacing: 1.7px;
  background: linear-gradient(
    90deg,
    #86553f 0%,
    #dcac5c 21%,
    #f6e27a 45%,
    #f6f2c0 50%,
    #f6e27a 55%,
    #dcac5c 79%,
    #86553f 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
