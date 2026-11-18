import { defineStore } from 'pinia'
import { api } from '../api.js'

// Unread comments: on my builds, and replies to my comments (the server decides, see comments.js).
//   total  -> the number shown next to my name in the menu
//   items  -> [{ buildId, title, author, mine, count }]: the builds that have unread comments
//   byBuild[buildId] -> its number of unread comments (0 when none)
export const useNotifications = defineStore('notifications', {
  state: () => ({ total: 0, items: [] }),
  getters: {
    // Where the bell of the menu leads: the comments of the build when only one has news, else the list of the profile
    target: (s) =>
      s.items.length === 1 ? { path: `/builds/${s.items[0].buildId}`, hash: '#comments' } : '/me',
    byBuild: (s) => Object.fromEntries(s.items.map((i) => [i.buildId, i.count])),
  },
  actions: {
    async refresh() {
      try {
        const res = await api('/me/notifications')
        this.total = res.total
        this.items = res.items
      } catch {
        // an optional indicator: never shows an error
      }
    },
    reset() {
      this.total = 0
      this.items = []
    },
  },
})
