import { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, hasActiveCode = false, responseMode = 'show-options' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Use OpenAI GPT-5-mini for intent classification (better at analysis)
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-5-mini')
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1')
    } else {
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY' 
      })
    }

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: `Classify user intent for coding requests. Return JSON only.

Available intents:
- "generation": User wants to create/build/generate new code/components
- "modification": User wants to modify/update existing code  
- "explanation": User wants explanation/understanding of code
- "conversation": General chat/questions not code-related

Context:
- hasActiveCode: ${hasActiveCode}
- responseMode: ${responseMode}

Return this exact JSON format:
{
  "intent": "generation|modification|explanation|conversation",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification",
  "shouldExecuteDirectly": ${responseMode === 'just-build'},
  "shouldShowOptions": ${responseMode === 'show-options'}
}`
        },
        {
          role: 'user',
          content: `Classify this request: "${message}"`
        }
      ],
      temperature: 0.1,
    })

    let intentText = ''
    for await (const chunk of result.textStream) {
      intentText += chunk
    }
    
    let intentResult
    try {
      intentResult = JSON.parse(intentText)
    } catch (parseError) {
      console.warn('Failed to parse intent classification:', parseError)
      // Fallback classification based on keywords
      const message_lower = message.toLowerCase()
      const isJustBuildMode = responseMode === 'just-build'
      const shouldShowOptions = responseMode === 'show-options'
      
      if (message_lower.includes('build') || message_lower.includes('create') || 
          message_lower.includes('make') || message_lower.includes('generate')) {
        intentResult = { 
          intent: 'generation', 
          confidence: 0.7, 
          reasoning: 'Fallback: contains generation keywords',
          shouldExecuteDirectly: isJustBuildMode,
          shouldShowOptions: shouldShowOptions
        }
      } else if (message_lower.includes('modify') || message_lower.includes('change') || 
                 message_lower.includes('update') || message_lower.includes('fix')) {
        intentResult = { 
          intent: 'modification', 
          confidence: 0.6, 
          reasoning: 'Fallback: contains modification keywords',
          shouldExecuteDirectly: isJustBuildMode,
          shouldShowOptions: shouldShowOptions
        }
      } else {
        intentResult = { 
          intent: 'conversation', 
          confidence: 0.5, 
          reasoning: 'Fallback: default to conversation',
          shouldExecuteDirectly: true,
          shouldShowOptions: false
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      ...intentResult
    })

  } catch (error) {
    console.error('Intent classification error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}