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
    const { message, hasActiveCode = false, responseMode = 'show-options' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Use fast model for quick intent classification
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini')
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-beta')
    } else {
      // Fallback to simple classification
      return fallbackIntentClassification(message, hasActiveCode, responseMode, res)
    }

    const systemPrompt = `You are an intent classifier for a web development tool. Analyze the user's message and classify their intent.

Context:
- Has active code: ${hasActiveCode ? 'Yes' : 'No'}
- Response mode: ${responseMode}

Intent types:
1. "generation" - User wants to create/build/make something NEW (e.g., "build a todo app", "create a landing page")
2. "modification" - User wants to change/update/modify EXISTING code (e.g., "change the color to blue", "add a button")
3. "explanation" - User wants to understand/learn about something (e.g., "how does this work?", "explain React hooks")
4. "conversation" - General chat, greetings, unclear intent (e.g., "hi", "thanks", "what can you do?")

Response mode behavior:
- "just-build": If intent is "generation", should execute directly (shouldExecuteDirectly: true)
- "show-options": If intent is "generation", should show options first (shouldShowOptions: true)
- "explain-first": If intent is "generation", should explain before building (shouldExecuteDirectly: false)

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "intent": "generation" | "modification" | "explanation" | "conversation",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation",
  "shouldExecuteDirectly": boolean,
  "shouldShowOptions": boolean
}`

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Classify this message: "${message}"`
        }
      ],
      temperature: 0.3 // Low temperature for consistent classification
    })

    // Parse the AI response
    try {
      // Remove markdown code blocks if present
      let jsonText = result.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const classification = JSON.parse(jsonText)

      return res.status(200).json({
        success: true,
        intent: classification.intent || 'conversation',
        confidence: classification.confidence || 0.5,
        reasoning: classification.reasoning || 'AI classification',
        shouldExecuteDirectly: classification.shouldExecuteDirectly || false,
        shouldShowOptions: classification.shouldShowOptions || false
      })
    } catch (parseError) {
      console.error('Failed to parse AI classification:', parseError)
      // Fallback to keyword-based classification
      return fallbackIntentClassification(message, hasActiveCode, responseMode, res)
    }
  } catch (error) {
    console.error('Intent classification error:', error)
    // Fallback to keyword-based classification
    return fallbackIntentClassification(req.body.message, req.body.hasActiveCode, req.body.responseMode, res)
  }
}

function fallbackIntentClassification(
  message: string,
  hasActiveCode: boolean,
  responseMode: string,
  res: VercelResponse
) {
  const lowerMessage = message.toLowerCase()

  // Generation keywords
  const generationKeywords = ['build', 'create', 'make', 'generate', 'new', 'develop', 'design']
  const hasGenerationKeyword = generationKeywords.some(kw => lowerMessage.includes(kw))

  // Modification keywords
  const modificationKeywords = ['change', 'modify', 'update', 'edit', 'add', 'remove', 'fix', 'adjust']
  const hasModificationKeyword = modificationKeywords.some(kw => lowerMessage.includes(kw))

  // Explanation keywords
  const explanationKeywords = ['how', 'why', 'what', 'explain', 'tell me', 'show me', 'teach']
  const hasExplanationKeyword = explanationKeywords.some(kw => lowerMessage.includes(kw))

  let intent: 'generation' | 'modification' | 'explanation' | 'conversation' = 'conversation'
  let confidence = 0.5
  let reasoning = 'Fallback keyword-based classification'

  if (hasGenerationKeyword) {
    intent = 'generation'
    confidence = 0.75
    reasoning = 'Contains generation keywords'
  } else if (hasActiveCode && hasModificationKeyword) {
    intent = 'modification'
    confidence = 0.7
    reasoning = 'Contains modification keywords with active code'
  } else if (hasExplanationKeyword) {
    intent = 'explanation'
    confidence = 0.65
    reasoning = 'Contains question/explanation keywords'
  }

  const shouldExecuteDirectly = responseMode === 'just-build' && intent === 'generation'
  const shouldShowOptions = responseMode === 'show-options' && intent === 'generation'

  return res.status(200).json({
    success: true,
    intent,
    confidence,
    reasoning,
    shouldExecuteDirectly,
    shouldShowOptions
  })
}