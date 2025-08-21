import { create } from 'zustand'
import { AppState, StoreActions, GridRegion, Artifact, ChatMessage } from '../types'

interface AppStore extends AppState, StoreActions {
  prompt: string
  setPrompt: (prompt: string) => void
  gridModeEnabled: boolean
  setGridMode: (enabled: boolean) => void
  showChat: boolean
  showCode: boolean
  showPreview: boolean
  togglePanel: (panel: 'chat' | 'code' | 'preview') => void
}

export const useAppStore = create<AppStore>((set) => ({
  deviceId: 'desktop_1080p',
  gridVisible: false,
  selectedRegion: null,
  isGenerating: false,
  artifacts: [],
  currentArtifactId: null,
  chatMessages: [],
  prompt: '',
  gridModeEnabled: false,
  showChat: true,
  showCode: true,
  showPreview: true,

  setDevice: (deviceId: string) => 
    set({ deviceId, selectedRegion: null }),

  toggleGrid: () => 
    set((state) => ({ gridVisible: !state.gridVisible })),

  setSelectedRegion: (region: GridRegion | null) => 
    set({ selectedRegion: region }),

  setGenerating: (generating: boolean) => 
    set({ isGenerating: generating }),

  addArtifact: (artifact: Artifact) => 
    set((state) => ({ 
      artifacts: [...state.artifacts, artifact],
      currentArtifactId: artifact.id 
    })),

  setCurrentArtifact: (id: string | null) => 
    set({ currentArtifactId: id }),

  addChatMessage: (message: ChatMessage) => 
    set((state) => ({ 
      chatMessages: [...state.chatMessages, message] 
    })),

  clearChat: () => 
    set({ chatMessages: [] }),

  setPrompt: (prompt: string) => 
    set({ prompt }),

  setGridMode: (enabled: boolean) => 
    set({ gridModeEnabled: enabled, gridVisible: enabled }),

  togglePanel: (panel: 'chat' | 'code' | 'preview') => 
    set((state) => {
      // For mobile, ensure at least one panel is always visible
      const isMobile = window.innerWidth < 768
      
      if (isMobile) {
        // Turn off all panels, then turn on the selected one
        return {
          showChat: panel === 'chat',
          showCode: panel === 'code',
          showPreview: panel === 'preview'
        }
      } else {
        // Desktop behavior - toggle normally
        switch (panel) {
          case 'chat':
            return { showChat: !state.showChat }
          case 'code':
            return { showCode: !state.showCode }
          case 'preview':
            return { showPreview: !state.showPreview }
          default:
            return state
        }
      }
    })
}))