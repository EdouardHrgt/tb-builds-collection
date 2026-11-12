import { defineStore } from 'pinia'
import { api } from '../api.js'

// "New builds from people I follow": the number shown on the Builds link of the menu.
// A build is new until the person opens it: the server counts them, refresh() just asks for the number.
export const useFeed = defineStore('feed', {
  state: () => ({ count: 0 }),
  actions: {
    async refresh() {
      try {
        this.count = (await api('/me/following/new')).count
      } catch {
        // an optional indicator: never shows an error
      }
    },
    reset() {
      this.count = 0
    },
  },
})
