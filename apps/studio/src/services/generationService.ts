import { Artifact, ResponseMode } from '../types'

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001/api'

export interface GenerationOptions {
  device?: string
  framework?: string
}

export class GenerationService {
  private static instance: GenerationService
  
  static getInstance(): GenerationService {
    if (!GenerationService.instance) {
      GenerationService.instance = new GenerationService()
    }
    return GenerationService.instance
  }

  async generateWebsite(prompt: string, options: GenerationOptions = {}): Promise<Artifact> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          device: options.device || 'desktop',
          framework: options.framework || 'vanilla'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.artifact
    } catch (error) {
      console.error('Generation error:', error)
      throw error
    }
  }

  async generateChatResponse(message: string, context?: {
    hasActiveCode?: boolean
    recentMessages?: string[]
    currentArtifacts?: number
    responseMode?: ResponseMode
  }): Promise<string> {
    try {
      console.log('Making chat request to:', `${API_BASE_URL}/chat`)
      console.log('Request payload:', { message, context })
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const error = await response.json()
        console.error('Response error:', error)
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Chat response failed')
      }

      return data.response
    } catch (error) {
      console.error('Chat error details:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      throw error instanceof Error ? error : new Error('Unknown error')
    }
  }

  async classifyIntent(message: string, hasActiveCode: boolean = false, responseMode: ResponseMode = 'show-options'): Promise<{
    intent: 'generation' | 'modification' | 'explanation' | 'conversation'
    confidence: number
    reasoning: string
    shouldExecuteDirectly?: boolean
    shouldShowOptions?: boolean
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/classify-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          hasActiveCode,
          responseMode
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Intent classification failed')
      }

      return {
        intent: data.intent,
        confidence: data.confidence,
        reasoning: data.reasoning,
        shouldExecuteDirectly: data.shouldExecuteDirectly,
        shouldShowOptions: data.shouldShowOptions
      }
    } catch (error) {
      console.error('Intent classification error:', error)
      // Fallback to simple classification with response mode
      const message_lower = message.toLowerCase()
      const isJustBuildMode = responseMode === 'just-build'
      const shouldShowOptions = responseMode === 'show-options'
      
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

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return data.status === 'ok'
    } catch {
      return false
    }
  }
}

export const generationService = GenerationService.getInstance()