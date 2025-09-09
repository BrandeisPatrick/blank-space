import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProviderFactory } from '../providers/factory'
import { ProviderName } from '../providers/types'

const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  device: z.string().optional(),
  framework: z.string().optional(),
  provider: z.enum(['openai']).optional(),
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
  provider: z.enum(['openai']).optional(),
  model: z.string().optional()
})

const intentRequestSchema = z.object({
  message: z.string().min(1),
  hasActiveCode: z.boolean().optional(),
  responseMode: z.enum(['just-build', 'show-options', 'explain-first']).optional(),
  provider: z.enum(['openai']).optional(),
  model: z.string().optional()
})

const reasoningRequestSchema = z.object({
  goal: z.string().min(1),
  options: z.object({
    stream: z.boolean().optional(),
    provider: z.enum(['openai']).optional(),
    model: z.string().optional(),
    device: z.string().optional(),
    framework: z.string().optional()
  }).optional()
})

type GenerateRequest = z.infer<typeof generateRequestSchema>
type ChatRequest = z.infer<typeof chatRequestSchema>
type IntentRequest = z.infer<typeof intentRequestSchema>
type ReasoningRequest = z.infer<typeof reasoningRequestSchema>

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

  fastify.post<{ Body: ReasoningRequest }>('/reasoning', async (request, reply) => {
    try {
      const { goal, options = {} } = reasoningRequestSchema.parse(request.body)
      const { stream = true, provider: providerName, model, device = 'desktop', framework = 'vanilla' } = options
      
      const provider = providerName 
        ? ProviderFactory.createProvider(providerName as ProviderName, { model })
        : ProviderFactory.getDefaultProvider()

      if (!provider.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: `Provider ${provider.name} is not configured. Please add the API key in your .env file.`
        })
      }

      if (stream) {
        // Set headers for server-sent events
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        })

        // Generate reasoning with step-by-step streaming
        const startTime = Date.now()
        const steps: any[] = []
        
        // Simulate ReAct reasoning steps
        const reasoningSteps = [
          { type: 'thought', content: `I need to understand what the user wants: "${goal}"` },
          { type: 'action', content: 'Analyzing the request to determine the best approach' },
          { type: 'observation', content: `This appears to be a ${framework} ${device} application request` },
          { type: 'thought', content: 'I should break this down into component structure and styling' },
          { type: 'action', content: 'Generating code that matches the requirements' },
          { type: 'final_answer', content: 'Code generation complete with proper structure and styling' }
        ]

        for (let i = 0; i < reasoningSteps.length; i++) {
          const step = {
            id: `step_${i + 1}`,
            ...reasoningSteps[i],
            timestamp: new Date().toISOString()
          }
          steps.push(step)
          
          // Send step as server-sent event
          reply.raw.write(`data: ${JSON.stringify({ type: 'step', step })}\n\n`)
          
          // Add small delay to simulate thinking time
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Generate the final result using the provider
        const generatedCode = await provider.generateWebsite({ 
          prompt: goal, 
          device, 
          framework 
        })

        // Send final result
        const finalResult = {
          success: true,
          steps,
          finalAnswer: generatedCode.html || 'Generated code',
          totalSteps: steps.length,
          executionTime: Date.now() - startTime
        }
        
        reply.raw.write(`data: ${JSON.stringify({ type: 'final', result: finalResult })}\n\n`)
        reply.raw.end()
      } else {
        // Non-streaming response
        const startTime = Date.now()
        
        // Generate the code
        const generatedCode = await provider.generateWebsite({ 
          prompt: goal, 
          device, 
          framework 
        })

        const steps = [
          {
            id: 'step_1',
            type: 'thought' as const,
            content: `I need to understand what the user wants: "${goal}"`,
            timestamp: new Date().toISOString()
          },
          {
            id: 'step_2',
            type: 'action' as const,
            content: 'Analyzing the request to determine the best approach',
            timestamp: new Date().toISOString()
          },
          {
            id: 'step_3',
            type: 'observation' as const,
            content: `This appears to be a ${framework} ${device} application request`,
            timestamp: new Date().toISOString()
          },
          {
            id: 'step_4',
            type: 'final_answer' as const,
            content: 'Code generation complete with proper structure and styling',
            timestamp: new Date().toISOString()
          }
        ]

        return reply.send({
          success: true,
          steps,
          finalAnswer: generatedCode.html || 'Generated code',
          totalSteps: steps.length,
          executionTime: Date.now() - startTime
        })
      }
    } catch (error) {
      console.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate reasoning'
      })
    }
  })

  fastify.get('/health', async (_, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() })
  })

  fastify.get('/providers', async (_, reply) => {
    const providers = ProviderFactory.getAvailableProviders()
    const defaultProvider = process.env.AI_PROVIDER || 'openai'
    
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