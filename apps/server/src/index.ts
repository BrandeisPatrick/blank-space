import fastify from 'fastify'
import cors from '@fastify/cors'
import * as dotenv from 'dotenv'
import { generationRoutes } from './routes/generation'

dotenv.config({ path: '../../.env' })

const server = fastify({
  logger: true
})

async function start() {
  try {
    await server.register(cors, {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })

    await server.register(generationRoutes, { prefix: '/api' })

    const port = parseInt(process.env.SERVER_PORT || '3001', 10)
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()