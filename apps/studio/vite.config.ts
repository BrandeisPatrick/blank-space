import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ui-grid-ai/grid-engine': path.resolve(__dirname, '../../packages/grid-engine/src'),
      '@ui-grid-ai/compiler': path.resolve(__dirname, '../../packages/compiler/src'),
    }
  },
  server: {
    port: 3000
  }
})