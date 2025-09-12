/**
 * Hot Module Replacement (HMR) service
 * Manages component updates and state preservation
 */

import { VirtualFileSystem, VFSFile } from '../utils/vfs'
import { ReactRefreshService } from './reactRefresh'
import { ModuleBundler } from './bundler'

export interface HMRUpdate {
  type: 'component' | 'style' | 'full-reload'
  files: string[]
  timestamp: number
  bundleResult?: any
}

export interface ComponentBoundary {
  name: string
  filePath: string
  dependencies: string[]
  lastUpdate: number
}

export class HMRService {
  private vfs: VirtualFileSystem | null = null
  private refreshService: ReactRefreshService
  private bundler: ModuleBundler
  private boundaries: Map<string, ComponentBoundary> = new Map()
  private fileWatchers: Map<string, () => void> = new Map()
  private lastSnapshot: Map<string, string> = new Map()
  private updateCallback: ((update: HMRUpdate) => void) | null = null
  private isEnabled = false

  constructor() {
    this.refreshService = new ReactRefreshService()
    this.bundler = new ModuleBundler()
  }

  /**
   * Initialize HMR for a project
   */
  async initialize(vfs: VirtualFileSystem, callback: (update: HMRUpdate) => void): Promise<void> {
    try {
      this.vfs = vfs
      this.updateCallback = callback
      
      // Initialize React Refresh
      await this.refreshService.initialize()
      
      // Analyze initial component boundaries
      await this.analyzeComponentBoundaries()
      
      // Setup file watchers
      this.setupFileWatchers()
      
      // Take initial snapshot
      this.takeSnapshot()
      
      this.isEnabled = true
      console.log('🔥 HMR initialized with React Refresh')
    } catch (error) {
      console.error('Failed to initialize HMR:', error)
      throw error
    }
  }

  /**
   * Analyze component boundaries in the project
   */
  private async analyzeComponentBoundaries(): Promise<void> {
    if (!this.vfs) return

    const files = this.vfs.getAllFiles()
    
    for (const file of files) {
      if (['jsx', 'tsx', 'js', 'ts'].includes(file.type)) {
        const components = this.extractComponents(file)
        
        for (const component of components) {
          const boundary: ComponentBoundary = {
            name: component.name,
            filePath: file.path,
            dependencies: this.extractDependencies(file),
            lastUpdate: file.lastModified
          }
          
          this.boundaries.set(`${file.path}:${component.name}`, boundary)
        }
      }
    }
    
    console.log(`📊 Analyzed ${this.boundaries.size} component boundaries`)
  }

  /**
   * Extract React components from file content
   */
  private extractComponents(file: VFSFile): Array<{ name: string; type: 'function' | 'class' }> {
    const components: Array<{ name: string; type: 'function' | 'class' }> = []
    
    // Match function components
    const functionRegex = /(?:export\s+)?(?:const|let|var|function)\s+([A-Z][a-zA-Z0-9_]*)/g
    let match
    
    while ((match = functionRegex.exec(file.content)) !== null) {
      components.push({
        name: match[1],
        type: 'function'
      })
    }
    
    // Match class components
    const classRegex = /class\s+([A-Z][a-zA-Z0-9_]*)\s+extends\s+(?:React\.)?Component/g
    while ((match = classRegex.exec(file.content)) !== null) {
      components.push({
        name: match[1],
        type: 'class'
      })
    }
    
    return components
  }

  /**
   * Extract file dependencies
   */
  private extractDependencies(file: VFSFile): string[] {
    const dependencies: string[] = []
    
    // Match import statements
    const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(file.content)) !== null) {
      if (!this.vfs) continue
      
      const resolved = this.vfs.resolveImport(match[1], file.path)
      if (resolved) {
        dependencies.push(resolved)
      }
    }
    
    return dependencies
  }

  /**
   * Setup file watchers for change detection
   */
  private setupFileWatchers(): void {
    if (!this.vfs) return

    const files = this.vfs.getAllFiles()
    
    for (const file of files) {
      const unwatcher = this.vfs.watchFile(file.path, (updatedFile) => {
        this.handleFileChange(updatedFile)
      })
      
      this.fileWatchers.set(file.path, unwatcher)
    }
  }

  /**
   * Handle individual file changes
   */
  private async handleFileChange(file: VFSFile): Promise<void> {
    if (!this.isEnabled || !this.vfs || !this.updateCallback) return

    const oldContent = this.lastSnapshot.get(file.path)
    const newContent = file.content
    
    if (oldContent === newContent) return

    console.log(`📝 File changed: ${file.path}`)

    // Update snapshot
    this.lastSnapshot.set(file.path, newContent)

    try {
      // Determine update type
      const updateType = this.determineUpdateType(file, oldContent || '', newContent)
      
      if (updateType === 'full-reload') {
        this.updateCallback({
          type: 'full-reload',
          files: [file.path],
          timestamp: Date.now()
        })
        return
      }

      if (updateType === 'style') {
        this.updateCallback({
          type: 'style',
          files: [file.path],
          timestamp: Date.now()
        })
        return
      }

      // Component update - use React Refresh
      await this.performComponentUpdate(file)
      
    } catch (error) {
      console.error('HMR update failed:', error)
      // Fallback to full reload
      this.updateCallback({
        type: 'full-reload',
        files: [file.path],
        timestamp: Date.now()
      })
    }
  }

  /**
   * Determine what type of update is needed
   */
  private determineUpdateType(file: VFSFile, oldContent: string, newContent: string): 'component' | 'style' | 'full-reload' {
    // CSS files always trigger style updates
    if (file.type === 'css') {
      return 'style'
    }

    // Check for structural changes that require full reload
    if (this.hasStructuralChanges(oldContent, newContent)) {
      return 'full-reload'
    }

    // Default to component update for JS/TS files
    return 'component'
  }

  /**
   * Check for structural changes that require full reload
   */
  private hasStructuralChanges(oldContent: string, newContent: string): boolean {
    // Check for new imports/exports
    const oldImports = (oldContent.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || []).sort()
    const newImports = (newContent.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || []).sort()
    
    if (JSON.stringify(oldImports) !== JSON.stringify(newImports)) {
      return true
    }

    // Check for new component definitions
    const oldComponents = (oldContent.match(/(?:export\s+)?(?:const|let|var|function|class)\s+[A-Z][a-zA-Z0-9_]*/g) || []).sort()
    const newComponents = (newContent.match(/(?:export\s+)?(?:const|let|var|function|class)\s+[A-Z][a-zA-Z0-9_]*/g) || []).sort()
    
    if (JSON.stringify(oldComponents) !== JSON.stringify(newComponents)) {
      return true
    }

    return false
  }

  /**
   * Perform component update using React Refresh
   */
  private async performComponentUpdate(file: VFSFile): Promise<void> {
    if (!this.vfs || !this.updateCallback) return

    try {
      // Re-bundle the project with the updated file
      const bundleResult = await this.bundler.bundle(this.vfs, {
        entryPoint: '/App.jsx', // TODO: Make this configurable
        format: 'iife',
        target: 'es2020'
      })

      if (bundleResult.error) {
        throw new Error(bundleResult.error)
      }

      // Transform code for React Refresh
      const refreshCode = this.refreshService.transformCodeForRefresh(
        bundleResult.code,
        file.path
      )

      this.updateCallback({
        type: 'component',
        files: [file.path],
        timestamp: Date.now(),
        bundleResult: {
          ...bundleResult,
          code: refreshCode
        }
      })

      console.log('🔄 Component HMR update sent')
      
    } catch (error) {
      console.error('Component update failed:', error)
      throw error
    }
  }

  /**
   * Take snapshot of current file states
   */
  private takeSnapshot(): void {
    if (!this.vfs) return

    const files = this.vfs.getAllFiles()
    this.lastSnapshot.clear()
    
    for (const file of files) {
      this.lastSnapshot.set(file.path, file.content)
    }
  }

  /**
   * Update a file programmatically and trigger HMR
   */
  async updateFile(filePath: string, content: string): Promise<void> {
    if (!this.vfs) return

    this.vfs.writeFile(filePath, content)
    const file = this.vfs.readFile(filePath)
    
    if (file) {
      await this.handleFileChange(file)
    }
  }

  /**
   * Check if HMR is enabled and ready
   */
  isReady(): boolean {
    return this.isEnabled && this.refreshService.isReady()
  }

  /**
   * Dispose of HMR service
   */
  dispose(): void {
    // Clear watchers
    for (const unwatcher of this.fileWatchers.values()) {
      unwatcher()
    }
    this.fileWatchers.clear()

    // Clear state
    this.boundaries.clear()
    this.lastSnapshot.clear()
    this.refreshService.reset()
    
    this.isEnabled = false
    this.vfs = null
    this.updateCallback = null
    
    console.log('🔥 HMR disposed')
  }

  /**
   * Get current component boundaries for debugging
   */
  getBoundaries(): Map<string, ComponentBoundary> {
    return new Map(this.boundaries)
  }
}