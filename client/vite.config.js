import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // In dev, /api is proxied to the Node server (no CORS to handle)
    proxy: { '/api': 'http://localhost:3000' },
  },
})
