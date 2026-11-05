<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'

const props = defineProps({ mode: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const auth = useAuth()

const isLogin = computed(() => props.mode === 'login')
const email = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

// Client-side checks mirror the server rules (the server stays the source of truth).
function validate() {
  if (!email.value.trim()) return 'Email is required'
  if (isLogin.value) return password.value ? '' : 'Password is required'
  if (username.value.length < 3) return 'Username must be at least 3 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(username.value))
    return 'Username may only contain letters, numbers, _ and -'
  if (password.value.length < 8) return 'Password must be at least 8 characters'
  if (!/[0-9]/.test(password.value)) return 'Password must contain at least one number'
  if (!/[^A-Za-z0-9\s]/.test(password.value))
    return 'Password must contain at least one special character'
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return
  busy.value = true
  try {
    if (isLogin.value) await auth.login(email.value, password.value)
    else await auth.register(email.value, username.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h1>{{ isLogin ? 'Log in' : 'Sign up' }}</h1>
  <form class="form narrow" novalidate @submit.prevent="submit">
    <label>Email <input v-model="email" type="email" autocomplete="email" /></label>
    <label v-if="!isLogin"
      >Username
      <input v-model="username" autocomplete="username" maxlength="24" />
    </label>
    <label
      >Password
      <input
        v-model="password"
        type="password"
        maxlength="72"
        :autocomplete="isLogin ? 'current-password' : 'new-password'" />
      <small v-if="!isLogin" class="meta"
        >At least 8 characters, including a number and a special character.</small
      >
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn" :disabled="busy">{{ isLogin ? 'Log in' : 'Create account' }}</button>
    <p class="meta">
      <template v-if="isLogin"
        >No account yet? <RouterLink to="/register">Sign up</RouterLink></template
      >
      <template v-else>Already registered? <RouterLink to="/login">Log in</RouterLink></template>
    </p>
  </form>
</template>
