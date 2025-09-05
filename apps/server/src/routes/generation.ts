import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProviderFactory } from '../providers/factory'
import { ProviderName } from '../providers/types'

const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  device: z.string().optional(),
  framework: z.string().optional(),
  provider: z.enum(['groq']).optional(),
  model: z.string().optional()
})

const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    hasActiveCode: z.boolean().optional(),
    recentMessages: z.array(z.string()).optional(),
    currentArtifacts: z.number().optional(),
    responseMode: z.enum(['just-build', 'show-options', 'explain-first']).optional()
  }).optional(),
  provider: z.enum(['groq']).optional(),
  model: z.string().optional()
})

const intentRequestSchema = z.object({
  message: z.string().min(1),
  hasActiveCode: z.boolean().optional(),
  responseMode: z.enum(['just-build', 'show-options', 'explain-first']).optional(),
  provider: z.enum(['groq']).optional(),
  model: z.string().optional()
})

type GenerateRequest = z.infer<typeof generateRequestSchema>
type ChatRequest = z.infer<typeof chatRequestSchema>
type IntentRequest = z.infer<typeof intentRequestSchema>

export const generationRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.post<{ Body: GenerateRequest }>('/generate', async (request, reply) => {
    try {
      const { prompt, device = 'desktop', framework = 'vanilla', provider: providerName, model } = generateRequestSchema.parse(request.body)
      
      const provider = providerName 
        ? ProviderFactory.createProvider(providerName as ProviderName, { model })
        : ProviderFactory.getDefaultProvider()

      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${provider.name} is not configured. Please add the API key in your .env file.`
        })
      }

      const generatedCode = await provider.generateWebsite({ prompt, device, framework })

      const artifactId = `artifact_${Date.now()}`
      
      // Handle React vs vanilla HTML differently
      const isReact = framework.toLowerCase().includes('react')
      
      const artifact = {
        id: artifactId,
        projectId: 'default',
        regionId: 'full-page',
        files: isReact ? {
          'App.jsx': generatedCode.html || '', // JSX component
          'App.module.css': generatedCode.css || '', // CSS modules
          'hooks.js': generatedCode.js || '', // Additional hooks/logic
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${generatedCode.html || ''}
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
    <style>${generatedCode.css || ''}</style>
</body>
</html>`
        } : {
          'index.html': generatedCode.html || '',
          'styles.css': generatedCode.css || '',
          'script.js': generatedCode.js || ''
        },
        entry: 'index.html',
        metadata: {
          device: device,
          region: {
            start: { x: 0, y: 0 },
            end: { x: 23, y: 19 }
          },
          framework: framework,
          isReact: isReact,
          dependencies: isReact ? ['react', 'react-dom'] : []
        },
        createdAt: new Date().toISOString(),
        author: `${provider.name}-ai-generator`
      }

      return reply.send({
        success: true,
        artifact,
        message: `Generated website based on: ${prompt.slice(0, 100)}...`
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate website'
      })
    }
  })

  fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
    try {
      const { message, context = {}, provider: providerName, model } = chatRequestSchema.parse(request.body)
      
      const provider = providerName 
        ? ProviderFactory.createProvider(providerName as ProviderName, { model })
        : ProviderFactory.getDefaultProvider()

      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${provider.name} is not configured. Please add the API key in your .env file.`
        })
      }

      const responseContent = await provider.generateChat({ message, context })

      return reply.send({
        success: true,
        response: responseContent,
        message: 'Chat response generated successfully'
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate chat response'
      })
    }
  })

  fastify.post<{ Body: IntentRequest }>('/classify-intent', async (request, reply) => {
    try {
      const { message, hasActiveCode = false, responseMode = 'show-options', provider: providerName, model } = intentRequestSchema.parse(request.body)
      
      const provider = providerName 
        ? ProviderFactory.createProvider(providerName as ProviderName, { model })
        : ProviderFactory.getDefaultProvider()

      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${provider.name} is not configured. Please add the API key in your .env file.`
        })
      }

      const result = await provider.classifyIntent({ message, hasActiveCode, responseMode })

      return reply.send({
        success: true,
        intent: result.intent,
        confidence: result.confidence,
        reasoning: result.reasoning,
        shouldExecuteDirectly: result.shouldExecuteDirectly,
        shouldShowOptions: result.shouldShowOptions
      })
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to classify intent'
      })
    }
  })

  fastify.get('/health', async (_, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() })
  })

  fastify.get('/providers', async (_, reply) => {
    const providers = ProviderFactory.getAvailableProviders()
    const defaultProvider = process.env.AI_PROVIDER || 'groq'
    
    return reply.send({
      success: true,
      defaultProvider,
      providers: providers.map(p => ({
        name: p.name,
        configured: p.configured,
        models: p.models,
        isDefault: p.name === defaultProvider
      }))
    })
  })

  fastify.post<{ Body: { provider?: string; model?: string; testPrompt?: string } }>('/test-provider', async (request, reply) => {
    try {
      const { provider: providerName, model, testPrompt = 'Hello! Can you introduce yourself?' } = request.body
      
      const provider = providerName 
        ? ProviderFactory.createProvider(providerName as ProviderName, { model })
        : ProviderFactory.getDefaultProvider()

      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${provider.name} is not configured. Please add the API key in your .env file.`
        })
      }

      const startTime = Date.now()
      
      try {
        const response = await provider.generateChat({ 
          message: testPrompt,
          context: {},
          maxTokens: 200
        })
        
        const endTime = Date.now()
        
        return reply.send({
          success: true,
          provider: provider.name,
          model: model || 'default',
          response,
          responseTime: endTime - startTime,
          message: 'Provider test successful'
        })
      } catch (error) {
        return reply.status(500).send({
          success: false,
          provider: provider.name,
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
}