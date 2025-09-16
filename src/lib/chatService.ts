import { Artifact, ChatMessage, ReasoningStep } from '../types'
import { ThinkingStep } from '../components/Chat/CompactThinkingPanel'

// Phase events for the compact thinking panel
export type PhaseEvent = 
  | { type: 'phase_start'; phase: 'thinking' | 'generation' }
  | { type: 'phase_step'; stepId: string; label: string; status: ThinkingStep['status'] }
  | { type: 'phase_complete'; phase: 'thinking' | 'generation' }
  | { type: 'answer_chunk'; text: string }
  | { type: 'answer_complete'; fullAnswer: string }

interface ChatServiceOptions {
  onReasoningStep?: (step: ReasoningStep) => void
  onReasoningComplete?: (steps: ReasoningStep[]) => void
  onGenerationStart?: () => void
  onGenerationComplete?: (artifact: Artifact) => void
  onError?: (error: Error) => void
  
  // New compact thinking panel events
  onPhaseEvent?: (event: PhaseEvent) => void
}

export class ChatService {
  private baseUrl: string

  constructor() {
    // Always use relative paths - Vercel dev and production handle this automatically
    this.baseUrl = ''
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
      onError,
      onPhaseEvent
    } = options

    let reasoningSteps: ReasoningStep[] = []
    let artifact: Artifact | null = null
    let currentStepId: string | null = null
    let inReasoningPhase = true

    try {
      // Emit thinking phase start
      onPhaseEvent?.({ type: 'phase_start', phase: 'thinking' })

      console.log('🧠 Starting integrated reasoning and generation...')

      // Use enhanced generate API with reasoning enabled
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          framework: 'react',
          device: 'desktop',
          withReasoning: true
        })
      })

      if (!response.ok) {
        throw new Error(`Generation with reasoning failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'reasoning_step' && inReasoningPhase) {
                  const step: ReasoningStep = {
                    id: data.step.id || `step_${Date.now()}`,
                    type: data.step.type as ReasoningStep['type'],
                    content: data.step.content,
                    timestamp: data.step.timestamp || new Date().toISOString()
                  }

                  reasoningSteps.push(step)
                  onReasoningStep?.(step)

                  // Emit compact thinking panel events
                  const thinkingLabel = this.mapReasoningStepToThinkingLabel(step)
                  const stepId = `thinking_${step.id}`

                  // Complete previous step if exists
                  if (currentStepId) {
                    onPhaseEvent?.({
                      type: 'phase_step',
                      stepId: currentStepId,
                      label: '',
                      status: 'complete'
                    })
                  }

                  // Start new step
                  currentStepId = stepId
                  onPhaseEvent?.({
                    type: 'phase_step',
                    stepId,
                    label: thinkingLabel,
                    status: 'active'
                  })
                } else if (data.type === 'reasoning_complete') {
                  // Reasoning phase is complete
                  if (currentStepId) {
                    onPhaseEvent?.({
                      type: 'phase_step',
                      stepId: currentStepId,
                      label: '',
                      status: 'complete'
                    })
                  }

                  onReasoningComplete?.(reasoningSteps)
                  onPhaseEvent?.({ type: 'phase_complete', phase: 'thinking' })
                  console.log(`✅ Reasoning complete with ${reasoningSteps.length} steps`)

                  // Switch to generation phase
                  inReasoningPhase = false
                  console.log('⚡ Starting code generation...')
                  onGenerationStart?.()
                  onPhaseEvent?.({ type: 'phase_start', phase: 'generation' })

                  // Add generation step
                  const genStepId = 'gen_creating_files'
                  onPhaseEvent?.({
                    type: 'phase_step',
                    stepId: genStepId,
                    label: 'Generating React files',
                    status: 'active'
                  })
                  currentStepId = genStepId
                } else if (data.type === 'generation_complete' && data.artifact) {
                  // Successfully received the artifact
                  artifact = {
                    id: data.artifact.id || `artifact_${Date.now()}`,
                    projectId: data.artifact.projectId || 'default',
                    regionId: data.artifact.regionId || 'full-page',
                    files: data.artifact.files || {},
                    entry: data.artifact.entry || 'index.html',
                    metadata: data.artifact.metadata || {
                      device: 'desktop',
                      region: { start: { x: 0, y: 0 }, end: { x: 23, y: 19 } },
                      framework: 'react'
                    },
                    createdAt: data.artifact.createdAt || new Date().toISOString(),
                    author: data.artifact.author || 'ai-generator'
                  }

                  // Complete generation step
                  if (currentStepId) {
                    onPhaseEvent?.({
                      type: 'phase_step',
                      stepId: currentStepId,
                      label: 'Generating React files',
                      status: 'complete'
                    })
                  }

                  if (artifact) {
                    onGenerationComplete?.(artifact)
                  }
                  onPhaseEvent?.({ type: 'phase_complete', phase: 'generation' })
                  console.log('🚀 Code generation complete!')
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Unknown generation error')
                }
              } catch (e) {
                console.warn('Failed to parse response:', e)
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
      const response = await fetch(`${this.baseUrl}/api/intent`, {
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

  /**
   * Maps reasoning step types to user-friendly labels for the compact thinking panel
   */
  private mapReasoningStepToThinkingLabel(step: ReasoningStep): string {
    const labelMap: Record<ReasoningStep['type'], string[]> = {
      thought: [
        'Analyzing request',
        'Understanding context', 
        'Planning approach',
        'Considering options'
      ],
      action: [
        'Gathering information',
        'Processing requirements',
        'Checking resources',
        'Validating approach'
      ],
      observation: [
        'Reviewing findings',
        'Analyzing results', 
        'Evaluating options',
        'Assessing feasibility'
      ],
      final_answer: [
        'Finalizing response',
        'Preparing answer',
        'Completing analysis',
        'Ready to generate'
      ]
    }

    const labels = labelMap[step.type] || ['Processing']
    const contentWords = step.content.toLowerCase().split(' ')
    
    // Try to pick a more specific label based on content
    if (contentWords.includes('component') || contentWords.includes('react')) {
      return 'Planning React component'
    }
    if (contentWords.includes('website') || contentWords.includes('page')) {
      return 'Designing website structure'
    }
    if (contentWords.includes('analyze') || contentWords.includes('understand')) {
      return 'Understanding requirements'
    }
    if (contentWords.includes('generate') || contentWords.includes('create')) {
      return 'Preparing to generate'
    }
    
    // Return a random label from the type's set for variety
    return labels[Math.floor(Math.random() * labels.length)]
  }
}

export const chatService = new ChatService()