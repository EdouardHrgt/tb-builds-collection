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
    <strong id="main__logo">TB Builds Collection</strong>
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
#main__logo {
  padding: 0;
  font-size: 1.25rem;
  letter-spacing: 0.5px;
}
</style>
