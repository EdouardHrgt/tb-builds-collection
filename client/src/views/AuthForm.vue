<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'
import PasswordField from '../components/PasswordField.vue'
import { validatePassword, PASSWORD_HINT } from '../utils/password.js'

const props = defineProps({ mode: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const auth = useAuth()

const isLogin = computed(() => props.mode === 'login')
const identifier = ref('') // login: email or username
const email = ref('')
const username = ref('')
const password = ref('')
const confirm = ref('')
const agreed = ref(false) // sign-up only: privacy policy and community rules
const error = ref('')
const busy = ref(false)

// /login and /register share this component: clear the form when switching
watch(
  () => props.mode,
  () => {
    identifier.value =
      email.value =
      username.value =
      password.value =
      confirm.value =
      error.value =
        ''
    agreed.value = false
  },
)

function validate() {
  if (isLogin.value) {
    if (!identifier.value.trim()) return 'Email or username is required'
    return password.value ? '' : 'Password is required'
  }
  if (!email.value.trim()) return 'Email is required'
  if (username.value.length < 3) return 'Username must be at least 3 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(username.value))
    return 'Username may only contain letters, numbers, _ and -'
  const pwError = validatePassword(password.value)
  if (pwError) return pwError
  if (password.value !== confirm.value) return 'Passwords do not match'
  if (!agreed.value) return 'Please accept the privacy policy and the community rules'
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return
  busy.value = true
  try {
    if (isLogin.value) await auth.login(identifier.value.trim(), password.value)
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
  <section class="align-section">
    <h1>{{ isLogin ? 'Log in' : 'Sign up' }}</h1>
    <form class="form narrow" novalidate @submit.prevent="submit">
      <template v-if="isLogin">
        <label
          >Email or username
          <input v-model="identifier" autocomplete="username" />
          <small class="meta">Forgot your email? Log in with your username instead.</small>
        </label>
      </template>
      <template v-else>
        <label>Email <input v-model="email" type="email" autocomplete="email" /></label>
        <label>Username <input v-model="username" autocomplete="username" maxlength="24" /></label>
      </template>

      <PasswordField
        v-model="password"
        label="Password"
        :autocomplete="isLogin ? 'current-password' : 'new-password'"
        :hint="isLogin ? '' : PASSWORD_HINT" />
      <PasswordField
        v-if="!isLogin"
        v-model="confirm"
        label="Confirm password"
        autocomplete="new-password" />

      <label v-if="!isLogin" class="agree">
        <input v-model="agreed" type="checkbox" />
        <span
          >I have read the
          <RouterLink to="/privacy" target="_blank">privacy policy and community rules</RouterLink> and I agree
          to them.</span
        >
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy">{{ isLogin ? 'Log in' : 'Create account' }}</button>

      <p v-if="isLogin" class="meta">
        <RouterLink to="/forgot-password">Forgot your password?</RouterLink>
      </p>
      <p class="meta">
        <template v-if="isLogin"
          >No account yet? <RouterLink to="/register">Sign up</RouterLink></template
        >
        <template v-else>Already registered? <RouterLink to="/login">Log in</RouterLink></template>
      </p>
    </form>
  </section>
</template>

<style scoped>
.agree {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.9rem;
}
.agree input {
  flex: none;
  width: auto;
  margin-top: 0.2rem;
}
</style>
