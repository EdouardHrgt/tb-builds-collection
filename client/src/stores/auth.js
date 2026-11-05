import { defineStore } from 'pinia'
import { api } from '../api.js'

export const useAuth = defineStore('auth', {
  state: () => ({ user: null, ready: false }),
  actions: {
    async init() {
      if (this.ready) return
      try {
        this.user = await api('/auth/me')
      } catch {
        this.user = null
      }
      this.ready = true
    },
    async login(identifier, password) {
      this.user = await api('/auth/login', { method: 'POST', body: { identifier, password } })
    },
    async register(email, username, password) {
      this.user = await api('/auth/register', {
        method: 'POST',
        body: { email, username, password },
      })
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' })
      this.user = null
    },
  },
})
