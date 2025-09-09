import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProviderFactory } from '../providers/factory'

const configUpdateSchema = z.object({
  serverPort: z.number().optional(),
  defaultProvider: z.string().optional(),
  environment: z.string().optional()
})

type ConfigUpdateRequest = z.infer<typeof configUpdateSchema>

export const developerRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Security middleware - only allow in development
  fastify.addHook('preHandler', async (request, reply) => {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' })
    }
    
    // Optional: Check for developer password
    const devPassword = process.env.VITE_DEVELOPER_PASSWORD
    if (devPassword) {
      const authHeader = request.headers.authorization
      if (!authHeader || authHeader !== `Bearer ${devPassword}`) {
        return reply.status(403).send({ error: 'Developer access required' })
      }
    }
  })

  // Get current system configuration
  fastify.get('/config', async (_, reply) => {
    try {
      const config = {
        server: {
          port: parseInt(process.env.SERVER_PORT || '3001', 10),
          environment: process.env.NODE_ENV || 'development',
          cors: {
            origins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
          }
        },
        ai: {
          defaultProvider: process.env.AI_PROVIDER || 'openai',
          providers: {
            openai: {
              configured: !!process.env.OPENAI_API_KEY,
              model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
            }
          }
        },
        frontend: {
          developerMode: process.env.VITE_ENABLE_DEVELOPER_MODE === 'true',
          devPassword: process.env.VITE_DEVELOPER_PASSWORD ? '***configured***' : 'not set'
        }
      }

      return reply.send({
        success: true,
        config,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      })
    }
  })

  // Update configuration (limited functionality for safety)
  fastify.post<{ Body: ConfigUpdateRequest }>('/config', async (request, reply) => {
    try {
      const updates = configUpdateSchema.parse(request.body)
      
      // For demonstration - in a real app, you'd want to be very careful about runtime config changes
      const appliedUpdates: string[] = []
      
      if (updates.defaultProvider) {
        // Validate the provider exists
        try {
          ProviderFactory.createProvider(updates.defaultProvider as any)
          appliedUpdates.push(`Default provider would be changed to: ${updates.defaultProvider}`)
        } catch (error) {
          return reply.status(400).send({
            success: false,
            error: `Invalid provider: ${updates.defaultProvider}`
          })
        }
      }
      
      // Note: Most config changes would require a server restart in a real application
      return reply.send({
        success: true,
        message: 'Configuration update simulation completed',
        appliedUpdates,
        note: 'Most configuration changes require a server restart to take effect',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      })
    }
  })

  // Get detailed provider status
  fastify.get('/providers/status', async (_, reply) => {
    try {
      const providers = ProviderFactory.getAvailableProviders()
      const detailedStatus = []
      
      for (const provider of providers) {
        const providerInstance = ProviderFactory.createProvider(provider.name)
        
        const status = {
          name: provider.name,
          configured: provider.configured,
          models: provider.models,
          isDefault: provider.name === (process.env.AI_PROVIDER || 'openai'),
          healthCheck: provider.configured ? 'ready' : 'not_configured',
          lastTested: null,
          configuration: {
            apiKey: provider.configured ? '***configured***' : 'not set',
            model: providerInstance.models[0] || 'default'
          }
        }
        
        detailedStatus.push(status)
      }

      return reply.send({
        success: true,
        providers: detailedStatus,
        total: detailedStatus.length,
        configured: detailedStatus.filter(p => p.configured).length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get provider status'
      })
    }
  })

  // Test specific provider configuration
  fastify.post<{ Body: { provider?: string; testPrompt?: string } }>('/providers/test', async (request, reply) => {
    try {
      const { provider: providerName, testPrompt = 'Hello! This is a developer test.' } = request.body
      
      if (!providerName) {
        return reply.status(400).send({
          success: false,
          error: 'Provider name is required'
        })
      }
      
      const provider = ProviderFactory.createProvider(providerName as any)
      
      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${providerName} is not configured`
        })
      }

      const startTime = Date.now()
      
      try {
        const response = await provider.generateChat({
          message: testPrompt,
          context: {},
          maxTokens: 100
        })
        
        const endTime = Date.now()
        
        return reply.send({
          success: true,
          provider: providerName,
          response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
          responseTime: endTime - startTime,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        return reply.status(500).send({
          success: false,
          provider: providerName,
          error: error instanceof Error ? error.message : 'Provider test failed'
        })
      }
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test provider'
      })
    }
  })

  // Get system metrics (mock data for demonstration)
  fastify.get('/metrics', async (_, reply) => {
    try {
      const uptime = process.uptime()
      const memoryUsage = process.memoryUsage()
      
      const metrics = {
        system: {
          uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
          },
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
          },
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        },
        api: {
          endpoints: [
            { path: '/api/health', method: 'GET', status: 'active' },
            { path: '/api/generate', method: 'POST', status: 'active' },
            { path: '/api/chat', method: 'POST', status: 'active' },
            { path: '/api/classify-intent', method: 'POST', status: 'active' },
            { path: '/api/providers', method: 'GET', status: 'active' },
            { path: '/api/test-provider', method: 'POST', status: 'active' }
          ]
        },
        performance: {
          // Mock performance data
          requestsPerMinute: Math.floor(Math.random() * 20) + 5,
          averageResponseTime: Math.floor(Math.random() * 500) + 200,
          errorRate: Math.random() * 0.05,
          cpuUsage: Math.random() * 40 + 10
        }
      }

      return reply.send({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics'
      })
    }
  })

  // Clear provider cache (useful for development)
  fastify.post('/cache/clear', async (_, reply) => {
    try {
      ProviderFactory.clearCache()
      
      return reply.send({
        success: true,
        message: 'Provider cache cleared successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      })
    }
  })

  // Get environment variables (masked sensitive data)
  fastify.get('/environment', async (_, reply) => {
    try {
      const env = process.env
      const maskedEnv: Record<string, string> = {}
      
      // List of safe environment variables to show
      const safeVars = [
        'NODE_ENV',
        'SERVER_PORT',
        'AI_PROVIDER',
        'VITE_ENABLE_DEVELOPER_MODE'
      ]
      
      // Add safe variables
      safeVars.forEach(key => {
        maskedEnv[key] = env[key] || 'not set'
      })
      
      // Add API key status (masked)
      const apiKeys = [
        'GROQ_API_KEY',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'GEMINI_API_KEY',
        'COHERE_API_KEY',
        'TOGETHER_API_KEY'
      ]
      
      apiKeys.forEach(key => {
        maskedEnv[key] = env[key] ? '***configured***' : 'not set'
      })

      return reply.send({
        success: true,
        environment: maskedEnv,
        note: 'Sensitive values are masked for security',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get environment variables'
      })
    }
  })
}