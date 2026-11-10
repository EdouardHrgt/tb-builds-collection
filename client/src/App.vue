<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'
import FooterCard from './components/FooterCard.vue'
import { BALANCE } from './utils/balance.js'

const auth = useAuth()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="top">
    <div class="brand-row">
      <div class="brand-block">
        <strong id="main__logo">Sigmar's Arsenal</strong>
        <div class="ornament" aria-hidden="true">◆</div>
      </div>
      <!-- Tells visitors which balance the builds are based on (the Tourney Balance mod, not the official game) -->
      <a
        class="balance-tag"
        :href="BALANCE.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="`Builds are based on the ${BALANCE.name} mod ${BALANCE.version}, not on the official game balance`">
        <span class="long">{{ BALANCE.name }}</span
        ><span class="short">{{ BALANCE.short }}</span> {{ BALANCE.version }}
      </a>
    </div>
    <nav>
      <RouterLink to="/">Builds</RouterLink>
      <template v-if="auth.user">
        <RouterLink to="/builds/new">New build</RouterLink>
        <RouterLink to="/me" class="who">{{ auth.user.username }}</RouterLink>
        <button class="link" @click="logout">Log out</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Log in</RouterLink>
        <RouterLink to="/register">Sign up</RouterLink>
      </template>
    </nav>
  </header>
  <main><RouterView :key="$route.path + ($route.query.from ?? '')" /></main>
  <FooterCard />
</template>

<style scoped>
.brand-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
/* Small tag next to the logo: "Tourney Balance V28.2" (the long name is shortened to "TB" on phones) */
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
.balance-tag .short {
  display: none;
}
/* Wide screens: the tag sits in the middle of the header (the header is the positioned parent).
   Below 1100px there is no room: it stays next to the logo. */
@media (min-width: 1100px) {
  .balance-tag {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
@media (max-width: 600px) {
  .balance-tag .long {
    display: none;
  }
  .balance-tag .short {
    display: inline;
  }
}
/* The logo with the golden ornament line (global .ornament) under it, as wide as the logo */
.brand-block {
  display: flex;
  flex-direction: column;
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
    #462523 0%,
    #cb9b51 21%,
    #f6e27a 45%,
    #f6f2c0 50%,
    #f6e27a 55%,
    #cb9b51 79%,
    #462523 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
