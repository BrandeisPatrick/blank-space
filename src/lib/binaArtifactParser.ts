import { BinaAction, BinaArtifact, BinaParserEvent, ParserState } from '../types/binaArtifact'

/**
 * Helper to strip markdown code fences from file content
 */
function stripMarkdownCodeFences(content: string): string {
  let cleaned = content
  // Remove opening fences: ```tsx, ```typescript, ```jsx, ```javascript, etc.
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '')
  // Remove closing fences: ```
  cleaned = cleaned.replace(/\n?```$/gm, '')
  // Handle any remaining stray fences
  cleaned = cleaned.replace(/```[\w]*\n?/g, '')
  cleaned = cleaned.replace(/```/g, '')
  return cleaned.trim()
}

/**
 * BinaArtifactParser - Streaming XML parser for BinaArtifact format
 *
 * Parses LLM output in the format:
 * <binaArtifact id="project_123" title="Todo App">
 *   <binaAction type="shell">npm install react</binaAction>
 *   <binaAction type="file" filePath="src/App.jsx">
 *     [Full file content here]
 *   </binaAction>
 * </binaArtifact>
 *
 * Actions are executed immediately as they arrive (streaming mode)
 */
export class BinaArtifactParser {
  private state: ParserState = {
    inArtifact: false,
    inAction: false,
    currentAction: null,
    currentArtifact: null,
    buffer: ''
  }

  private onEvent?: (event: BinaParserEvent) => void

  constructor(onEvent?: (event: BinaParserEvent) => void) {
    this.onEvent = onEvent
  }

  /**
   * Parse a chunk of text from streaming response
   */
  parseChunk(chunk: string): void {
    this.state.buffer += chunk

    // Process all complete tags in buffer
    while (this.state.buffer.length > 0) {
      const processed = this.processBuffer()
      if (!processed) break
    }
  }

  /**
   * Process buffer to extract complete tags
   */
  private processBuffer(): boolean {
    const buffer = this.state.buffer

    // Check for artifact start tag
    if (!this.state.inArtifact) {
      const artifactMatch = buffer.match(/<binaArtifact\s+id="([^"]+)"\s+title="([^"]+)">/)
      if (artifactMatch) {
        const [fullMatch, id, title] = artifactMatch
        this.state.inArtifact = true
        this.state.currentArtifact = {
          id,
          title,
          files: {},
          actions: [],
          modifiedFiles: {},
          shellHistory: [],
          serverProcess: null,
          projectId: id,
          regionId: 'full-page',
          entry: 'index.html',
          metadata: { device: 'desktop' },
          createdAt: new Date().toISOString()
        }

        this.onEvent?.({ type: 'artifact_start', artifactId: id, title })
        this.state.buffer = buffer.slice(artifactMatch.index! + fullMatch.length)
        return true
      }
    }

    // Check for artifact end tag
    if (this.state.inArtifact && buffer.includes('</binaArtifact>')) {
      const endIndex = buffer.indexOf('</binaArtifact>')

      if (this.state.currentArtifact) {
        const artifact = this.state.currentArtifact as BinaArtifact
        artifact.updatedAt = new Date().toISOString()
        this.onEvent?.({ type: 'artifact_complete', artifact })
      }

      this.state.buffer = buffer.slice(endIndex + '</binaArtifact>'.length)
      this.reset()
      return true
    }

    // Check for action start tag
    if (this.state.inArtifact && !this.state.inAction) {
      // Match: <binaAction type="file" filePath="src/App.jsx">
      const fileActionMatch = buffer.match(/<binaAction\s+type="file"\s+filePath="([^"]+)">/)
      // Match: <binaAction type="shell">
      const shellActionMatch = buffer.match(/<binaAction\s+type="shell">/)

      if (fileActionMatch) {
        const [fullMatch, filePath] = fileActionMatch
        this.state.inAction = true
        this.state.currentAction = {
          type: 'file',
          filePath,
          content: '',
          id: `action_${Date.now()}`
        }

        this.state.buffer = buffer.slice(fileActionMatch.index! + fullMatch.length)
        return true
      } else if (shellActionMatch) {
        const [fullMatch] = shellActionMatch
        this.state.inAction = true
        this.state.currentAction = {
          type: 'shell',
          command: '',
          id: `action_${Date.now()}`
        }

        this.state.buffer = buffer.slice(shellActionMatch.index! + fullMatch.length)
        return true
      }
    }

    // Check for action end tag
    if (this.state.inAction && buffer.includes('</binaAction>')) {
      const endIndex = buffer.indexOf('</binaAction>')
      const content = buffer.slice(0, endIndex).trim()

      if (this.state.currentAction) {
        const action: BinaAction = {
          ...this.state.currentAction,
          [this.state.currentAction.type === 'file' ? 'content' : 'command']: content,
          executedAt: new Date().toISOString()
        } as BinaAction

        // Add to artifact
        if (this.state.currentArtifact) {
          this.state.currentArtifact.actions = this.state.currentArtifact.actions || []
          this.state.currentArtifact.actions.push(action)

          // Update files if file action
          if (action.type === 'file' && action.filePath) {
            this.state.currentArtifact.files = this.state.currentArtifact.files || {}
            // Strip markdown code fences before storing
            this.state.currentArtifact.files[action.filePath] = stripMarkdownCodeFences(action.content || '')
          }

          // Update shell history if shell action
          if (action.type === 'shell' && action.command) {
            this.state.currentArtifact.shellHistory = this.state.currentArtifact.shellHistory || []
            this.state.currentArtifact.shellHistory.push(action.command)
          }
        }

        // Emit event for immediate execution
        this.onEvent?.({ type: 'action_start', action })
      }

      this.state.buffer = buffer.slice(endIndex + '</binaAction>'.length)
      this.state.inAction = false
      this.state.currentAction = null
      return true
    }

    // No complete tag found
    return false
  }

  /**
   * Finalize parsing (call when stream ends)
   */
  finalize(): BinaArtifact | null {
    // Process any remaining buffer
    while (this.state.buffer.length > 0) {
      const processed = this.processBuffer()
      if (!processed) break
    }

    return this.state.currentArtifact as BinaArtifact | null
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.state = {
      inArtifact: false,
      inAction: false,
      currentAction: null,
      currentArtifact: null,
      buffer: ''
    }
  }

  /**
   * Get current parsing state
   */
  getState(): ParserState {
    return { ...this.state }
  }
}

/**
 * Helper function to parse complete BinaArtifact from string
 */
export function parseBinaArtifact(xml: string): BinaArtifact | null {
  const parser = new BinaArtifactParser()
  parser.parseChunk(xml)
  return parser.finalize()
}

/**
 * Helper to validate BinaAction has required fields
 */
export function validateBinaAction(action: BinaAction): { valid: boolean; error?: string } {
  if (action.type === 'file') {
    if (!action.filePath) {
      return { valid: false, error: 'File action missing filePath' }
    }
    if (action.content === undefined) {
      return { valid: false, error: 'File action missing content' }
    }
    // Check for forbidden placeholders
    if (action.content.includes('// rest of the code') ||
        action.content.includes('// ... rest')) {
      return { valid: false, error: 'File action contains placeholder comments - full content required' }
    }
  }

  if (action.type === 'shell') {
    if (!action.command) {
      return { valid: false, error: 'Shell action missing command' }
    }
  }

  return { valid: true }
}