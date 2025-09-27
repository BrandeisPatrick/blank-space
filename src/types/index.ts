export interface ReasoningStep {
  id: string
  type: 'thought' | 'action' | 'observation' | 'final_answer'
  content: string
  timestamp: string
  metadata?: any
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
  artifactId?: string
  thinking?: string
  reasoningSteps?: ReasoningStep[]
}


export interface Artifact {
  id: string
  projectId: string
  regionId: string
  files: Record<string, string>
  entry: string
  metadata: {
    device: string
    framework?: string
    dependencies?: string[]
    projectType?: 'react' | 'vanilla' | 'vue' | 'angular'
    template?: string
    isReact?: boolean
  }
  createdAt: string
  author?: string
}


export type ResponseMode = 'just-build' | 'show-options' | 'explain-first'

export interface ResponseModeConfig {
  id: ResponseMode
  label: string
  icon: string
  description: string
  behavior: {
    skipExplanations: boolean
    showAlternatives: boolean
    askForConfirmation: boolean
    verboseResponses: boolean
  }
}



