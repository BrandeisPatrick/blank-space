import {
  AIProvider,
  GenerationOptions,
  GenerationResult,
  ChatOptions,
  IntentClassificationOptions,
  IntentClassificationResult,
  ProviderConfig
} from './types'

export class TogetherProvider implements AIProvider {
  name = 'together'
  models = [
    'meta-llama/Llama-3-70b-chat-hf',
    'meta-llama/Llama-3-8b-chat-hf',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'mistralai/Mistral-7B-Instruct-v0.2',
    'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    'togethercomputer/CodeLlama-34b-Instruct'
  ]
  defaultModel = 'meta-llama/Llama-3-70b-chat-hf'
  
  private apiKey: string | null = null
  private model: string
  private baseUrl = 'https://api.together.xyz/v1'

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || null
    this.model = config.model || this.defaultModel
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    if (!this.apiKey) throw new Error('Together AI API key not configured')

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Together AI API error: ${error}`)
    }

    return response.json()
  }

  async generateWebsite(options: GenerationOptions): Promise<GenerationResult> {
    const systemPrompt = `You are an expert web developer. Generate clean, modern, and responsive HTML, CSS, and JavaScript code based on the user's request. 
    
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
    - Write compact, production-ready code`

    const response = await this.makeRequest('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Create a website based on this request: ${options.prompt}`
        }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8000,
      response_format: { type: 'json_object' }
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Together AI')
    }

    try {
      return JSON.parse(responseContent)
    } catch (error) {
      console.error('Failed to parse Together AI response:', responseContent)
      throw new Error('Invalid response format from Together AI')
    }
  }

  async generateChat(options: ChatOptions): Promise<string> {
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
- User has active projects: ${options.context?.hasActiveCode ? 'Yes' : 'No'}
- Number of user's projects: ${options.context?.currentArtifacts || 0}

Respond naturally and conversationally. If they're just chatting (greetings, personal questions), be friendly and engaging. If they want to build something, offer to help and ask what they'd like to create.`

    const response = await this.makeRequest('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: options.message
        }
      ],
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 1000
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Together AI')
    }

    return responseContent
  }

  async classifyIntent(options: IntentClassificationOptions): Promise<IntentClassificationResult> {
    const systemPrompt = `You are an expert intent classifier for a web development assistant. Classify the user's message into one of these categories:

INTENT TYPES:
- "generation": User wants to create/build/generate something new (websites, apps, components, etc.)
- "modification": User wants to modify/change/edit existing code or content
- "explanation": User wants an explanation of code or how something works
- "conversation": General conversation, greetings, questions about the assistant

CONTEXT:
- User has active code/project: ${options.hasActiveCode ? 'Yes' : 'No'}
- Response Mode: ${options.responseMode || 'show-options'}
  - "just-build": User prefers direct action, minimal explanation
  - "show-options": User wants to see alternatives before deciding
  - "explain-first": User wants detailed explanations before action

RULES:
- Be decisive - choose the most likely intent
- If user says "build", "create", "make", "generate" + anything = "generation"
- If user mentions specific things to build (todo list, calculator, website, etc.) = "generation"
- If user says "just build it" or similar = "generation" 
- If user wants to change/modify existing code = "modification"
- If user asks "how does this work" or "explain" = "explanation"
- If user is chatting/greeting = "conversation"
- If user says "I don't see X" or "X is not working" = "modification" (if has code) or "generation" (if no code)

BEHAVIORAL FLAGS:
- shouldExecuteDirectly: true if responseMode is "just-build" AND intent is generation/modification
- shouldShowOptions: true if responseMode is "show-options" AND intent is generation/modification

Respond with ONLY a JSON object:
{
  "intent": "generation|modification|explanation|conversation",
  "confidence": 0.95,
  "reasoning": "Brief explanation why",
  "shouldExecuteDirectly": true/false,
  "shouldShowOptions": true/false
}`

    const response = await this.makeRequest('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Classify this message: "${options.message}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Together AI')
    }

    try {
      return JSON.parse(responseContent)
    } catch (error) {
      console.error('Failed to parse Together AI classification:', responseContent)
      // Fallback classification
      const message_lower = options.message.toLowerCase()
      const isJustBuildMode = options.responseMode === 'just-build'
      const shouldShowOptions = options.responseMode === 'show-options'
      
      if (message_lower.includes('build') || message_lower.includes('create') || message_lower.includes('make') || message_lower.includes('generate')) {
        return { 
          intent: 'generation', 
          confidence: 0.7, 
          reasoning: 'Fallback: contains generation keywords',
          shouldExecuteDirectly: isJustBuildMode,
          shouldShowOptions: shouldShowOptions
        }
      }
      return { 
        intent: 'conversation', 
        confidence: 0.5, 
        reasoning: 'Fallback: default to conversation',
        shouldExecuteDirectly: true,
        shouldShowOptions: false
      }
    }
  }
}