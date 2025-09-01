import { CohereClient } from 'cohere-ai'
import {
  AIProvider,
  GenerationOptions,
  GenerationResult,
  ChatOptions,
  IntentClassificationOptions,
  IntentClassificationResult,
  ProviderConfig
} from './types'

export class CohereProvider implements AIProvider {
  name = 'cohere'
  models = [
    'command',
    'command-light',
    'command-nightly',
    'command-light-nightly'
  ]
  defaultModel = 'command'
  
  private client: CohereClient | null = null
  private model: string

  constructor(config: ProviderConfig) {
    if (config.apiKey) {
      this.client = new CohereClient({ 
        token: config.apiKey
      })
    }
    this.model = config.model || this.defaultModel
  }

  isConfigured(): boolean {
    return this.client !== null
  }

  async generateWebsite(options: GenerationOptions): Promise<GenerationResult> {
    if (!this.client) throw new Error('Cohere API key not configured')

    const prompt = `You are an expert web developer. Generate clean, modern, and responsive HTML, CSS, and JavaScript code based on the user's request. 
    
    IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.
    
    Return your response in this exact JSON format:
    {
      "html": "HTML content here",
      "css": "CSS styles here", 
      "js": "JavaScript code here"
    }
    
    JSON RULES:
    - Use double quotes only, escape internal quotes as \\"
    - No template literals or backticks
    - Use single quotes for HTML/CSS/JS attribute values when possible
    - Escape newlines as \\n or write compact code
    - No unescaped backslashes
    
    Code Guidelines:
    - Create semantic, accessible HTML
    - Use modern CSS with flexbox/grid for layouts
    - Make the design responsive and mobile-friendly
    - Add interactive JavaScript features where appropriate
    - Use clean, modern design patterns
    - Include proper colors, spacing, and typography
    - Write compact, production-ready code
    
    User request: ${options.prompt}`

    const response = await this.client.generate({
      model: this.model,
      prompt: prompt,
      maxTokens: options.maxTokens ?? 4000,
      temperature: options.temperature ?? 0.7,
      returnLikelihoods: 'NONE'
    })

    const responseContent = response.generations[0]?.text
    if (!responseContent) {
      throw new Error('No response from Cohere')
    }

    try {
      // Cohere may include extra text, try to extract JSON
      let jsonStr = responseContent
      const jsonStart = responseContent.indexOf('{')
      const jsonEnd = responseContent.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = responseContent.substring(jsonStart, jsonEnd + 1)
      }
      
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse Cohere response:', responseContent)
      throw new Error('Invalid response format from Cohere')
    }
  }

  async generateChat(options: ChatOptions): Promise<string> {
    if (!this.client) throw new Error('Cohere API key not configured')

    const preamble = `You are a friendly and enthusiastic AI assistant that specializes in helping people build websites and web applications. You have a warm, conversational personality.

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
- User has active projects: ${options.context?.hasActiveCode ? 'Yes' : 'No'}
- Number of user's projects: ${options.context?.currentArtifacts || 0}`

    const response = await this.client.chat({
      model: this.model,
      preamble: preamble,
      message: options.message,
      maxTokens: options.maxTokens ?? 1000,
      temperature: options.temperature ?? 0.8
    })

    if (!response.text) {
      throw new Error('No response from Cohere')
    }

    return response.text
  }

  async classifyIntent(options: IntentClassificationOptions): Promise<IntentClassificationResult> {
    if (!this.client) throw new Error('Cohere API key not configured')

    const examples = [
      { text: "build me a todo list", label: "generation" },
      { text: "create a landing page", label: "generation" },
      { text: "make the button bigger", label: "modification" },
      { text: "change the color to blue", label: "modification" },
      { text: "how does this code work?", label: "explanation" },
      { text: "explain the CSS", label: "explanation" },
      { text: "hello, how are you?", label: "conversation" },
      { text: "what can you do?", label: "conversation" }
    ]

    const response = await this.client.classify({
      model: 'embed-english-v2.0',
      inputs: [options.message],
      examples: examples
    })

    const classification = response.classifications[0]
    if (!classification) {
      throw new Error('No classification from Cohere')
    }

    const intent = classification.prediction as any
    const confidence = classification.confidence ?? 0.5

    // Determine behavioral flags based on response mode
    const isJustBuildMode = options.responseMode === 'just-build'
    const shouldShowOptions = options.responseMode === 'show-options'
    const shouldExecuteDirectly = isJustBuildMode && (intent === 'generation' || intent === 'modification')
    const shouldShowOptionsFlag = shouldShowOptions && (intent === 'generation' || intent === 'modification')

    return {
      intent: intent,
      confidence: confidence,
      reasoning: `Classified with ${confidence.toFixed(2)} confidence`,
      shouldExecuteDirectly: shouldExecuteDirectly,
      shouldShowOptions: shouldShowOptionsFlag
    }
  }
}