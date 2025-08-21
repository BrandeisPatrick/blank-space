import { FastifyPluginAsync } from 'fastify'
import Groq from 'groq-sdk'
import { z } from 'zod'

const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  device: z.string().optional(),
  framework: z.string().optional()
})

const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    hasActiveCode: z.boolean().optional(),
    recentMessages: z.array(z.string()).optional(),
    currentArtifacts: z.number().optional()
  }).optional()
})

type GenerateRequest = z.infer<typeof generateRequestSchema>
type ChatRequest = z.infer<typeof chatRequestSchema>

export const generationRoutes: FastifyPluginAsync = async (fastify) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  })

  fastify.post<{ Body: GenerateRequest }>('/generate', async (request, reply) => {
    try {
      const { prompt, device = 'desktop', framework = 'vanilla' } = generateRequestSchema.parse(request.body)

      const systemPrompt = `You are an expert web developer. Generate clean, modern, and responsive HTML, CSS, and JavaScript code based on the user's request. 
      
      Return your response in the following JSON format:
      {
        "html": "<!-- HTML content here -->",
        "css": "/* CSS styles here */",
        "js": "// JavaScript code here"
      }
      
      Guidelines:
      - Create semantic, accessible HTML
      - Use modern CSS with flexbox/grid for layouts
      - Make the design responsive and mobile-friendly
      - Add interactive JavaScript features where appropriate
      - Use clean, modern design patterns
      - Include proper colors, spacing, and typography
      - Make it production-ready and professional`

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Create a website based on this request: ${prompt}`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from AI')
      }

      let generatedCode
      try {
        generatedCode = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseContent)
        throw new Error('Invalid response format from AI')
      }

      const artifactId = `artifact_${Date.now()}`
      
      const artifact = {
        id: artifactId,
        projectId: 'default',
        regionId: 'full-page',
        files: {
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
          dependencies: []
        },
        createdAt: new Date().toISOString(),
        author: 'groq-ai-generator'
      }

      return reply.send({
        success: true,
        artifact,
        message: `Generated website based on: ${prompt.slice(0, 100)}...`
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate website'
      })
    }
  })

  fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
    try {
      const { message, context = {} } = chatRequestSchema.parse(request.body)

      const systemPrompt = `You are a friendly and enthusiastic AI assistant that specializes in helping people build websites and web applications. You have a warm, conversational personality.

Key traits:
- Warm, friendly, and approachable
- Enthusiastic about web development and creative projects
- Use emojis naturally in conversation
- Ask follow-up questions to show interest
- Be helpful and encouraging
- Give human-like responses to personal questions like "how is your day"

Context about your capabilities:
- You can generate HTML, CSS, and JavaScript code
- You help create websites, web pages, and applications
- You work with responsive designs and modern web technologies

Current context:
- User has active projects: ${context.hasActiveCode ? 'Yes' : 'No'}
- Number of user's projects: ${context.currentArtifacts || 0}

Respond naturally and conversationally. If they're just chatting (greetings, personal questions), be friendly and engaging. If they want to build something, offer to help and ask what they'd like to create.`

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 1000
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from AI')
      }

      return reply.send({
        success: true,
        response: responseContent,
        message: 'Chat response generated successfully'
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate chat response'
      })
    }
  })

  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() })
  })
}