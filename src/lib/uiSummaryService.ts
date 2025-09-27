/**
 * UI Summary Service - Creates user-friendly summaries of backend AI processes
 * This service now operates purely based on real backend events from ChatService
 */

export interface UserInterfaceProgressEvent {
  type: 'phase_start' | 'phase_progress' | 'phase_complete' | 'phase_error'
  phase: 'analyzing' | 'planning' | 'generating' | 'finalizing'
  message: string
  progress?: number // 0-100
  timestamp: number
  realProgress?: boolean // Indicates if this is based on real backend progress
}

export class UISummaryService {
  private listeners: ((event: UserInterfaceProgressEvent) => void)[] = []
  private currentPhase: UserInterfaceProgressEvent['phase'] | null = null
  private isRealProgressMode: boolean = false

  constructor() {}

  /**
   * Subscribe to UI summary events
   */
  subscribe(callback: (event: UserInterfaceProgressEvent) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  private emit(event: UserInterfaceProgressEvent) {
    this.listeners.forEach(callback => callback(event))
  }

  /**
   * Start the UI summary pipeline for code generation
   * This now only initializes the service and waits for real backend events
   */
  startGeneration(_prompt: string) {
    this.reset()
    this.isRealProgressMode = true

    // The actual progress will be driven by real ChatService events
    // No more setTimeout or hardcoded delays!
  }

  /**
   * Handle real progress events from ChatService
   */
  onChatServicePhaseEvent(chatEvent: any) {
    if (!this.isRealProgressMode) return

    // Map ChatService phases to UI phases
    const phaseMap: Record<string, UserInterfaceProgressEvent['phase']> = {
      thinking: 'analyzing',
      planning: 'planning',
      generation: 'generating'
    }

    switch (chatEvent.type) {
      case 'phase_start':
        const startPhase = phaseMap[chatEvent.phase]
        if (startPhase) {
          this.startPhase(startPhase, this.getPhaseStartMessage(startPhase))
        }
        break

      case 'phase_progress':
        const progressPhase = phaseMap[chatEvent.phase]
        if (progressPhase && this.currentPhase === progressPhase) {
          this.updatePhase(
            progressPhase,
            chatEvent.message || this.getProgressMessage(progressPhase, chatEvent.progress),
            chatEvent.progress
          )
        }
        break

      case 'phase_complete':
        const completePhase = phaseMap[chatEvent.phase]
        if (completePhase && this.currentPhase === completePhase) {
          this.completePhase(completePhase, this.getPhaseCompleteMessage(completePhase))
        }
        break

      case 'phase_step':
        // Handle individual step updates
        if (chatEvent.status === 'active' && chatEvent.label) {
          const stepPhase = phaseMap[chatEvent.phase] || this.currentPhase
          if (stepPhase) {
            this.updatePhase(stepPhase, chatEvent.label, chatEvent.progress)
          }
        }
        break
    }
  }


  onBackendGenerationError(error: string) {
    this.errorPhase(this.currentPhase || 'generating', error)
  }

  private startPhase(phase: UserInterfaceProgressEvent['phase'], message: string) {
    this.currentPhase = phase
    
    this.emit({
      type: 'phase_start',
      phase,
      message,
      progress: 0,
      timestamp: Date.now()
    })
  }

  private updatePhase(phase: UserInterfaceProgressEvent['phase'], message: string, progress?: number) {
    if (this.currentPhase !== phase) return

    this.emit({
      type: 'phase_progress',
      phase,
      message,
      progress: progress || 0,
      timestamp: Date.now(),
      realProgress: this.isRealProgressMode
    })
  }

  private completePhase(phase: UserInterfaceProgressEvent['phase'], message: string) {
    if (this.currentPhase !== phase) return
    
    this.emit({
      type: 'phase_complete',
      phase,
      message,
      progress: 100,
      timestamp: Date.now()
    })
    
    this.currentPhase = null
  }

  private errorPhase(phase: UserInterfaceProgressEvent['phase'], message: string) {
    this.emit({
      type: 'phase_error',
      phase,
      message,
      progress: 0,
      timestamp: Date.now()
    })
    
    this.currentPhase = null
  }

  private reset() {
    this.currentPhase = null
    this.isRealProgressMode = false
  }

  /**
   * Helper methods for generating contextual messages
   */
  private getPhaseStartMessage(phase: UserInterfaceProgressEvent['phase']): string {
    const messages = {
      analyzing: 'Understanding your request...',
      planning: 'Planning v1 features with ChatGPT...',
      generating: 'Creating your React component...',
      finalizing: 'Preparing your project...'
    }
    return messages[phase] || 'Processing...'
  }

  private getProgressMessage(phase: UserInterfaceProgressEvent['phase'], progress: number): string {
    const progressMessages = {
      analyzing: progress < 50 ? 'Analyzing requirements' : 'Understanding context',
      planning: progress < 40 ? 'Analyzing app requirements' : progress < 80 ? 'Identifying v1 features' : 'Selecting modern tech stack',
      generating: progress < 30 ? 'Writing component code' : progress < 70 ? 'Adding styling and interactions' : 'Finalizing file structure',
      finalizing: 'Optimizing generated code'
    }
    return progressMessages[phase] || 'Processing...'
  }

  private getPhaseCompleteMessage(phase: UserInterfaceProgressEvent['phase']): string {
    const messages = {
      analyzing: 'Requirements understood',
      planning: 'V1 features planned',
      generating: 'React component generated',
      finalizing: 'Your project is ready!'
    }
    return messages[phase] || 'Phase complete'
  }

  /**
   * Smart message generator based on prompt analysis
   */
  generateContextualMessages(prompt: string): {
    analyzing: string[]
    planning: string[]
    generating: string[]
    finalizing: string[]
  } {
    const lowerPrompt = prompt.toLowerCase()
    
    // Detect component type
    const isForm = lowerPrompt.includes('form') || lowerPrompt.includes('input')
    const isNavigation = lowerPrompt.includes('nav') || lowerPrompt.includes('menu')
    const isChart = lowerPrompt.includes('chart') || lowerPrompt.includes('graph')
    const isList = lowerPrompt.includes('list') || lowerPrompt.includes('todo')
    
    let componentType = 'component'
    if (isForm) componentType = 'form'
    else if (isNavigation) componentType = 'navigation'
    else if (isChart) componentType = 'chart' 
    else if (isList) componentType = 'list'
    
    return {
      analyzing: [
        `Analyzing your ${componentType} requirements...`,
        'Understanding the desired functionality...',
        'Identifying key features and interactions...'
      ],
      planning: [
        `Analyzing ${componentType} requirements with ChatGPT...`,
        'Identifying essential v1 features...',
        'Selecting modern tech stack and UI frameworks...'
      ],
      generating: [
        `Creating your React ${componentType}...`,
        'Writing component logic and styling...',
        'Adding interactive features...',
        'Structuring project files...'
      ],
      finalizing: [
        'Optimizing generated code...',
        'Preparing project structure...',
        'Your component is ready!'
      ]
    }
  }
}

export const uiSummaryService = new UISummaryService()
