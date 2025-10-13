import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy artifact API calls to deployed Vercel instance (for local development)
        '/api/artifacts': {
          target: 'https://blank-space-2qb5bgs2m-patricks-projects-1e98187f.vercel.app',
          changeOrigin: true,
          secure: true,
        },
        '/api/chat': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => '/v1/chat/completions',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add OpenAI API key to requests
              const apiKey = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
              }
            })
          }
        },
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add OpenAI API key to requests
              const apiKey = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
              }
            })
          }
        }
      }
    }
  }
})
