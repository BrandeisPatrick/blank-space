/**
 * Virtual File System for in-memory file operations
 * Supports directory structures and import resolution
 */

export interface VFSFile {
  path: string
  content: string
  type: 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'md' | 'html'
  lastModified: number
}

export interface VFSDirectory {
  path: string
  children: Map<string, VFSFile | VFSDirectory>
  lastModified: number
}

export class VirtualFileSystem {
  private root: VFSDirectory
  private watchers: Map<string, (file: VFSFile) => void> = new Map()

  constructor() {
    this.root = {
      path: '/',
      children: new Map(),
      lastModified: Date.now()
    }
  }

  /**
   * Write a file to the VFS
   */
  writeFile(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path)
    const { dir, filename } = this.parsePath(normalizedPath)
    
    // Ensure directory exists
    const directory = this.ensureDirectory(dir)
    
    // Determine file type from extension
    const type = this.getFileType(filename)
    
    const file: VFSFile = {
      path: normalizedPath,
      content,
      type,
      lastModified: Date.now()
    }

    directory.children.set(filename, file)
    directory.lastModified = Date.now()

    // Notify watchers
    const watcher = this.watchers.get(normalizedPath)
    if (watcher) {
      watcher(file)
    }
  }

  /**
   * Read a file from the VFS
   */
  readFile(path: string): VFSFile | null {
    const normalizedPath = this.normalizePath(path)
    const { dir, filename } = this.parsePath(normalizedPath)
    
    const directory = this.getDirectory(dir)
    if (!directory) return null
    
    const file = directory.children.get(filename)
    return file && 'content' in file ? file : null
  }

  /**
   * Check if a file exists
   */
  exists(path: string): boolean {
    return this.readFile(path) !== null
  }

  /**
   * List files in a directory
   */
  readdir(path: string): Array<{ name: string; type: 'file' | 'directory' }> {
    const normalizedPath = this.normalizePath(path)
    const directory = this.getDirectory(normalizedPath)
    
    if (!directory) return []
    
    return Array.from(directory.children.entries()).map(([name, item]) => ({
      name,
      type: 'content' in item ? 'file' : 'directory'
    }))
  }

  /**
   * Delete a file or directory
   */
  unlink(path: string): boolean {
    const normalizedPath = this.normalizePath(path)
    const { dir, filename } = this.parsePath(normalizedPath)
    
    const directory = this.getDirectory(dir)
    if (!directory) return false
    
    const deleted = directory.children.delete(filename)
    if (deleted) {
      directory.lastModified = Date.now()
    }
    
    return deleted
  }

  /**
   * Watch a file for changes
   */
  watchFile(path: string, callback: (file: VFSFile) => void): () => void {
    const normalizedPath = this.normalizePath(path)
    this.watchers.set(normalizedPath, callback)
    
    // Return unwatch function
    return () => {
      this.watchers.delete(normalizedPath)
    }
  }

  /**
   * Resolve an import path relative to a base file
   */
  resolveImport(importPath: string, fromFile: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = this.parsePath(fromFile).dir
      const resolved = this.resolvePath(fromDir, importPath)
      
      // Try different extensions
      const extensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
      
      // Check exact path first
      if (this.exists(resolved)) {
        return resolved
      }
      
      // Try with extensions
      for (const ext of extensions) {
        const withExt = resolved + ext
        if (this.exists(withExt)) {
          return withExt
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexFile = resolved + '/index' + ext
        if (this.exists(indexFile)) {
          return indexFile
        }
      }
    }
    
    // Handle absolute imports (from project root)
    if (importPath.startsWith('/')) {
      return this.resolveImport('.' + importPath, fromFile)
    }
    
    // Handle bare specifiers (node_modules-style)
    // For now, return null (will be handled by import maps)
    return null
  }

  /**
   * Get all files in the VFS as a flat array
   */
  getAllFiles(): VFSFile[] {
    const files: VFSFile[] = []
    
    const traverse = (dir: VFSDirectory) => {
      for (const [, item] of dir.children) {
        if ('content' in item) {
          files.push(item)
        } else {
          traverse(item)
        }
      }
    }
    
    traverse(this.root)
    return files
  }

  /**
   * Clear the entire VFS
   */
  clear(): void {
    this.root.children.clear()
    this.watchers.clear()
    this.root.lastModified = Date.now()
  }

  /**
   * Export the VFS structure for serialization
   */
  export(): Record<string, string> {
    const result: Record<string, string> = {}
    
    const traverse = (dir: VFSDirectory, currentPath = '') => {
      for (const [name, item] of dir.children) {
        const itemPath = currentPath + '/' + name
        
        if ('content' in item) {
          result[itemPath] = item.content
        } else {
          traverse(item, itemPath)
        }
      }
    }
    
    traverse(this.root)
    return result
  }

  /**
   * Import files from a record structure
   */
  import(files: Record<string, string>): void {
    this.clear()
    
    for (const [path, content] of Object.entries(files)) {
      this.writeFile(path, content)
    }
  }

  // Private helper methods

  private normalizePath(path: string): string {
    return path.startsWith('/') ? path : '/' + path
  }

  private parsePath(path: string): { dir: string; filename: string } {
    const lastSlash = path.lastIndexOf('/')
    if (lastSlash === -1) {
      return { dir: '/', filename: path }
    }
    
    return {
      dir: lastSlash === 0 ? '/' : path.substring(0, lastSlash),
      filename: path.substring(lastSlash + 1)
    }
  }

  private resolvePath(basePath: string, relativePath: string): string {
    const parts = basePath.split('/').filter(Boolean)
    const relativeParts = relativePath.split('/').filter(Boolean)
    
    for (const part of relativeParts) {
      if (part === '..') {
        parts.pop()
      } else if (part !== '.') {
        parts.push(part)
      }
    }
    
    return '/' + parts.join('/')
  }

  private getFileType(filename: string): VFSFile['type'] {
    const ext = filename.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx': return 'tsx'
      case 'ts': return 'ts'
      case 'jsx': return 'jsx'
      case 'js': return 'js'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'md': return 'md'
      case 'html': return 'html'
      default: return 'js'
    }
  }

  private ensureDirectory(path: string): VFSDirectory {
    const parts = path.split('/').filter(Boolean)
    let current = this.root
    
    for (const part of parts) {
      let child = current.children.get(part)
      
      if (!child) {
        child = {
          path: current.path === '/' ? '/' + part : current.path + '/' + part,
          children: new Map(),
          lastModified: Date.now()
        }
        current.children.set(part, child)
      } else if ('content' in child) {
        throw new Error(`Cannot create directory ${part}: file exists`)
      }
      
      current = child as VFSDirectory
    }
    
    return current
  }

  private getDirectory(path: string): VFSDirectory | null {
    if (path === '/') return this.root
    
    const parts = path.split('/').filter(Boolean)
    let current = this.root
    
    for (const part of parts) {
      const child = current.children.get(part)
      if (!child || 'content' in child) {
        return null
      }
      current = child
    }
    
    return current
  }
}