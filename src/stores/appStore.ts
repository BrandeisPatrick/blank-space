import { create } from 'zustand'
import { Artifact, ChatMessage, ResponseMode } from '../types'
import { BinaArtifact, BinaAction } from '../types/binaArtifact'

interface AppStore {
  // Core app state
  isGenerating: boolean
  artifacts: BinaArtifact[]
  currentArtifactId: string | null
  chatMessages: ChatMessage[]
  responseMode: ResponseMode

  // UI state for mobile/desktop
  showChat: boolean
  showCode: boolean
  showPreview: boolean

  // Actions - BinaArtifact support
  setGenerating: (generating: boolean) => void
  addArtifact: (artifact: Artifact) => void
  upsertBinaArtifact: (artifact: BinaArtifact) => void
  updateArtifact: (id: string, files: Record<string, string>) => void
  addActionToArtifact: (artifactId: string, action: BinaAction) => void
  setCurrentArtifact: (id: string | null) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  setResponseMode: (mode: ResponseMode) => void
  togglePanel: (panel: 'chat' | 'code' | 'preview') => void

  // File operations
  createFile: (artifactId: string, filePath: string, content?: string) => void
  createFolder: (artifactId: string, folderPath: string) => void
  deleteFile: (artifactId: string, filePath: string) => void
  renameFile: (artifactId: string, oldPath: string, newName: string) => void
  updateFileContent: (artifactId: string, filePath: string, content: string) => void
  trackFileModification: (artifactId: string, filePath: string, originalContent: string, modifiedContent: string) => void
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

export const useAppStore = create<AppStore>((set) => ({
  // Core app state
  isGenerating: false,
  artifacts: [],
  currentArtifactId: null,
  chatMessages: [],
  responseMode: getStoredResponseMode(),

  // UI state for mobile/desktop
  showChat: true,
  showCode: false,
  showPreview: true,

  setGenerating: (generating: boolean) => 
    set({ isGenerating: generating }),

  addArtifact: (artifact: Artifact) =>
    set((state) => {
      // Convert legacy Artifact to BinaArtifact
      const binaArtifact: BinaArtifact = {
        ...artifact,
        title: artifact.projectId || 'Untitled Project',
        actions: [],
        modifiedFiles: {},
        shellHistory: [],
        serverProcess: null,
        updatedAt: new Date().toISOString()
      }
      return {
        artifacts: [...state.artifacts, binaArtifact],
        currentArtifactId: artifact.id
      }
    }),

  upsertBinaArtifact: (artifact: BinaArtifact) =>
    set((state) => {
      const existingIndex = state.artifacts.findIndex(a => a.id === artifact.id)

      if (existingIndex >= 0) {
        // Update existing artifact
        const updatedArtifacts = [...state.artifacts]
        updatedArtifacts[existingIndex] = {
          ...updatedArtifacts[existingIndex],
          ...artifact,
          updatedAt: new Date().toISOString()
        }
        return { artifacts: updatedArtifacts }
      } else {
        // Add new artifact
        return {
          artifacts: [...state.artifacts, artifact],
          currentArtifactId: artifact.id
        }
      }
    }),

  addActionToArtifact: (artifactId: string, action: BinaAction) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? {
              ...artifact,
              actions: [...artifact.actions, action],
              updatedAt: new Date().toISOString()
            }
          : artifact
      )
    })),

  updateArtifact: (id: string, files: Record<string, string>) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === id
          ? { ...artifact, files, updatedAt: new Date().toISOString() }
          : artifact
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

  setResponseMode: (mode: ResponseMode) => {
    // Persist to localStorage
    try {
      localStorage.setItem('responseMode', mode)
    } catch (error) {
      console.warn('Failed to save response mode to localStorage:', error)
    }
    set({ responseMode: mode })
  },

  togglePanel: (panel: 'chat' | 'code' | 'preview') =>
    set((state) => {
      // Use consistent mobile breakpoint with useResponsive hook
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        // Mobile: Show only one panel at a time
        return {
          showChat: panel === 'chat',
          showCode: panel === 'code',
          showPreview: panel === 'preview'
        }
      } else {
        // Desktop: Toggle panels independently
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

  // File operations
  createFile: (artifactId: string, filePath: string, content: string = '') =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: { ...artifact.files, [filePath]: content } }
          : artifact
      )
    })),

  createFolder: (artifactId: string, folderPath: string) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, files: { ...artifact.files, [`${folderPath}/.gitkeep`]: '# This file keeps the folder in version control' } }
          : artifact
      )
    })),

  deleteFile: (artifactId: string, filePath: string) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact => {
        if (artifact.id === artifactId) {
          const newFiles = { ...artifact.files }
          delete newFiles[filePath]
          return { ...artifact, files: newFiles }
        }
        return artifact
      })
    })),

  renameFile: (artifactId: string, oldPath: string, newName: string) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact => {
        if (artifact.id === artifactId) {
          const content = artifact.files[oldPath]
          if (content !== undefined) {
            const pathParts = oldPath.split('/')
            const newPath = [...pathParts.slice(0, -1), newName].join('/')
            const newFiles = { ...artifact.files }
            newFiles[newPath] = content
            delete newFiles[oldPath]
            return { ...artifact, files: newFiles }
          }
        }
        return artifact
      })
    })),

  updateFileContent: (artifactId: string, filePath: string, content: string) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? {
              ...artifact,
              files: { ...artifact.files, [filePath]: content },
              updatedAt: new Date().toISOString()
            }
          : artifact
      )
    })),

  trackFileModification: (artifactId: string, filePath: string, originalContent: string, modifiedContent: string) =>
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === artifactId
          ? {
              ...artifact,
              modifiedFiles: {
                ...artifact.modifiedFiles,
                [filePath]: {
                  originalContent,
                  modifiedContent,
                  modifiedAt: new Date().toISOString()
                }
              },
              updatedAt: new Date().toISOString()
            }
          : artifact
      )
    }))
}))
