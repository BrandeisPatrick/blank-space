import { VirtualFileSystem, VFSFile } from '../utils/vfs'
import { TranspilerService, TranspilerResult } from './transpiler'

export interface BundleResult {
  code: string
  css: string
  html: string
  error?: string
  warnings?: string[]
  dependencies: string[]
}

export interface BundleOptions {
  entryPoint: string
  target?: 'es2020' | 'es2022'
  format?: 'iife' | 'esm'
  minify?: boolean
}

export class ModuleBundler {
  private transpilerService: TranspilerService
  private resolvedModules: Map<string, string> = new Map()
  
  constructor() {
    this.transpilerService = TranspilerService.getInstance()
  }

  /**
   * Bundle a multi-file project into a single executable unit
   */
  async bundle(
    vfs: VirtualFileSystem, 
    options: BundleOptions
  ): Promise<BundleResult> {
    try {
      await this.transpilerService.initialize()
      
      const {
        entryPoint,
        target = 'es2020',
        format = 'iife'
      } = options

      // Reset resolved modules for this bundle
      this.resolvedModules.clear()

      // Find entry file
      const entryFile = vfs.readFile(entryPoint)
      if (!entryFile) {
        return {
          code: '',
          css: '',
          html: '',
          error: `Entry point not found: ${entryPoint}`,
          dependencies: []
        }
      }

      // Collect all modules starting from entry point
      const moduleGraph = await this.buildModuleGraph(vfs, entryPoint)
      const warnings: string[] = []

      // Bundle JavaScript modules
      const jsModules: string[] = []
      const cssContent: string[] = []

      // Process modules in dependency order
      for (const modulePath of moduleGraph.order) {
        const file = vfs.readFile(modulePath)
        if (!file) continue

        if (file.type === 'css') {
          cssContent.push(file.content)
        } else if (['js', 'jsx', 'ts', 'tsx'].includes(file.type)) {
          const transformed = await this.transformModule(file, vfs)
          if (transformed.error) {
            return {
              code: '',
              css: '',
              html: '',
              error: `Failed to transform ${modulePath}: ${transformed.error}`,
              dependencies: moduleGraph.dependencies
            }
          }
          
          jsModules.push(transformed.code)
          warnings.push(...(transformed.warnings || []))
        }
      }

      // Create final bundle
      const bundledCode = this.createBundle(jsModules, format)
      const bundledCSS = cssContent.join('\n')

      return {
        code: bundledCode,
        css: bundledCSS,
        html: this.createHTMLWrapper(bundledCode, bundledCSS),
        warnings,
        dependencies: moduleGraph.dependencies
      }
    } catch (error) {
      return {
        code: '',
        css: '',
        html: '',
        error: error instanceof Error ? error.message : 'Unknown bundling error',
        dependencies: []
      }
    }
  }

  /**
   * Build module dependency graph
   */
  private async buildModuleGraph(
    vfs: VirtualFileSystem, 
    entryPoint: string
  ): Promise<{ order: string[]; dependencies: string[] }> {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []
    const dependencies: string[] = []

    const visit = async (modulePath: string): Promise<void> => {
      if (visited.has(modulePath)) return
      if (visiting.has(modulePath)) {
        throw new Error(`Circular dependency detected: ${modulePath}`)
      }

      visiting.add(modulePath)

      const file = vfs.readFile(modulePath)
      if (!file) {
        throw new Error(`Module not found: ${modulePath}`)
      }

      // Extract imports from the file
      const imports = this.extractImports(file.content)

      for (const importPath of imports) {
        const resolvedPath = vfs.resolveImport(importPath, modulePath)
        
        if (resolvedPath) {
          // Internal module - add to dependency graph
          await visit(resolvedPath)
        } else {
          // External dependency (bare specifier)
          if (!dependencies.includes(importPath)) {
            dependencies.push(importPath)
          }
        }
      }

      visiting.delete(modulePath)
      visited.add(modulePath)
      order.push(modulePath)
    }

    await visit(entryPoint)

    return { order, dependencies }
  }

  /**
   * Extract import statements from module code
   */
  private extractImports(code: string): string[] {
    const imports: string[] = []
    
    // Match ES6 imports
    const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g
    let match

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1])
    }

    // Match dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = dynamicImportRegex.exec(code)) !== null) {
      imports.push(match[1])
    }

    // Match require() calls (for compatibility)
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = requireRegex.exec(code)) !== null) {
      imports.push(match[1])
    }

    return imports
  }

  /**
   * Transform a single module
   */
  private async transformModule(
    file: VFSFile,
    vfs: VirtualFileSystem
  ): Promise<TranspilerResult> {
    // Replace imports with resolved paths
    let processedCode = file.content

    const imports = this.extractImports(file.content)
    for (const importPath of imports) {
      const resolvedPath = vfs.resolveImport(importPath, file.path)
      
      if (resolvedPath) {
        // Convert to a module reference
        const moduleId = this.getModuleId(resolvedPath)
        processedCode = processedCode.replace(
          new RegExp(`['"]${escapeRegex(importPath)}['"]`, 'g'),
          `"${moduleId}"`
        )
      }
    }

    return this.transpilerService.transpileReactCode(processedCode)
  }

  /**
   * Create final bundle from transpiled modules
   */
  private createBundle(modules: string[], format: 'iife' | 'esm'): string {
    if (format === 'iife') {
      return `
        (function() {
          'use strict';
          
          // Module system
          const modules = {};
          const cache = {};
          
          function require(id) {
            if (cache[id]) return cache[id].exports;
            
            const module = { exports: {} };
            cache[id] = module;
            
            if (modules[id]) {
              modules[id](module, module.exports, require);
            }
            
            return module.exports;
          }
          
          // Register modules
          ${modules.map((code, index) => `
            modules['module_${index}'] = function(module, exports, require) {
              ${code}
            };
          `).join('\n')}
          
          // Execute entry point
          require('module_0');
        })();
      `
    } else {
      // ESM format
      return modules.join('\n')
    }
  }

  /**
   * Create HTML wrapper for the bundle
   */
  private createHTMLWrapper(jsCode: string, cssCode: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      ${cssCode}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        try {
          ${jsCode}
          
          // Component safety wrapper
          if (typeof App === 'undefined') {
            console.warn('App component not found, using fallback component');
            function App() {
              return React.createElement('div', {
                style: { 
                  padding: '40px', 
                  textAlign: 'center', 
                  fontFamily: 'system-ui, sans-serif',
                  color: '#666',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  margin: '20px'
                }
              }, [
                React.createElement('h3', { key: 'title', style: { margin: '0 0 16px 0' } }, '⚠️ Component Not Found'),
                React.createElement('p', { key: 'message', style: { margin: '0', lineHeight: '1.5' } }, 
                  'The generated React component could not be rendered. Please try generating again with a different prompt.')
              ]);
            }
          }

          // Render with React 18 createRoot API
          const rootElement = document.getElementById('root');
          if (rootElement) {
            const root = ReactDOM.createRoot(rootElement);
            root.render(React.createElement(App));
          } else {
            console.error('Root element not found');
          }
        } catch (error) {
          console.error('Bundle execution error:', error);
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = \`
              <div style="color: #d73a49; padding: 20px; border: 1px solid #d73a49; border-radius: 6px; margin: 20px; font-family: system-ui, sans-serif;">
                <h4 style="margin: 0 0 12px 0;">❌ Bundle Execution Error</h4>
                <p style="margin: 0; font-family: monospace; font-size: 14px;">\${error.message}</p>
              </div>
            \`;
          }
        }
    </script>
</body>
</html>`
  }

  private getModuleId(path: string): string {
    if (!this.resolvedModules.has(path)) {
      this.resolvedModules.set(path, `module_${this.resolvedModules.size}`)
    }
    return this.resolvedModules.get(path)!
  }
}

// Helper function to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}