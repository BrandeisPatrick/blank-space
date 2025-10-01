import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'

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
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Select AI model - use faster model for chat
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini') // Faster, cheaper for chat
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-beta')
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      })
    }

    // Build context for the AI
    const hasActiveCode = context?.hasActiveCode || false
    const recentMessages = context?.recentMessages || []
    const currentArtifacts = context?.currentArtifacts || 0
    const sessionMemory = context?.sessionMemory || ''
    const userPreferences = context?.userPreferences || []

    const systemPrompt = `You are Bina, a helpful AI assistant in a web development tool called Blank Space.

Current context:
- Active code components: ${hasActiveCode ? 'Yes' : 'No'}
- Recent messages in conversation: ${recentMessages.length}
- Generated artifacts: ${currentArtifacts}
${sessionMemory ? `\nSession context:\n${sessionMemory}` : ''}
${userPreferences.length > 0 ? `\nUser preferences:\n${userPreferences.map((p: any) => `- ${p.type}: ${p.preference}`).join('\n')}` : ''}

Your role:
- Answer questions about web development, React, HTML, CSS, JavaScript
- Help users understand their code and suggest improvements
- Guide users on what to build or how to modify their projects
- Be concise, friendly, and helpful
- If user wants to build something, encourage them but explain they should describe their idea clearly
- Don't generate code in chat - that's handled by the generate feature

Guidelines:
- Be conversational and natural
- Keep responses under 3-4 sentences unless more detail is needed
- If user asks to build/create something, acknowledge and suggest they describe it in detail
- Help clarify requirements before generation
- Reference their existing artifacts if relevant`

    const result = await generateText({
      model,
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
      temperature: 0.8
    })

    return res.status(200).json({
      success: true,
      response: result.text,
      thinking: result.text.includes('thinking') ? 'Processing your request...' : undefined
    })
  } catch (error) {
    console.error('Chat error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: "I'm having trouble connecting right now, but I'm here to help you build websites! What would you like to create?"
    })
  }
}