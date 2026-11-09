<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'
import FooterCard from './components/FooterCard.vue'

const auth = useAuth()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="top">
    <div class="brand-block">
      <strong id="main__logo">Sigmar's Arsenal</strong>
      <div class="ornament" aria-hidden="true">◆</div>
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
  <main><RouterView /></main>
  <FooterCard />
</template>

<style scoped>
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
