import { Artifact, ResponseMode } from '../types'
import { parseAIResponseWithReasoning } from '../lib/aiResponseParser'

// Always use relative API routes for Vercel deployment
const API_BASE_URL = '/api'

export interface GenerationOptions {
  device?: string
  framework?: string
}

// ReAct reasoning step types
export interface ReasoningStep {
  id: string
  type: 'thought' | 'action' | 'observation' | 'final_answer'
  content: string
  timestamp: string
  metadata: any
}

export interface ReActResult {
  success: boolean
  steps: ReasoningStep[]
  finalAnswer: string
  totalSteps: number
  executionTime: number
  artifact?: Artifact
}

export class GenerationService {
  private static instance: GenerationService
  
  static getInstance(): GenerationService {
    if (!GenerationService.instance) {
      GenerationService.instance = new GenerationService()
    }
    return GenerationService.instance
  }

  private async generateWithSecureAPI(prompt: string, options: GenerationOptions = {}): Promise<Artifact> {
    // Secure API generation using server-side AI calls
    const apiUrl = `${API_BASE_URL}/generate`
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          device: options.device || 'desktop',
          framework: options.framework || 'react'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let artifact: Artifact | undefined
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'completed' && data.artifact) {
                artifact = data.artifact
              }
            } catch (e) {
              // Continue processing other lines
            }
          }
        }
      }

      if (!artifact) {
        throw new Error('No artifact generated')
      }

      return artifact
    } catch (error) {
      console.error('Secure API generation failed:', error)
      throw error
    }
  }

  async generateWithReActReasoning(
    goal: string, 
    options: GenerationOptions & { 
      onStep?: (step: ReasoningStep) => void,
      stream?: boolean 
    } = {}
  ): Promise<ReActResult> {
    // Use secure ReAct reasoning API
    const apiUrl = `${API_BASE_URL}/think`
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          options: {
            ...options,
            stream: options.stream !== false // Default to streaming
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming reasoning response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const steps: ReasoningStep[] = []
      let finalResult: ReActResult | undefined
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'step' && options.onStep) {
                steps.push(data.step)
                options.onStep(data.step)
              } else if (data.type === 'completed') {
                finalResult = {
                  success: data.success || true,
                  steps: data.steps || steps,
                  finalAnswer: data.finalAnswer || 'Reasoning completed',
                  totalSteps: data.totalSteps || steps.length,
                  executionTime: Date.now(), // Approximate
                  artifact: data.artifact
                }
              }
            } catch (e) {
              // Continue processing other lines
            }
          }
        }
      }

      if (!finalResult) {
        // Fallback result if streaming didn't provide complete data
        finalResult = {
          success: true,
          steps,
          finalAnswer: steps.find(s => s.type === 'final_answer')?.content || 'Reasoning completed',
          totalSteps: steps.length,
          executionTime: Date.now(),
          artifact: undefined
        }
      }

      return finalResult
    } catch (error) {
      console.error('Secure ReAct reasoning failed:', error)
      throw error
    }
  }

  async generateWebsite(prompt: string, options: GenerationOptions = {}): Promise<Artifact> {
    // Use secure API routes for Vercel deployment
    return await this.generateWithSecureAPI(prompt, options)
  }

  async generateChatResponse(message: string, context?: {
    hasActiveCode?: boolean
    recentMessages?: string[]
    currentArtifacts?: number
    responseMode?: ResponseMode
  }): Promise<{ content: string; thinking?: string; reasoningSteps?: any[] }> {
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

      // Parse the AI response to extract thinking, content, and reasoning steps
      const parsed = parseAIResponseWithReasoning(data.response)
      return {
        content: parsed.content,
        thinking: parsed.thinking,
        reasoningSteps: parsed.reasoningSteps
      }
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