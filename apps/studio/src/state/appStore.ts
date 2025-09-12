import { create } from 'zustand'
import { AppState, StoreActions, GridRegion, Artifact, ChatMessage, ResponseMode } from '../types'
import { VirtualFileSystem } from '../utils/vfs'

interface AppStore extends AppState, StoreActions {
  prompt: string
  setPrompt: (prompt: string) => void
  gridModeEnabled: boolean
  setGridMode: (enabled: boolean) => void
  showChat: boolean
  showCode: boolean
  showPreview: boolean
  togglePanel: (panel: 'chat' | 'code' | 'preview') => void
  
  // VFS Management
  vfsMap: Map<string, VirtualFileSystem>
  getVFS: (artifactId: string) => VirtualFileSystem
  initializeVFS: (artifactId: string, files?: Record<string, string>) => VirtualFileSystem
  destroyVFS: (artifactId: string) => void
}

// Load response mode from localStorage with fallback
const getStoredResponseMode = (): ResponseMode => {
  try {
    const stored = localStorage.getItem('responseMode')
    if (stored && ['just-build', 'show-options', 'explain-first'].includes(stored)) {
      return stored as ResponseMode
    }
  } catch (error) {
    console.warn('Failed to load response mode from localStorage:', error)
  }
  return 'show-options' // Default for new users
}

export const useAppStore = create<AppStore>((set, get) => ({
  deviceId: 'desktop_1080p',
  gridVisible: false,
  selectedRegion: null,
  isGenerating: false,
  artifacts: [],
  currentArtifactId: null,
  chatMessages: [],
  responseMode: getStoredResponseMode(),
  prompt: '',
  gridModeEnabled: false,
  showChat: true,
  showCode: true,
  showPreview: true,
  
  // VFS Management
  vfsMap: new Map<string, VirtualFileSystem>(),

  getVFS: (artifactId: string) => {
    const state = get()
    let vfs = state.vfsMap.get(artifactId)
    
    if (!vfs) {
      vfs = new VirtualFileSystem()
      state.vfsMap.set(artifactId, vfs)
    }
    
    return vfs
  },

  initializeVFS: (artifactId: string, files?: Record<string, string>) => {
    const state = get()
    const vfs = new VirtualFileSystem()
    
    if (files) {
      vfs.import(files)
    }
    
    state.vfsMap.set(artifactId, vfs)
    return vfs
  },

  destroyVFS: (artifactId: string) => {
    const state = get()
    state.vfsMap.delete(artifactId)
  },

  setDevice: (deviceId: string) => 
    set({ deviceId, selectedRegion: null }),

  toggleGrid: () => 
    set((state) => ({ gridVisible: !state.gridVisible })),

  setSelectedRegion: (region: GridRegion | null) => 
    set({ selectedRegion: region }),

  setGenerating: (generating: boolean) => 
    set({ isGenerating: generating }),

  addArtifact: (artifact: Artifact) => {
    const state = get()
    
    // Initialize VFS for this artifact
    const vfs = state.initializeVFS(artifact.id, artifact.files)
    
    set((state) => ({ 
      artifacts: [...state.artifacts, artifact],
      currentArtifactId: artifact.id 
    }))
  },

  updateArtifact: (id: string, files: Record<string, string>) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === id ? { ...artifact, files } : artifact
      )
    })),

  setCurrentArtifact: (id: string | null) => 
    set({ currentArtifactId: id }),

  addChatMessage: (message: ChatMessage) => 
    set((state) => ({ 
      chatMessages: [...state.chatMessages, message] 
    })),

  clearChat: () => 
    set({ chatMessages: [] }),

  // Test method to add message with thinking and ReAct reasoning
  addTestMessageWithThinking: () => 
    set((state) => ({
      chatMessages: [...state.chatMessages, {
        id: `test_thinking_${Date.now()}`,
        type: 'assistant' as const,
        content: '✅ **React Component Generated!**\n\nI\'ve successfully created a functional React component for: "build a todo list"\n\n**Features Generated:**\n• Interactive UI with modern React hooks\n• Proper state management and event handling  \n• Responsive design with clean styling\n• Production-ready code structure',
        thinking: 'Let me analyze this request step by step and generate the appropriate component.',
        reasoningSteps: [
          {
            id: 'step_1_thought',
            type: 'thought' as const,
            content: 'I need to analyze this request: "build a todo list". Let me break down what the user wants and determine the best approach to create a functional React component.',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_2_action',
            type: 'action' as const,
            content: 'Based on my analysis, I\'ll create a React component using X.AI Grok for fast code generation. I\'m generating functional code with proper state management and interactive features...',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_3_observation',
            type: 'observation' as const,
            content: 'Generated component structure, but encountered some issues with code generation. Providing fallback solution.',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_4_final_answer',
            type: 'final_answer' as const,
            content: 'Successfully created a functional React component with interactive UI, proper state management, and responsive design. The component is production-ready and uses modern React patterns.',
            timestamp: new Date().toISOString(),
          }
        ],
        timestamp: Date.now()
      }]
    })),

  setResponseMode: (mode: ResponseMode) => {
    // Persist to localStorage
    try {
      localStorage.setItem('responseMode', mode)
    } catch (error) {
      console.warn('Failed to save response mode to localStorage:', error)
    }
    set({ responseMode: mode })
  },

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
    }),

  // Enhanced file operations using VFS
  createFile: (artifactId: string, filePath: string, content: string = '') => {
    const state = get()
    const vfs = state.getVFS(artifactId)
    
    vfs.writeFile(filePath, content)
    
    // Update artifact files from VFS
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: vfs.export() }
          : artifact
      )
    }))
  },

  createFolder: (artifactId: string, folderPath: string) => {
    const state = get()
    const vfs = state.getVFS(artifactId)
    
    // Create a .gitkeep file to represent the folder
    vfs.writeFile(`${folderPath}/.gitkeep`, '# This file keeps the folder in version control')
    
    // Update artifact files from VFS
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: vfs.export() }
          : artifact
      )
    }))
  },

  deleteFile: (artifactId: string, filePath: string) => {
    const state = get()
    const vfs = state.getVFS(artifactId)
    
    vfs.unlink(filePath)
    
    // Update artifact files from VFS
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: vfs.export() }
          : artifact
      )
    }))
  },

  renameFile: (artifactId: string, oldPath: string, newName: string) => {
    const state = get()
    const vfs = state.getVFS(artifactId)
    
    // Get the old file content
    const oldFile = vfs.readFile(oldPath)
    if (oldFile) {
      // Create new path
      const pathParts = oldPath.split('/')
      const newPath = [...pathParts.slice(0, -1), newName].join('/')
      
      // Write to new location and delete old
      vfs.writeFile(newPath, oldFile.content)
      vfs.unlink(oldPath)
      
      // Update artifact files from VFS
      set((state) => ({
        artifacts: state.artifacts.map(artifact =>
          artifact.id === artifactId
            ? { ...artifact, files: vfs.export() }
            : artifact
        )
      }))
    }
  },

  updateFileContent: (artifactId: string, filePath: string, content: string) => {
    const state = get()
    const vfs = state.getVFS(artifactId)
    
    vfs.writeFile(filePath, content)
    
    // Update artifact files from VFS
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: vfs.export() }
          : artifact
      )
    }))
  }
}))