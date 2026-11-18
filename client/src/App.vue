<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'
import { useFeed } from './stores/feed.js'
import { useNotifications } from './stores/notifications.js'
import FooterCard from './components/FooterCard.vue'
import NavBell from './components/NavBell.vue'
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

// Mobile menu: a drawer that slides in from the right (the links stay in the same <nav>, the CSS turns it into a
// drawer below 900px). It closes on navigation, on Escape, on a click outside and when the window gets wide.
const menuOpen = ref(false)
const MOBILE_MAX = 900
const onKey = (e) => e.key === 'Escape' && (menuOpen.value = false)
const onResize = () => window.innerWidth > MOBILE_MAX && (menuOpen.value = false)
watch(() => route.fullPath, () => (menuOpen.value = false))
watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '' // the page behind does not scroll while the menu is open
})
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  document.body.style.overflow = ''
})

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const commentsLabel = () => `${plural(notif.total, 'unread comment')}`
const buildsLabel = () => `${plural(feed.count, 'new build')} from people you follow`
// The bell of the new builds leads to the "From people I follow" section of the Builds page
const buildsTarget = { path: '/', hash: '#followed' }

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
    <!-- Phones: the bells stay in the bar (the menu is closed most of the time), next to the menu button -->
    <div v-if="auth.user && (notif.total || feed.count)" class="bar-bells">
      <NavBell v-if="feed.count" :to="buildsTarget" :label="buildsLabel()" />
      <NavBell v-if="notif.total" :to="notif.target" :label="commentsLabel()" />
    </div>
    <button
      class="burger"
      type="button"
      aria-label="Open menu"
      aria-controls="main-nav"
      :aria-expanded="menuOpen"
      @click="menuOpen = true">
      <span></span><span></span><span></span>
    </button>
    <nav id="main-nav" :class="{ open: menuOpen }">
      <button class="drawer-close" type="button" aria-label="Close menu" @click="menuOpen = false">✕</button>
      <!-- Stays highlighted on every page of the Changelogs section (/changelogs/<hero>) -->
      <RouterLink to="/changelogs" :class="{ 'router-link-exact-active': route.path.startsWith('/changelogs') }" title="Balance mods changelogs: what each mod changes">Balance Changelogs</RouterLink>
      <RouterLink to="/difficulties" title="What the difficulty mods change (Cataclysm 3, Deathwish, Onslaught...)">Difficulty Mods</RouterLink>
      <span class="nav-sep" aria-hidden="true">|</span>
      <span class="nav-item">
        <RouterLink to="/">Builds</RouterLink>
        <NavBell v-if="auth.user && feed.count" class="nav-bell" :to="buildsTarget" :label="buildsLabel()" />
      </span>
      <template v-if="auth.user">
        <RouterLink to="/builds/new">New build</RouterLink>
        <span class="nav-item">
          <RouterLink to="/me" class="who">{{ auth.user.username }}</RouterLink>
          <NavBell v-if="notif.total" class="nav-bell" :to="notif.target" :label="commentsLabel()" />
        </span>
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
          <span class="logout-label">Log out</span>
        </button>
      </template>
      <template v-else>
        <RouterLink to="/login">Log in</RouterLink>
        <RouterLink to="/register">Sign up</RouterLink>
      </template>
    </nav>
    <div class="backdrop" :class="{ open: menuOpen }" aria-hidden="true" @click="menuOpen = false"></div>
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
/* A little less space between the links: with the two bells the menu would no longer fit next to the logo
   on a 1280px screen */
.top {
  column-gap: 1rem;
}
.top nav {
  column-gap: 0.85rem;
}
/* A link and its bell, side by side (also in the menu drawer of the phones) */
.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}
/* The bells of the bar: phones only */
.bar-bells {
  display: none;
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
/* The tag always stays next to the logo: the width of the menu changes (links, user name), so a tag centered
   in the header ended up touching the links on some screen widths. */
/* Desktop: the menu button, the close button, the backdrop and the "Log out" word do not exist */
.burger,
.drawer-close,
.backdrop,
.logout-label {
  display: none;
}
/* Phones and small tablets: the logo and the balance tag on the left, a menu button on the right. The links
   move into a drawer that slides in from the right, over a dark backdrop. */
@media (max-width: 900px) {
  .top {
    flex-wrap: nowrap;
    justify-content: space-between;
    padding-block: 0.7rem;
  }
  .brand-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    min-width: 0;
    margin-right: auto;
  }
  .bar-bells {
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.1rem;
    margin-right: 0.4rem;
  }
  /* The bells are already in the bar: the drawer does not repeat them */
  .nav-bell {
    display: none;
  }
  .balance-tag {
    font-size: 0.68rem;
  }
  /* A smaller logo: it stays on one line next to the bells and the menu button, even on a 360px phone */
  .top #main__logo {
    font-size: min(1.5rem, 5.6vw);
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .top .burger {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
    background: none;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .burger span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--text);
    border-radius: 2px;
  }
  .burger:hover {
    border-color: var(--accent);
  }
  .burger:hover span {
    background: var(--accent);
  }
  .top nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    width: min(20rem, 85vw);
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 0.35rem;
    padding: 1rem 1.5rem 2rem;
    overflow-y: auto;
    background: var(--panel);
    border-left: 1px solid var(--line);
    box-shadow: -8px 0 24px rgb(0 0 0 / 0.5);
    transform: translateX(100%);
    visibility: hidden; /* closed: out of the tab order and of screen readers */
    transition:
      transform 0.3s ease,
      visibility 0s linear 0.3s;
  }
  .top nav.open {
    transform: none;
    visibility: visible;
    transition:
      transform 0.3s ease,
      visibility 0s;
  }
  .top nav a,
  .top nav button.link {
    align-self: flex-start;
    padding-block: 0.55rem;
    font-size: 1.3rem;
  }
  .top nav a.who {
    margin-block: 0.3rem;
    font-size: 1.2rem;
  }
  /* The "|" between the site links and the builds links becomes a thin divider */
  .nav-sep {
    display: block;
    width: 100%;
    height: 1px;
    margin-block: 0.5rem;
    overflow: hidden;
    font-size: 0;
    background: var(--line);
    opacity: 1;
  }
  .top nav button.logout {
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .logout-label {
    display: inline;
  }
  .top nav .drawer-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-end;
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
    padding: 0;
    font-size: 1.3rem;
    line-height: 1;
    color: var(--text);
    background: none;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .top nav .drawer-close:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 15;
    background: rgb(0 0 0 / 0.55);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .top nav,
  .backdrop {
    transition: none !important;
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
