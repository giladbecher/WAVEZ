import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    port: 5173, // Default port
    strictPort: false, // Allow port fallback
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  }
})
