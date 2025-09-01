export interface GenerationResult {
  html: string
  css: string
  js: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerationOptions {
  prompt: string
  device?: string
  framework?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatOptions {
  message: string
  context?: {
    hasActiveCode?: boolean
    recentMessages?: string[]
    currentArtifacts?: number
    responseMode?: 'just-build' | 'show-options' | 'explain-first'
  }
  temperature?: number
  maxTokens?: number
}

export interface IntentClassificationOptions {
  message: string
  hasActiveCode?: boolean
  responseMode?: 'just-build' | 'show-options' | 'explain-first'
}

export interface IntentClassificationResult {
  intent: 'generation' | 'modification' | 'explanation' | 'conversation'
  confidence: number
  reasoning: string
  shouldExecuteDirectly?: boolean
  shouldShowOptions?: boolean
}

export interface AIProvider {
  name: string
  models: string[]
  defaultModel: string
  
  generateWebsite(options: GenerationOptions): Promise<GenerationResult>
  generateChat(options: ChatOptions): Promise<string>
  classifyIntent(options: IntentClassificationOptions): Promise<IntentClassificationResult>
  isConfigured(): boolean
}

export interface ProviderConfig {
  apiKey?: string
  model?: string
  baseUrl?: string
  organizationId?: string
}

export type ProviderName = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'together'