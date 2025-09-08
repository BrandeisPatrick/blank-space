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

// Mock types since we don't have the grid-engine package for deployment
export interface DevicePreset {
  id: string
  name: string
  width: number
  height: number
}

export interface GridPosition {
  x: number
  y: number
}

export interface GridRegion {
  start: GridPosition
  end: GridPosition
}

export interface GridBounds {
  width: number
  height: number
}

export interface GridMetrics {
  cellSize: number
  gutter: number
}

export interface RegionMetrics {
  width: number
  height: number
}

export interface Artifact {
  id: string
  projectId: string
  regionId: string
  files: Record<string, string>
  entry: string
  metadata: {
    device: string
    region: GridRegion
    framework?: string
    dependencies?: string[]
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

export const RESPONSE_MODES: Record<ResponseMode, ResponseModeConfig> = {
  'just-build': {
    id: 'just-build',
    label: 'Just Build It',
    icon: '🔧',
    description: 'Generate code directly with minimal explanation',
    behavior: {
      skipExplanations: true,
      showAlternatives: false,
      askForConfirmation: false,
      verboseResponses: false
    }
  },
  'show-options': {
    id: 'show-options',
    label: 'Show Options',
    icon: '💡',
    description: 'Provide suggestions and alternatives before implementing',
    behavior: {
      skipExplanations: false,
      showAlternatives: true,
      askForConfirmation: true,
      verboseResponses: false
    }
  },
  'explain-first': {
    id: 'explain-first',
    label: 'Explain First',
    icon: '❓',
    description: 'Give detailed explanations before taking action',
    behavior: {
      skipExplanations: false,
      showAlternatives: true,
      askForConfirmation: true,
      verboseResponses: true
    }
  }
}

export interface AppState {
  deviceId: string
  gridVisible: boolean
  selectedRegion: GridRegion | null
  isGenerating: boolean
  artifacts: Artifact[]
  currentArtifactId: string | null
  chatMessages: ChatMessage[]
  responseMode: ResponseMode
}

export interface StoreActions {
  setDevice: (deviceId: string) => void
  toggleGrid: () => void
  setSelectedRegion: (region: GridRegion | null) => void
  setGenerating: (generating: boolean) => void
  addArtifact: (artifact: Artifact) => void
  updateArtifact: (id: string, files: Record<string, string>) => void
  setCurrentArtifact: (id: string | null) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  addTestMessageWithThinking: () => void
  setResponseMode: (mode: ResponseMode) => void
}

