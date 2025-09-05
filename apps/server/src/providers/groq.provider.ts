import Groq from 'groq-sdk'
import {
  AIProvider,
  GenerationOptions,
  GenerationResult,
  ChatOptions,
  IntentClassificationOptions,
  IntentClassificationResult,
  ProviderConfig
} from './types'

export class GroqProvider implements AIProvider {
  name = 'groq'
  models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile', 
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ]
  defaultModel = 'llama-3.3-70b-versatile'
  
  private client: Groq | null = null
  private model: string

  constructor(config: ProviderConfig) {
    if (config.apiKey) {
      this.client = new Groq({ apiKey: config.apiKey })
    }
    this.model = config.model || this.defaultModel
  }

  isConfigured(): boolean {
    return this.client !== null
  }

  async generateWebsite(options: GenerationOptions): Promise<GenerationResult> {
    if (!this.client) throw new Error('Groq API key not configured')

    // Determine if this is a React request
    const framework = options.framework || 'vanilla'
    const isReact = framework.toLowerCase().includes('react')
    
    const systemPrompt = isReact
      ? `You are an expert React developer. Generate clean, modern React components with JSX, CSS, and any necessary JavaScript logic.
    
    IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.
    
    Return your response in this exact JSON format:
    {
      "html": "React JSX component code here",
      "css": "CSS styles here (use CSS modules or styled-components approach)", 
      "js": "Additional JavaScript logic if needed (hooks, utils, etc.)"
    }
    
    JSON RULES:
    - Use double quotes only, escape internal quotes as \\"
    - No template literals or backticks in JSON
    - Use single quotes for JSX/CSS attribute values when possible
    - Escape newlines as \\n or write compact code
    - No unescaped backslashes
    
    React Code Guidelines:
    - Create functional components using React hooks
    - Use modern JSX syntax and patterns
    - Implement responsive design with CSS modules or inline styles
    - Use useState, useEffect, and other hooks appropriately
    - Create reusable, accessible components
    - Follow React best practices and conventions
    - Include proper event handlers and state management
    - Use modern CSS (flexbox/grid) for layouts
    - Make components production-ready and well-structured`
      : `You are an expert web developer. Generate clean, modern, and responsive HTML, CSS, and JavaScript code based on the user's request. 
    
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

    const completion = await this.client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: isReact 
            ? `Create a React component based on this request: ${options.prompt}\n\nRequirements:\n- Use functional components with hooks\n- Make it responsive and accessible\n- Include proper styling\n- Add interactivity where appropriate`
            : `Create a website based on this request: ${options.prompt}`
        }
      ],
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8000,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Groq AI')
    }

    try {
      return JSON.parse(responseContent)
    } catch (error) {
      console.error('Failed to parse Groq response:', responseContent)
      throw new Error('Invalid response format from Groq AI')
    }
  }

  async generateChat(options: ChatOptions): Promise<string> {
    if (!this.client) throw new Error('Groq API key not configured')

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

    const completion = await this.client.chat.completions.create({
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
      model: this.model,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 1000
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Groq AI')
    }

    return responseContent
  }

  async classifyIntent(options: IntentClassificationOptions): Promise<IntentClassificationResult> {
    if (!this.client) throw new Error('Groq API key not configured')

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

    const completion = await this.client.chat.completions.create({
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
      model: this.model,
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from Groq AI')
    }

    try {
      return JSON.parse(responseContent)
    } catch (error) {
      console.error('Failed to parse Groq classification:', responseContent)
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