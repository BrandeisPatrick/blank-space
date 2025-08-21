export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
  artifactId?: string
}

import type { DevicePreset, GridPosition, GridRegion, GridBounds, GridMetrics, RegionMetrics } from '@ui-grid-ai/grid-engine'
import type { Artifact } from '@ui-grid-ai/codegen-prompts/src/types'

export interface AppState {
  deviceId: string
  gridVisible: boolean
  selectedRegion: GridRegion | null
  isGenerating: boolean
  artifacts: Artifact[]
  currentArtifactId: string | null
  chatMessages: ChatMessage[]
}

export interface StoreActions {
  setDevice: (deviceId: string) => void
  toggleGrid: () => void
  setSelectedRegion: (region: GridRegion | null) => void
  setGenerating: (generating: boolean) => void
  addArtifact: (artifact: Artifact) => void
  setCurrentArtifact: (id: string | null) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

export type { DevicePreset, GridPosition, GridRegion, GridBounds, GridMetrics, RegionMetrics, Artifact }