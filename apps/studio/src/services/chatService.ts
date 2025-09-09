import { Artifact, ChatMessage, ReasoningStep } from '../types'

interface ChatServiceOptions {
  onReasoningStep?: (step: ReasoningStep) => void
  onReasoningComplete?: (steps: ReasoningStep[]) => void
  onGenerationStart?: () => void
  onGenerationComplete?: (artifact: Artifact) => void
  onError?: (error: Error) => void
}

export class ChatService {
  private baseUrl: string

  constructor() {
    this.baseUrl = window.location.origin
  }

  /**
   * Complete AI generation pipeline: reasoning + code generation
   */
  async generateWithReasoning(
    prompt: string,
    options: ChatServiceOptions = {}
  ): Promise<{ reasoningSteps: ReasoningStep[]; artifact: Artifact | null }> {
    const {
      onReasoningStep,
      onReasoningComplete,
      onGenerationStart,
      onGenerationComplete,
      onError
    } = options

    let reasoningSteps: ReasoningStep[] = []
    let artifact: Artifact | null = null

    try {
      // Step 1: AI Reasoning Analysis
      console.log('🧠 Starting AI reasoning analysis...')
      
      const reasoningResponse = await fetch(`${this.baseUrl}/api/reasoning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!reasoningResponse.ok) {
        throw new Error(`Reasoning failed: ${reasoningResponse.status}`)
      }

      const reader = reasoningResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'reasoning_step') {
                  const step: ReasoningStep = {
                    id: data.step.id || `step_${Date.now()}`,
                    type: data.step.type as ReasoningStep['type'],
                    content: data.step.content,
                    timestamp: data.step.timestamp || new Date().toISOString()
                  }
                  
                  reasoningSteps.push(step)
                  onReasoningStep?.(step)
                }
              } catch (e) {
                console.warn('Failed to parse reasoning step:', e)
              }
            }
          }
        }
      }

      onReasoningComplete?.(reasoningSteps)
      console.log(`✅ Reasoning complete with ${reasoningSteps.length} steps`)

      // Step 2: Code Generation
      console.log('⚡ Starting code generation...')
      onGenerationStart?.()

      const generateResponse = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          framework: 'react',
          device: 'desktop',
          reasoning_steps: reasoningSteps // Pass reasoning context to generation
        })
      })

      if (!generateResponse.ok) {
        throw new Error(`Generation failed: ${generateResponse.status}`)
      }

      // Handle Server-Sent Events (SSE) response
      const reader = generateResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'completed' && data.artifact) {
                  // Successfully received the artifact
                  artifact = {
                    id: data.artifact.id || `artifact_${Date.now()}`,
                    title: data.artifact.title || 'Generated Component',
                    description: data.artifact.description || 'AI generated React component',
                    files: data.artifact.files || {},
                    createdAt: data.artifact.createdAt || Date.now()
                  }

                  onGenerationComplete?.(artifact)
                  console.log('🚀 Code generation complete!')
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Unknown generation error')
                }
              } catch (e) {
                console.warn('Failed to parse generation chunk:', e)
              }
            }
          }
        }
      }

      if (!artifact) {
        throw new Error('Generation completed but no artifact was received')
      }

    } catch (error) {
      console.error('Chat service error:', error)
      const errorObj = error instanceof Error ? error : new Error(String(error))
      onError?.(errorObj)
    }

    return { reasoningSteps, artifact }
  }

  /**
   * Simple chat response without code generation
   */
  async generateChatResponse(
    message: string,
    context: {
      hasActiveCode?: boolean
      recentMessages?: string[]
      currentArtifacts?: number
    } = {}
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context 
        })
      })

      if (!response.ok) {
        throw new Error(`Chat response failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        id: `msg_${Date.now()}_ai`,
        type: 'assistant',
        content: data.response || 'I understand. How can I help you build something?',
        thinking: data.thinking,
        reasoningSteps: data.reasoningSteps,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Chat response error:', error)
      
      // Fallback response
      return {
        id: `msg_${Date.now()}_ai`,
        type: 'assistant',
        content: "I'm having trouble connecting right now, but I'm here to help you build websites! What would you like to create?",
        timestamp: Date.now()
      }
    }
  }

  /**
   * Classify user intent for routing
   */
  async classifyIntent(
    message: string, 
    hasActiveCode: boolean = false
  ): Promise<{
    intent: 'generation' | 'modification' | 'explanation' | 'conversation'
    confidence: number
    reasoning: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/classify-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          hasActiveCode 
        })
      })

      if (!response.ok) {
        throw new Error(`Intent classification failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        intent: data.intent || 'conversation',
        confidence: data.confidence || 0.5,
        reasoning: data.reasoning || 'Default classification'
      }

    } catch (error) {
      console.error('Intent classification error:', error)
      
      // Fallback: simple keyword-based classification
      const lowerMessage = message.toLowerCase()
      
      if (lowerMessage.includes('build') || lowerMessage.includes('create') || lowerMessage.includes('make')) {
        return {
          intent: 'generation',
          confidence: 0.8,
          reasoning: 'Keywords suggest code generation request'
        }
      }
      
      if (hasActiveCode && (lowerMessage.includes('change') || lowerMessage.includes('modify') || lowerMessage.includes('add'))) {
        return {
          intent: 'modification',
          confidence: 0.7,
          reasoning: 'Keywords suggest code modification with existing code'
        }
      }
      
      return {
        intent: 'conversation',
        confidence: 0.6,
        reasoning: 'General conversation or unclear intent'
      }
    }
  }
}

export const chatService = new ChatService()