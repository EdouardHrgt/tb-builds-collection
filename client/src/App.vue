<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'

const auth = useAuth()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="top">
    <RouterLink to="/" class="brand">Modded Builds</RouterLink>
    <nav>
      <RouterLink to="/">Builds</RouterLink>
      <template v-if="auth.user">
        <RouterLink to="/builds/new">New build</RouterLink>
        <RouterLink to="/me">My builds</RouterLink>
        <span class="who">{{ auth.user.username }}</span>
        <button class="link" @click="logout">Log out</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Log in</RouterLink>
        <RouterLink to="/register">Sign up</RouterLink>
      </template>
    </nav>
  </header>
  <main><RouterView /></main>
</template>
