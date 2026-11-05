<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api.js'
import PasswordField from '../components/PasswordField.vue'
import { validatePassword, PASSWORD_HINT } from '../utils/password.js'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''

const password = ref('')
const confirm = ref('')
const error = ref('')
const message = ref('')
const busy = ref(false)

async function submit() {
  error.value = validatePassword(password.value)
  if (!error.value && password.value !== confirm.value) error.value = 'Passwords do not match'
  if (error.value) return
  busy.value = true
  try {
    const res = await api('/auth/reset-password', {
      method: 'POST',
      body: { token, password: password.value },
    })
    message.value = res.message
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h1>Choose a new password</h1>

  <div v-if="!token">
    <p class="error">This reset link is invalid.</p>
    <RouterLink to="/forgot-password">Request a new link</RouterLink>
  </div>

  <div v-else-if="message">
    <p>{{ message }}</p>
    <RouterLink to="/login" class="btn">Log in</RouterLink>
  </div>

  <form v-else class="form narrow" novalidate @submit.prevent="submit">
    <PasswordField
      v-model="password"
      label="New password"
      autocomplete="new-password"
      :hint="PASSWORD_HINT" />
    <PasswordField v-model="confirm" label="Confirm new password" autocomplete="new-password" />
    <p v-if="error" class="error" role="alert">
      {{ error }}
      <RouterLink v-if="error.includes('expired')" to="/forgot-password"
        >Request a new link</RouterLink
      >
    </p>
    <button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Update password' }}</button>
  </form>
</template>
