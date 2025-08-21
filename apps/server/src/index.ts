import fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import { generationRoutes } from './routes/generation'

dotenv.config({ path: '../../.env' })

const server = fastify({
  logger: true
})

async function start() {
  try {
    await server.register(cors, {
      origin: true,
      credentials: true
    })

    await server.register(generationRoutes, { prefix: '/api' })

    const port = parseInt(process.env.SERVER_PORT || '3001', 10)
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()