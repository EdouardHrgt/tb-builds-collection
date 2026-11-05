<script setup>
import { ref } from 'vue'
import { api } from '../api.js'

const identifier = ref('')
const error = ref('')
const message = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (!identifier.value.trim()) {
    error.value = 'Email or username is required'
    return
  }
  busy.value = true
  try {
    const res = await api('/auth/forgot-password', {
      method: 'POST',
      body: { identifier: identifier.value.trim() },
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
  <h1>Forgot your password?</h1>

  <div v-if="message">
    <p>{{ message }}</p>
    <p class="meta">
      The link is valid for 1 hour. Check your spam folder if you don't see the email.
    </p>
    <RouterLink to="/login">Back to log in</RouterLink>
  </div>

  <form v-else class="form narrow" novalidate @submit.prevent="submit">
    <p class="meta">
      Enter your email or username. If an account matches, we'll send a reset link to the email
      address on file.
    </p>
    <label>Email or username <input v-model="identifier" autocomplete="username" /></label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="btn" :disabled="busy">{{ busy ? 'Sending…' : 'Send reset link' }}</button>
    <p class="meta"><RouterLink to="/login">Back to log in</RouterLink></p>
  </form>
</template>
