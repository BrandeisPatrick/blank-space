// Bina Artifact Management System
// Inspired by Bolt's artifact architecture for incremental file/shell operations

export type BinaActionType = 'file' | 'shell'

export interface BinaAction {
  type: BinaActionType

  // For type="file"
  filePath?: string
  content?: string

  // For type="shell"
  command?: string

  // Metadata
  id?: string
  executedAt?: string
  exitCode?: number
  output?: string
}

export interface FileModification {
  originalContent: string
  modifiedContent: string
  diff?: string
  modifiedAt: string
}

export interface BinaArtifact {
  // Core identification
  id: string
  title: string

  // File system state
  files: Record<string, string>

  // Action history
  actions: BinaAction[]

  // User modifications tracking
  modifiedFiles: Record<string, FileModification>

  // Shell state
  shellHistory: string[]
  serverProcess: {
    pid?: string
    url?: string
    port?: number
    command?: string
  } | null

  // Standard metadata
  projectId: string
  regionId: string
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
  updatedAt?: string
  author?: string
}

// Streaming parser state
export interface ParserState {
  inArtifact: boolean
  inAction: boolean
  currentAction: Partial<BinaAction> | null
  currentArtifact: Partial<BinaArtifact> | null
  buffer: string
}

// Parser events for real-time updates
export type BinaParserEvent =
  | { type: 'artifact_start'; artifactId: string; title: string }
  | { type: 'action_start'; action: BinaAction }
  | { type: 'action_complete'; action: BinaAction }
  | { type: 'action_error'; action: BinaAction; error: string }
  | { type: 'artifact_complete'; artifact: BinaArtifact }
  | { type: 'parse_error'; error: string }