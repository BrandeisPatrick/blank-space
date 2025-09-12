import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['ai', '@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/groq']
  },
  define: {
    global: 'globalThis'
  }
})