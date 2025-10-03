import { Artifact, ChatMessage, ReasoningStep } from '../types'
import { ThinkingStep } from '../components/Chat/CompactThinkingPanel'
import { memoryService } from './memoryService'
import { featurePlanningService, ProjectPlan } from './featurePlanningService'
import { BinaArtifact, BinaAction } from '../types/binaArtifact'
import { BinaArtifactParser } from './binaArtifactParser'
import { webContainerService, ActionExecutionResult } from './webContainerService'
import { addViteProjectFiles } from './projectTemplates'

// Phase events for the compact thinking panel
export type GenerationPhaseEvent =
  | { type: 'phase_start'; phase: 'thinking' | 'planning' | 'generation'; totalSteps?: number }
  | { type: 'phase_step'; stepId: string; label: string; status: ThinkingStep['status']; progress?: number }
  | { type: 'phase_progress'; phase: 'thinking' | 'planning' | 'generation'; progress: number; message?: string }
  | { type: 'phase_complete'; phase: 'thinking' | 'planning' | 'generation' }
  | { type: 'stream_start'; phase: 'thinking' | 'planning' | 'generation' }
  | { type: 'stream_progress'; bytesReceived: number; estimatedTotal?: number }
  | { type: 'answer_chunk'; text: string }
  | { type: 'answer_complete'; fullAnswer: string }
  | { type: 'planning_complete'; projectPlan: ProjectPlan }
  | { type: 'bina_action_start'; action: BinaAction }
  | { type: 'bina_action_progress'; action: BinaAction; message: string }
  | { type: 'bina_action_complete'; action: BinaAction; result: ActionExecutionResult }
  | { type: 'bina_artifact_complete'; artifact: BinaArtifact }

interface ChatServiceConfiguration {
  onReasoningStep?: (step: ReasoningStep) => void
  onReasoningComplete?: (steps: ReasoningStep[]) => void
  onPlanningComplete?: (projectPlan: ProjectPlan) => void
  onGenerationStart?: () => void
  onGenerationComplete?: (artifact: Artifact) => void
  onError?: (error: Error) => void

  // New compact thinking panel events
  onPhaseEvent?: (event: GenerationPhaseEvent) => void
}

export class ChatService {
  private baseUrl: string

  constructor() {
    // Use production API URL in development, relative paths in production
    this.baseUrl = import.meta.env.DEV
      ? 'https://blank-space-omega.vercel.app'
      : ''
  }

  /**
   * Complete AI generation pipeline: reasoning + feature planning + code generation
   */
  async generateWithReasoning(
    prompt: string,
    options: ChatServiceConfiguration = {}
  ): Promise<{ reasoningSteps: ReasoningStep[]; projectPlan?: ProjectPlan; artifact: Artifact | null }> {
    const {
      onReasoningStep,
      onReasoningComplete,
      onPlanningComplete,
      onGenerationStart,
      onGenerationComplete,
      onError,
      onPhaseEvent
    } = options

    let reasoningSteps: ReasoningStep[] = []
    let projectPlan: ProjectPlan | undefined = undefined
    let artifact: Artifact | null = null
    let currentStepId: string | null = null
    let inReasoningPhase = true
    let bytesReceived = 0
    let reasoningStepCount = 0
    let estimatedReasoningSteps = 5 // Default estimate, can be updated

    try {
      // Emit thinking phase start
      onPhaseEvent?.({ type: 'phase_start', phase: 'thinking', totalSteps: estimatedReasoningSteps })
      onPhaseEvent?.({ type: 'stream_start', phase: 'thinking' })


      // Get session memory context
      const sessionContext = memoryService.getSessionContext()
      const enhancedPrompt = sessionContext
        ? `${sessionContext}\n\n--- Current Request ---\n${prompt}`
        : prompt

      // Use enhanced generate API with reasoning enabled
      const requestBody = {
        prompt: enhancedPrompt,
        framework: 'react',
        device: 'desktop',
        withReasoning: true,
        sessionContext: sessionContext || undefined,
        userPreferences: memoryService.getUserPreferences(),
        projectPlan: projectPlan || undefined
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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

          // Track bytes received for progress
          bytesReceived += value.length
          onPhaseEvent?.({ type: 'stream_progress', bytesReceived })

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
                  reasoningStepCount++
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
                      status: 'complete',
                      progress: 100
                    })
                  }

                  // Calculate progress (rough estimate)
                  const progressPercent = Math.min(90, (reasoningStepCount / estimatedReasoningSteps) * 80)

                  // Emit overall phase progress
                  onPhaseEvent?.({
                    type: 'phase_progress',
                    phase: 'thinking',
                    progress: progressPercent,
                    message: thinkingLabel
                  })

                  // Start new step
                  currentStepId = stepId
                  onPhaseEvent?.({
                    type: 'phase_step',
                    stepId,
                    label: thinkingLabel,
                    status: 'active',
                    progress: 0
                  })
                } else if (data.type === 'reasoning_complete') {
                  // Reasoning phase is complete
                  if (currentStepId) {
                    onPhaseEvent?.({
                      type: 'phase_step',
                      stepId: currentStepId,
                      label: '',
                      status: 'complete',
                      progress: 100
                    })
                  }

                  // Final thinking progress
                  onPhaseEvent?.({
                    type: 'phase_progress',
                    phase: 'thinking',
                    progress: 100,
                    message: 'Reasoning complete'
                  })

                  onReasoningComplete?.(reasoningSteps)
                  onPhaseEvent?.({ type: 'phase_complete', phase: 'thinking' })

                  // Start feature planning phase
                  onPhaseEvent?.({ type: 'phase_start', phase: 'planning', totalSteps: 1 })

                  const planningStepId = 'plan_comprehensive'
                  onPhaseEvent?.({
                    type: 'phase_step',
                    stepId: planningStepId,
                    label: 'Planning v1 features with ChatGPT',
                    status: 'active',
                    progress: 0
                  })
                  currentStepId = planningStepId

                  onPhaseEvent?.({
                    type: 'phase_progress',
                    phase: 'planning',
                    progress: 30,
                    message: 'Analyzing app requirements with ChatGPT'
                  })

                  try {
                    // Use feature planning service to analyze and plan features
                    projectPlan = await featurePlanningService.analyzeAndPlanFeatures(prompt)

                    // Update progress as we work through the planning
                    onPhaseEvent?.({
                      type: 'phase_progress',
                      phase: 'planning',
                      progress: 70,
                      message: `Identified ${projectPlan.features.length} v1 features`
                    })

                    onPhaseEvent?.({
                      type: 'phase_progress',
                      phase: 'planning',
                      progress: 90,
                      message: `Tech stack: ${projectPlan.techStack.frontend.join(', ')}`
                    })

                    // Complete the single planning step
                    onPhaseEvent?.({
                      type: 'phase_step',
                      stepId: planningStepId,
                      label: 'Planning v1 features with ChatGPT',
                      status: 'complete',
                      progress: 100
                    })

                    onPhaseEvent?.({
                      type: 'phase_progress',
                      phase: 'planning',
                      progress: 100,
                      message: 'Project plan ready for review'
                    })

                    onPlanningComplete?.(projectPlan)
                    onPhaseEvent?.({ type: 'planning_complete', projectPlan })
                    onPhaseEvent?.({ type: 'phase_complete', phase: 'planning' })

                  } catch (planningError) {
                    // If planning fails, continue with generation anyway
                    if (currentStepId) {
                      onPhaseEvent?.({
                        type: 'phase_step',
                        stepId: currentStepId,
                        label: 'Planning (fallback)',
                        status: 'complete',
                        progress: 100
                      })
                    }
                    onPhaseEvent?.({ type: 'phase_complete', phase: 'planning' })
                  }

                  // Switch to generation phase
                  inReasoningPhase = false
                  onGenerationStart?.()
                  onPhaseEvent?.({ type: 'phase_start', phase: 'generation', totalSteps: 3 })
                  onPhaseEvent?.({ type: 'stream_start', phase: 'generation' })

                  // Add generation step
                  const genStepId = 'gen_creating_files'
                  onPhaseEvent?.({
                    type: 'phase_step',
                    stepId: genStepId,
                    label: 'Generating React files',
                    status: 'active',
                    progress: 0
                  })
                  currentStepId = genStepId

                  // Track generation progress
                  onPhaseEvent?.({
                    type: 'phase_progress',
                    phase: 'generation',
                    progress: 10,
                    message: 'Starting file generation'
                  })
                } else if (data.type === 'generation_complete' && data.artifact) {
                  // Successfully received the artifact
                  // Enhance files with Vite boilerplate (index.html, main.tsx, package.json, etc.)
                  const enhancedFiles = addViteProjectFiles(data.artifact.files || {})

                  artifact = {
                    id: data.artifact.id || `artifact_${Date.now()}`,
                    projectId: data.artifact.projectId || 'default',
                    regionId: data.artifact.regionId || 'full-page',
                    files: enhancedFiles,
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
                      status: 'complete',
                      progress: 100
                    })
                  }

                  // Final generation progress
                  onPhaseEvent?.({
                    type: 'phase_progress',
                    phase: 'generation',
                    progress: 100,
                    message: `Generated ${Object.keys(data.artifact.files || {}).length} files`
                  })

                  if (artifact) {
                    onGenerationComplete?.(artifact)
                  }
                  onPhaseEvent?.({ type: 'phase_complete', phase: 'generation' })
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Unknown generation error')
                }
              } catch (e) {
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

    return { reasoningSteps, projectPlan, artifact }
  }

  /**
   * Generate with BinaArtifact streaming and action execution
   */
  async generateWithBinaArtifacts(
    prompt: string,
    options: ChatServiceConfiguration & {
      existingArtifactId?: string
      existingFiles?: Record<string, string>
      modifiedFiles?: Record<string, any>
    } = {}
  ): Promise<{ artifact: BinaArtifact | null }> {
    const { onPhaseEvent, existingArtifactId, existingFiles, modifiedFiles } = options

    let finalArtifact: BinaArtifact | null = null

    try {
      // Start generation phase
      onPhaseEvent?.({ type: 'phase_start', phase: 'generation' })
      onPhaseEvent?.({ type: 'stream_start', phase: 'generation' })

      // Prepare context with existing files and modifications
      const context = {
        existingArtifactId,
        existingFiles,
        modifiedFiles
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          framework: 'react',
          device: 'desktop',
          useBinaFormat: true,  // Request BinaArtifact format
          context
        })
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      // Initialize BinaArtifact parser with event callbacks
      const parser = new BinaArtifactParser((event) => {
        if (event.type === 'action_start') {
          onPhaseEvent?.({ type: 'bina_action_start', action: event.action })

          // Execute action immediately
          webContainerService.executeAction(
            event.action,
            (message) => {
              onPhaseEvent?.({
                type: 'bina_action_progress',
                action: event.action,
                message
              })
            }
          ).then((result) => {
            onPhaseEvent?.({
              type: 'bina_action_complete',
              action: event.action,
              result
            })
          }).catch((error) => {
            console.error('Action execution failed:', error)
          })
        } else if (event.type === 'artifact_complete') {
          finalArtifact = event.artifact
          onPhaseEvent?.({ type: 'bina_artifact_complete', artifact: event.artifact })
        }
      })

      // Stream and parse response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Handle generation chunks - parse BinaArtifact XML incrementally
              if (data.type === 'generation_chunk' && data.chunk) {
                parser.parseChunk(data.chunk)
              }
            } catch (e) {
              // Continue if parsing fails
            }
          }
        }
      }

      // Finalize parsing
      const artifact = parser.finalize()
      if (artifact) {
        finalArtifact = artifact
      }

      onPhaseEvent?.({ type: 'phase_complete', phase: 'generation' })

    } catch (error) {
      console.error('BinaArtifact generation error:', error)
      options.onError?.(error instanceof Error ? error : new Error(String(error)))
    }

    return { artifact: finalArtifact }
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
      // Include session memory in chat context
      const sessionContext = memoryService.getSessionContext()
      const enhancedContext = {
        ...context,
        sessionMemory: sessionContext,
        userPreferences: memoryService.getUserPreferences()
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: enhancedContext
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
   * Multi-stage generation: Plan -> Generate files one by one
   */
  async generateWithMultiStage(
    prompt: string,
    options: ChatServiceConfiguration = {}
  ): Promise<{ projectPlan: any; files: Record<string, string>; artifact: BinaArtifact | null }> {
    const { onPhaseEvent, onError } = options
    let files: Record<string, string> = {}
    let artifact: BinaArtifact | null = null

    try {
      // Phase 1: Project Planning
      onPhaseEvent?.({ type: 'phase_start', phase: 'planning' })
      onPhaseEvent?.({
        type: 'phase_progress',
        phase: 'planning',
        progress: 10,
        message: 'Analyzing project requirements'
      })

      const planResponse = await fetch(`${this.baseUrl}/api/plan-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework: 'react' })
      })

      if (!planResponse.ok) {
        throw new Error(`Project planning failed: ${planResponse.status}`)
      }

      const { plan: projectPlan } = await planResponse.json()

      onPhaseEvent?.({
        type: 'phase_progress',
        phase: 'planning',
        progress: 100,
        message: `Planned ${projectPlan.files.length} files`
      })
      onPhaseEvent?.({ type: 'phase_complete', phase: 'planning' })

      // Phase 2: File Generation
      onPhaseEvent?.({ type: 'phase_start', phase: 'generation', totalSteps: projectPlan.files.length })

      const previousFiles: Array<{ path: string; content: string }> = []

      for (let i = 0; i < projectPlan.files.length; i++) {
        const file = projectPlan.files[i]
        const progress = ((i + 1) / projectPlan.files.length) * 100

        onPhaseEvent?.({
          type: 'phase_step',
          stepId: `gen_${file.path}`,
          label: `Generating ${file.path}`,
          status: 'active',
          progress: 0
        })

        onPhaseEvent?.({
          type: 'phase_progress',
          phase: 'generation',
          progress: progress * 0.8, // 80% for generation
          message: `Generating ${file.path}`
        })

        // Generate individual file
        const fileResponse = await fetch(`${this.baseUrl}/api/generate-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file,
            previousFiles,
            framework: projectPlan.framework || 'react',
            typescript: projectPlan.typescript !== false
          })
        })

        if (!fileResponse.ok) {
          throw new Error(`File generation failed for ${file.path}`)
        }

        // Read SSE stream
        const reader = fileResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fileContent = ''

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
                  if (data.type === 'chunk') {
                    fileContent += data.content
                  } else if (data.type === 'complete') {
                    fileContent = data.content
                  }
                } catch (e) {
                  // Continue on parse error
                }
              }
            }
          }
        }

        files[file.path] = fileContent
        previousFiles.push({ path: file.path, content: fileContent })

        onPhaseEvent?.({
          type: 'phase_step',
          stepId: `gen_${file.path}`,
          label: `Generated ${file.path}`,
          status: 'complete',
          progress: 100
        })
      }

      onPhaseEvent?.({
        type: 'phase_progress',
        phase: 'generation',
        progress: 100,
        message: `Generated ${Object.keys(files).length} files`
      })

      // Enhance files with Vite boilerplate (index.html, main.tsx, package.json, etc.)
      const enhancedFiles = addViteProjectFiles(files)

      // Create BinaArtifact from generated files
      artifact = {
        id: `artifact_${Date.now()}`,
        title: projectPlan.name || 'Generated Project',
        files: enhancedFiles,
        actions: [],
        modifiedFiles: {},
        shellHistory: [],
        serverProcess: null,
        projectId: 'default',
        regionId: 'full-page',
        entry: 'index.html',
        metadata: {
          framework: projectPlan.framework,
          typescript: projectPlan.typescript,
          device: 'desktop'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (artifact) {
        onPhaseEvent?.({ type: 'bina_artifact_complete', artifact })
      }
      onPhaseEvent?.({ type: 'phase_complete', phase: 'generation' })

      return { projectPlan, files, artifact }

    } catch (error) {
      console.error('Multi-stage generation error:', error)
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return { projectPlan: null, files, artifact: null }
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

    if (contentWords.includes('component') || contentWords.includes('react')) {
      // Vary the label based on step type to avoid duplicates
      switch (step.type) {
        case 'thought': return 'Analyzing React requirements'
        case 'action': return 'Planning React component'
        case 'observation': return 'Reviewing component design'
        case 'final_answer': return 'Finalizing React structure'
        default: return 'Planning React component'
      }
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

    // Return a deterministic label based on step type to avoid randomness
    return labels[0] // Use first label from type for consistency
  }
}

export const chatService = new ChatService()
