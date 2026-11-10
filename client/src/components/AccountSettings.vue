<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import PasswordField from './PasswordField.vue'
import { validatePassword, PASSWORD_HINT } from '../utils/password.js'

// Account section of the settings: change my email / my password (both ask for the current password)
const auth = useAuth()
const router = useRouter()

const open = ref('') // '' | 'email' | 'password' | 'delete': which form is shown
const typed = ref('') // delete: the username typed to confirm
const current = ref('')
const email = ref('')
const next = ref('')
const again = ref('')
const error = ref('')
const message = ref('')
const busy = ref(false)

function clear() {
  current.value = email.value = next.value = again.value = typed.value = error.value = ''
}
function toggle(name) {
  open.value = open.value === name ? '' : name
  message.value = ''
  clear()
}
function done(text) {
  clear()
  open.value = ''
  message.value = text
}

async function changeEmail() {
  error.value = ''
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return (error.value = 'Invalid email')
  if (!current.value) return (error.value = 'Enter your current password')
  busy.value = true
  try {
    auth.user = await api('/auth/change-email', {
      method: 'POST',
      body: { password: current.value, email: email.value.trim() },
    })
    done('Email updated.')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function changePassword() {
  error.value = validatePassword(next.value)
  if (!error.value && next.value !== again.value) error.value = 'Passwords do not match'
  if (!error.value && !current.value) error.value = 'Enter your current password'
  if (error.value) return
  busy.value = true
  try {
    const res = await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: current.value, newPassword: next.value },
    })
    done(res.message + ' Your other devices have been logged out.')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function deleteAccount() {
  error.value = ''
  if (typed.value.trim().toLowerCase() !== auth.user.username.toLowerCase()) {
    return (error.value = 'Type your username to confirm')
  }
  if (!current.value) return (error.value = 'Enter your current password')
  busy.value = true
  try {
    await api('/auth/delete-account', { method: 'POST', body: { password: current.value } })
    auth.user = null
    router.push('/')
  } catch (e) {
    error.value = e.message
    busy.value = false
  }
}
</script>

<template>
  <div class="account">
    <p class="meta">
      Email: <strong>{{ auth.user.email }}</strong>
    </p>

    <div class="actions">
      <button type="button" class="btn ghost" :aria-expanded="open === 'email'" @click="toggle('email')">
        {{ open === 'email' ? 'Close' : 'Change email' }}
      </button>
      <button
        type="button"
        class="btn ghost"
        :aria-expanded="open === 'password'"
        @click="toggle('password')">
        {{ open === 'password' ? 'Close' : 'Change password' }}
      </button>
      <button type="button" class="btn danger" :aria-expanded="open === 'delete'" @click="toggle('delete')">
        {{ open === 'delete' ? 'Close' : 'Delete account' }}
      </button>
    </div>

    <form v-if="open === 'email'" class="form narrow" novalidate @submit.prevent="changeEmail">
      <label>
        New email
        <input v-model="email" type="email" autocomplete="email" maxlength="120" />
      </label>
      <PasswordField v-model="current" label="Current password" autocomplete="current-password" />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Update email' }}</button>
    </form>

    <form v-if="open === 'password'" class="form narrow" novalidate @submit.prevent="changePassword">
      <PasswordField v-model="current" label="Current password" autocomplete="current-password" />
      <PasswordField
        v-model="next"
        label="New password"
        autocomplete="new-password"
        :hint="PASSWORD_HINT" />
      <PasswordField v-model="again" label="Confirm new password" autocomplete="new-password" />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Update password' }}</button>
    </form>

    <form v-if="open === 'delete'" class="form narrow" novalidate @submit.prevent="deleteAccount">
      <p class="warn">
        This permanently deletes your account, your builds, your comments (with the replies under them),
        your likes, bookmarks and follows. It cannot be undone.
      </p>
      <label>
        Type your username (<strong>{{ auth.user.username }}</strong>) to confirm
        <input v-model="typed" autocomplete="off" maxlength="24" />
      </label>
      <PasswordField v-model="current" label="Current password" autocomplete="current-password" />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn danger" :disabled="busy">{{ busy ? 'Deleting…' : 'Delete my account forever' }}</button>
    </form>

    <p v-if="message" class="done" role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.meta {
  margin: 0 0 0.8rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.ghost {
  color: #fff;
  background: transparent;
  border: 1px solid var(--line);
}
.form {
  margin-bottom: 1rem;
}
.warn {
  margin: 0;
  color: var(--danger);
}
.done {
  margin: 0.5rem 0 0;
  color: var(--accent);
}
</style>
