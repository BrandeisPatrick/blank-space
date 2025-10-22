import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Use PORT from environment (set by Vercel CLI) or default to 5173
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: false, // Allow fallback to next available port if PORT is taken
  }
})
