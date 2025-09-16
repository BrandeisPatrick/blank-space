import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Use OpenAI GPT-5-nano for quick chat responses
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-5-nano')
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1')
    } else {
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY' 
      })
    }

    // Build context for the AI
    const hasActiveCode = context?.hasActiveCode || false
    const recentMessages = context?.recentMessages || []
    const currentArtifacts = context?.currentArtifacts || 0
    const responseMode = context?.responseMode || 'show-options'

    const systemPrompt = `You are a helpful AI assistant in a code generation interface.

Current context:
- Active code components: ${hasActiveCode ? 'Yes' : 'No'}
- Recent messages: ${recentMessages.length}
- Current artifacts: ${currentArtifacts}
- Response mode: ${responseMode}

Guidelines:
- Be concise and helpful
- If user asks about code generation, acknowledge their request and suggest using the generation features
- If user asks about existing code, provide relevant guidance
- For general questions, provide brief, informative answers
- Always be encouraging and supportive

Respond naturally and conversationally. You can include thinking/reasoning in your response by wrapping it in <thinking> tags.`

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...recentMessages.map((msg: any) => ({
          role: msg.role || 'user',
          content: msg.content || msg.message || String(msg)
        })),
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
    })

    let fullResponse = ''
    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    // Parse thinking/reasoning sections
    const thinkingMatch = fullResponse.match(/<thinking>([\s\S]*?)<\/thinking>/)
    const thinking = thinkingMatch ? thinkingMatch[1].trim() : null
    const content = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()

    return res.status(200).json({ 
      success: true,
      response: content,
      thinking: thinking,
      metadata: {
        model: process.env.OPENAI_API_KEY ? 'gpt-5-nano' : 'grok-code-fast-1',
        provider: process.env.OPENAI_API_KEY ? 'openai' : 'xai',
        hasThinking: !!thinking,
        responseLength: content.length
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}