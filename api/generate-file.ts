import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { FileSpecification } from './plan-project'

interface GenerateFileRequest {
  file: FileSpecification
  previousFiles: {
    path: string
    content: string
  }[]
  framework: 'react' | 'vanilla' | 'vue'
  typescript: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { file, previousFiles = [], framework = 'react', typescript = true }: GenerateFileRequest = req.body

    if (!file) {
      return res.status(400).json({ error: 'File specification is required' })
    }

    // Handle .bina.json specially - generate manifest directly
    if (file.path === '.bina.json') {
      const manifest = {
        previewMode: typescript ? 'bundled' : 'single-file',
        entry: 'App.tsx',
        framework: framework,
        typescript: typescript,
        bundlerReady: true,
        version: '1.0.0'
      }

      const manifestContent = JSON.stringify(manifest, null, 2)

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      res.write(`data: ${JSON.stringify({
        type: 'complete',
        file: '.bina.json',
        content: manifestContent
      })}\n\n`)

      res.end()
      return
    }

    // Select AI model
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o')
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-beta')
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      })
    }

    // Build context from previous files
    const contextSummary = previousFiles.map(f => {
      // Extract exports from previous files for reference
      const exportMatches = f.content.match(/export\s+(default\s+)?(function|const|class|interface|type|enum)\s+(\w+)/g) || []
      const exports = exportMatches.map(exp => {
        const parts = exp.split(/\s+/)
        return parts[parts.length - 1]
      })

      return `File: ${f.path}
Exports: ${exports.join(', ') || 'none'}
---`
    }).join('\n')

    // Build detailed system prompt for file generation
    const systemPrompt = `You are an expert ${framework} developer generating a single file based on specifications.

Framework: ${framework}
TypeScript: ${typescript ? 'Yes' : 'No'}
File: ${file.path}
Category: ${file.category}

CONTEXT FROM PREVIOUS FILES:
${contextSummary || 'No previous files'}

FILE SPECIFICATION:
${JSON.stringify(file.specification, null, 2)}

GENERATION RULES:
1. Generate ONLY the file content - no explanations, no markdown code blocks
2. Follow the specification exactly
3. Import from previous files using correct relative paths
4. Use modern ${framework} best practices
5. Include all specified features and methods
6. ${typescript ? 'Use proper TypeScript types' : 'Use JSDoc comments for type hints'}
7. Make the code production-ready and complete
8. NO placeholders like "// rest of code" - implement everything
9. Ensure all imports reference files that actually exist

For React components:
- Use functional components with hooks
- Include proper prop types
- Handle all edge cases
- Add accessibility attributes

For TypeScript files:
- Export all specified interfaces/types
- Use proper type annotations
- Avoid 'any' type

For CSS files:
- Use modern CSS features
- Include responsive design
- Add smooth transitions

IMPORTANT: Output ONLY the file content, nothing else.`

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate the complete content for ${file.path}:

Description: ${file.description}
Purpose: ${file.specification.purpose}
Dependencies: ${file.dependencies.join(', ') || 'none'}

Follow the specification exactly and create production-ready code.`
        }
      ],
      temperature: 0.5 // Lower temperature for more consistent code
    })

    // Stream the file content
    let fullContent = ''

    for await (const chunk of result.textStream) {
      fullContent += chunk

      // Send chunk to client
      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: chunk
      })}\n\n`)
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      file: file.path,
      content: fullContent
    })}\n\n`)

    res.end()

  } catch (error) {
    console.error('File generation error:', error)

    // Check if headers were already sent (streaming started)
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }

    // If streaming already started, send error as SSE
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })}\n\n`)
    res.end()
  }
}