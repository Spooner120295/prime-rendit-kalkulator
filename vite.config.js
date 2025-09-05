import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// Vite-Konfiguration
export default defineConfig({
  // Wichtig für GitHub Pages: Repo-Name als Base-Pfad
  base: '/prime-rendit-kalkulator/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
