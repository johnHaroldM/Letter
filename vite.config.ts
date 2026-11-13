import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the built site works from any folder or sub-path
  // (GitHub Pages, Netlify, Vercel, a plain static file server...).
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // three.js is split into its own lazily loaded chunk; it is simply large.
    chunkSizeWarningLimit: 1400,
  },
})
