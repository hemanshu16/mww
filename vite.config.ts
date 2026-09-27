import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // countries.dev sends no CORS headers, so the browser can't call it directly.
    // In production, serve the same path from a reverse proxy or the backend.
    proxy: {
      '/postal-api': {
        target: 'https://countries.dev',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/postal-api/, '/api'),
      },
    },
  },
})
