import { FastifyPluginAsync } from 'fastify'
import Groq from 'groq-sdk'
import { z } from 'zod'

const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  device: z.string().optional(),
  framework: z.string().optional()
})

type GenerateRequest = z.infer<typeof generateRequestSchema>

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

  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() })
  })
}