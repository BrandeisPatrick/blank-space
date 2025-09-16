/**
 * UI Summary Service - Creates user-friendly summaries of backend AI processes
 * This runs parallel to the internal AI pipeline to provide clean UI feedback
 */

export interface UISummaryEvent {
  type: 'phase_start' | 'phase_progress' | 'phase_complete' | 'phase_error'
  phase: 'analyzing' | 'planning' | 'generating' | 'finalizing'
  message: string
  progress?: number // 0-100
  timestamp: number
}

export class UISummaryService {
  private listeners: ((event: UISummaryEvent) => void)[] = []
  private currentPhase: UISummaryEvent['phase'] | null = null
  private phaseStartTime: number = 0

  constructor() {}

  /**
   * Subscribe to UI summary events
   */
  subscribe(callback: (event: UISummaryEvent) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  private emit(event: UISummaryEvent) {
    this.listeners.forEach(callback => callback(event))
  }

  /**
   * Start the UI summary pipeline for code generation
   */
  startGeneration(_prompt: string) {
    this.reset()
    
    // Phase 1: Analyzing
    this.startPhase('analyzing', 'Understanding your request...')
    
    // Simulate realistic timing for UI feedback
    setTimeout(() => {
      this.updatePhase('analyzing', 'Analyzing requirements', 50)
    }, 800)
    
    setTimeout(() => {
      this.completePhase('analyzing', 'Requirements understood')
      
      // Phase 2: Planning  
      this.startPhase('planning', 'Planning the solution...')
    }, 1600)
    
    setTimeout(() => {
      this.updatePhase('planning', 'Designing component structure', 60)
    }, 2400)
    
    setTimeout(() => {
      this.updatePhase('planning', 'Selecting optimal approach', 90)
    }, 3200)
    
    setTimeout(() => {
      this.completePhase('planning', 'Solution plan ready')
      
      // Phase 3: Generating
      this.startPhase('generating', 'Creating your React component...')
    }, 4000)
  }

  /**
   * Call this when the actual backend generation starts
   */
  onBackendGenerationStart() {
    if (this.currentPhase === 'generating') {
      this.updatePhase('generating', 'Writing component code', 30)
      
      setTimeout(() => {
        this.updatePhase('generating', 'Adding styling and interactions', 70)
      }, 1500)
      
      setTimeout(() => {
        this.updatePhase('generating', 'Finalizing file structure', 90)
      }, 2500)
    }
  }

  /**
   * Call this when backend generation completes successfully
   */
  onBackendGenerationComplete(fileCount: number) {
    this.completePhase('generating', `Generated ${fileCount} files`)
    
    // Phase 4: Finalizing
    this.startPhase('finalizing', 'Preparing your project...')
    
    setTimeout(() => {
      this.completePhase('finalizing', 'Your React component is ready!')
    }, 800)
  }

  /**
   * Call this when backend generation fails
   */
  onBackendGenerationError(error: string) {
    this.errorPhase(this.currentPhase || 'generating', error)
  }

  private startPhase(phase: UISummaryEvent['phase'], message: string) {
    this.currentPhase = phase
    this.phaseStartTime = Date.now()
    
    this.emit({
      type: 'phase_start',
      phase,
      message,
      progress: 0,
      timestamp: Date.now()
    })
  }

  private updatePhase(phase: UISummaryEvent['phase'], message: string, progress: number) {
    if (this.currentPhase !== phase) return
    
    this.emit({
      type: 'phase_progress', 
      phase,
      message,
      progress,
      timestamp: Date.now()
    })
  }

  private completePhase(phase: UISummaryEvent['phase'], message: string) {
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

  private errorPhase(phase: UISummaryEvent['phase'], message: string) {
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
    this.phaseStartTime = 0
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
        `Designing the ${componentType} architecture...`,
        'Planning component structure and data flow...',
        'Selecting optimal React patterns...'
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