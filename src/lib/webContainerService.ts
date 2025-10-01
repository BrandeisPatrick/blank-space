import { WebContainer, FileSystemTree } from '@webcontainer/api'
import { BinaAction } from '../types/binaArtifact'

export interface ActionExecutionResult {
  success: boolean
  action: BinaAction
  output?: string
  error?: string
  exitCode?: number
}

export class WebContainerService {
  private static instance: WebContainerService
  private webContainer: WebContainer | null = null
  private bootPromise: Promise<WebContainer> | null = null
  private serverUrl: string | null = null
  private actionQueue: BinaAction[] = []
  private isExecutingActions = false

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService()
    }
    return WebContainerService.instance
  }

  async boot(): Promise<WebContainer> {
    if (this.webContainer) {
      return this.webContainer
    }

    if (this.bootPromise) {
      return this.bootPromise
    }

    this.bootPromise = WebContainer.boot()
    this.webContainer = await this.bootPromise
    return this.webContainer
  }

  async mountFiles(files: Record<string, string>): Promise<void> {
    const container = await this.boot()

    // Convert flat file structure to WebContainer file tree
    const fileTree: FileSystemTree = this.buildFileTree(files)

    await container.mount(fileTree)
  }

  private buildFileTree(files: Record<string, string>): FileSystemTree {
    const tree: FileSystemTree = {}

    for (const [path, content] of Object.entries(files)) {
      const parts = path.split('/')

      // For single file (no path separator)
      if (parts.length === 1) {
        tree[path] = {
          file: {
            contents: content
          }
        }
        continue
      }

      // Navigate/create directory structure
      let currentLevel: Record<string, any> = tree
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!currentLevel[part]) {
          currentLevel[part] = { directory: {} }
        }
        currentLevel = currentLevel[part].directory as Record<string, any>
      }

      // Add file at the final level
      const fileName = parts[parts.length - 1]
      currentLevel[fileName] = {
        file: {
          contents: content
        }
      }
    }

    return tree
  }

  async installDependencies(dependencies: Record<string, string>): Promise<void> {
    const container = await this.boot()

    // Create package.json if it doesn't exist
    const packageJson = {
      name: 'preview-app',
      type: 'module',
      dependencies: dependencies
    }

    await container.mount({
      'package.json': {
        file: {
          contents: JSON.stringify(packageJson, null, 2)
        }
      }
    })

    // Run npm install
    const installProcess = await container.spawn('npm', ['install'])

    const exitCode = await installProcess.exit
    if (exitCode !== 0) {
      throw new Error('Failed to install dependencies')
    }
  }

  async runDevServer(command: string = 'npm run dev'): Promise<string> {
    const container = await this.boot()

    // Start dev server
    const devProcess = await container.spawn('sh', ['-c', command])

    // Monitor output to detect when server is ready
    const serverReadyPromise = new Promise<string>((resolve, reject) => {
      let output = ''
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout - no port detected after 30 seconds'))
      }, 30000)

      devProcess.output.pipeTo(new WritableStream({
        write: (data) => {
          output += data
          console.log('[WebContainer]', data)

          // Detect server startup from common patterns
          const portMatch = data.match(/(?:listening|running|started).*?(?:port|:)\s*(\d+)/i) ||
                           data.match(/localhost:(\d+)/i) ||
                           data.match(/Server running on port (\d+)/i)

          if (portMatch) {
            clearTimeout(timeout)
            container.on('server-ready', (_port, url) => {
              this.serverUrl = url
              resolve(url)
            })
          }
        }
      }))
    })

    // Wait for server to be ready
    const url = await serverReadyPromise
    return url
  }

  async runCommand(command: string, args: string[] = []): Promise<string> {
    const container = await this.boot()

    const process = await container.spawn(command, args)

    let output = ''
    const reader = process.output.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      output += value
    }

    const exitCode = await process.exit
    if (exitCode !== 0) {
      throw new Error(`Command failed with exit code ${exitCode}: ${output}`)
    }

    return output
  }

  async writeFile(path: string, content: string): Promise<void> {
    const container = await this.boot()
    await container.fs.writeFile(path, content)
  }

  async readFile(path: string): Promise<string> {
    const container = await this.boot()
    const content = await container.fs.readFile(path, 'utf-8')
    return content
  }

  async teardown(): Promise<void> {
    if (this.webContainer) {
      await this.webContainer.teardown()
      this.webContainer = null
      this.bootPromise = null
      this.serverUrl = null
    }
  }

  getServerUrl(): string | null {
    return this.serverUrl
  }

  // ============= BinaAction Execution Methods =============

  /**
   * Execute a BinaAction (file or shell)
   */
  async executeAction(
    action: BinaAction,
    onProgress?: (message: string) => void
  ): Promise<ActionExecutionResult> {
    try {
      const container = await this.boot()

      if (action.type === 'file') {
        return await this.executeFileAction(action, container, onProgress)
      } else if (action.type === 'shell') {
        return await this.executeShellAction(action, container, onProgress)
      }

      return {
        success: false,
        action,
        error: `Unknown action type: ${action.type}`
      }
    } catch (error) {
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute a file action: write file with directory creation
   */
  private async executeFileAction(
    action: BinaAction,
    container: WebContainer,
    onProgress?: (message: string) => void
  ): Promise<ActionExecutionResult> {
    if (!action.filePath || action.content === undefined) {
      return {
        success: false,
        action,
        error: 'File action missing filePath or content'
      }
    }

    try {
      onProgress?.(`Writing ${action.filePath}`)

      // Create parent directories if needed
      const pathParts = action.filePath.split('/')
      if (pathParts.length > 1) {
        const dirPath = pathParts.slice(0, -1).join('/')
        try {
          await container.fs.mkdir(dirPath, { recursive: true })
        } catch (e) {
          // Directory might already exist, ignore error
        }
      }

      // Write file atomically
      await container.fs.writeFile(action.filePath, action.content)

      onProgress?.(`✓ Created ${action.filePath}`)

      return {
        success: true,
        action,
        output: `File written: ${action.filePath}`
      }
    } catch (error) {
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute a shell action: run command and capture output
   */
  private async executeShellAction(
    action: BinaAction,
    container: WebContainer,
    onProgress?: (message: string) => void
  ): Promise<ActionExecutionResult> {
    if (!action.command) {
      return {
        success: false,
        action,
        error: 'Shell action missing command'
      }
    }

    try {
      onProgress?.(`Running: ${action.command}`)

      // Parse command (support shell operators like &&)
      const process = await container.spawn('sh', ['-c', action.command])

      // Capture output
      let output = ''
      const reader = process.output.getReader()

      // Read output stream
      const readOutput = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          output += value
          console.log('[WebContainer Shell]', value)
          onProgress?.(value.trim())
        }
      }

      // Wait for both output reading and process exit
      await Promise.all([
        readOutput(),
        process.exit
      ])

      const exitCode = await process.exit

      if (exitCode !== 0) {
        return {
          success: false,
          action,
          error: `Command exited with code ${exitCode}`,
          output,
          exitCode
        }
      }

      onProgress?.(`✓ Completed: ${action.command}`)

      return {
        success: true,
        action,
        output,
        exitCode: 0
      }
    } catch (error) {
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeActions(
    actions: BinaAction[],
    onProgress?: (action: BinaAction, message: string) => void,
    onActionComplete?: (result: ActionExecutionResult) => void
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = []

    for (const action of actions) {
      const result = await this.executeAction(
        action,
        (msg) => onProgress?.(action, msg)
      )

      results.push(result)
      onActionComplete?.(result)

      // Stop on first error
      if (!result.success) {
        break
      }

      // Special handling for server start commands
      if (action.type === 'shell' && action.command?.includes('npm run dev')) {
        // Wait for server-ready event
        await this.waitForServerReady()
      }
    }

    return results
  }

  /**
   * Wait for WebContainer server-ready event
   */
  private async waitForServerReady(timeout: number = 30000): Promise<string> {
    const container = await this.boot()

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Server startup timeout'))
      }, timeout)

      container.on('server-ready', (_port, url) => {
        clearTimeout(timeoutId)
        this.serverUrl = url
        console.log('[WebContainer] Server ready:', url)
        resolve(url)
      })
    })
  }
}

export const webContainerService = WebContainerService.getInstance()