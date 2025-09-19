import { VirtualFileSystem, VFSFile } from '../lib/vfs'
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

      const entryPath = entryFile.path

      // Collect all modules starting from entry point
      const moduleGraph = await this.buildModuleGraph(vfs, entryPath)
      const warnings: string[] = []

      // Bundle JavaScript modules
      const jsModules: Array<{ id: string; code: string }> = []
      const cssContent: string[] = []
      let entryModuleId: string | null = null

      // Process modules in dependency order
      for (const modulePath of moduleGraph.order) {
        const file = vfs.readFile(modulePath)
        if (!file) continue

        if (file.type === 'css') {
          const moduleId = this.getModuleId(modulePath)

          if (this.isCssModule(file.path)) {
            const { scopedCss, classMap } = this.processCssModule(file.content, moduleId)
            cssContent.push(scopedCss)
            jsModules.push({ id: moduleId, code: this.createCssModuleExport(moduleId, classMap) })
          } else {
            cssContent.push(file.content)
            jsModules.push({ id: moduleId, code: this.createCssSideEffectModule(moduleId) })
          }
        } else if (['js', 'jsx', 'ts', 'tsx'].includes(file.type)) {
          const moduleId = this.getModuleId(modulePath)
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
          
          jsModules.push({ id: moduleId, code: transformed.code })
          if (modulePath === entryPath) {
            entryModuleId = moduleId
          }
          warnings.push(...(transformed.warnings || []))
        }
      }

      // Create final bundle
      const bundledCode = this.createBundle(
        jsModules,
        entryModuleId ?? this.getModuleId(entryPath),
        format
      )
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

    // For the entry module, ensure App component is properly exported
    if (file.path.includes('App.') && (file.path.endsWith('.jsx') || file.path.endsWith('.tsx'))) {
      if (!processedCode.includes('module.exports') && !processedCode.includes('exports.')) {
        processedCode += `

// Ensure App component is exported for bundler
if (typeof App !== "undefined") {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = App;
  }
  if (typeof exports !== "undefined") {
    exports.default = App;
    exports.App = App;
  }
  if (typeof window !== "undefined") {
    window.App = App;
  }
}
`
      }
    }

    return this.transpilerService.transpileReactCode(processedCode)
  }

  /**
   * Create final bundle from transpiled modules
   */
  private createBundle(
    modules: Array<{ id: string; code: string }>,
    entryModuleId: string,
    format: 'iife' | 'esm'
  ): string {
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
          ${modules.map(({ id, code }) => `
            modules['${id}'] = function(module, exports, require) {
              ${code}
            };
          `).join('\n')}

          // Execute entry point and expose App component
          const entryExports = require('${entryModuleId}');

          // Make App component available globally
          if (entryExports && typeof entryExports === 'function') {
            window.App = entryExports;
          } else if (entryExports && entryExports.default && typeof entryExports.default === 'function') {
            window.App = entryExports.default;
          } else if (entryExports && entryExports.App && typeof entryExports.App === 'function') {
            window.App = entryExports.App;
          } else if (typeof App !== 'undefined') {
            // App might be defined directly in the global scope
            window.App = App;
          }
        })();
      `
    } else {
      // ESM format
      return modules.map(module => module.code).join('\n')
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

    <!-- Tailwind CSS for modern utility-first styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
              'slide-up': 'slideUp 0.3s ease-out',
              'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              slideUp: {
                '0%': { transform: 'translateY(10px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              },
            },
          },
        },
      }
    </script>

    <!-- Google Fonts for modern typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- React -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
      (function initializeBlankSpacePreview() {
        const global = window
        const previewShell = global.previewShell || (global.previewShell = {
          applyHints() {
            const rootElement = document.getElementById('root')
            if (!rootElement) return
            const shellTarget = rootElement.firstElementChild
            if (shellTarget && shellTarget.hasAttribute('data-fullscreen')) {
              document.body.classList.add('full-screen-app')
            } else {
              document.body.classList.remove('full-screen-app')
            }
          },
          hasUserRender() {
            return global.__BLANKSPACE_HAS_USER_RENDERED__ === true
          },
          markUserRender() {
            global.__BLANKSPACE_HAS_USER_RENDERED__ = true
          }
        })

        ;(function ensureStorageAvailability() {
          const fallbackFactory = () => {
            let store = {}
            return {
              getItem: (key) => (key in store ? store[key] : null),
              setItem: (key, value) => {
                store[key] = String(value)
              },
              removeItem: (key) => {
                delete store[key]
              },
              clear: () => {
                store = {}
              },
              key: (index) => {
                const keys = Object.keys(store)
                return index >= 0 && index < keys.length ? keys[index] : null
              },
              get length() {
                return Object.keys(store).length
              }
            }
          }

          const ensure = (name) => {
            try {
              const storage = global[name]
              if (!storage) throw new Error('missing')
              storage.setItem('__blankspace-test__', '1')
              storage.removeItem('__blankspace-test__')
            } catch (error) {
              console.warn('Sandbox ' + name + ' unavailable, using in-memory fallback.', error)
              Object.defineProperty(global, name, {
                configurable: true,
                value: fallbackFactory()
              })
            }
          }

          ensure('localStorage')
          ensure('sessionStorage')
        })()

        ;(function patchLegacyRender() {
          if (!global.ReactDOM || !global.ReactDOM.render || global.ReactDOM.__patchedRender) {
            return
          }

          const roots = new WeakMap()
          const originalCreateRoot = global.ReactDOM.createRoot.bind(global.ReactDOM)

          const patchedRender = function renderCompat(element, container, callback) {
            if (!container) {
              throw new Error('Cannot render into a null container')
            }

            let root = roots.get(container)
            if (!root) {
              root = originalCreateRoot(container)
              roots.set(container, root)
            }

            const result = root.render(element)
            previewShell.markUserRender()
            queueMicrotask(() => previewShell.applyHints())

            if (typeof callback === 'function') {
              callback()
            }

            return result
          }

          const wrappedCreateRoot = function wrappedCreateRoot(container, options) {
            const root = originalCreateRoot(container, options)
            const originalRootRender = root.render.bind(root)
            root.render = (...args) => {
              previewShell.markUserRender()
              const value = originalRootRender(...args)
              queueMicrotask(() => previewShell.applyHints())
              return value
            }
            return root
          }

          global.ReactDOM.render = patchedRender
          global.ReactDOM.createRoot = wrappedCreateRoot
          global.ReactDOM.__patchedRender = true
        })()
      })()
    </script>
    <style>
      body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      ${cssCode}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        try {
          ${jsCode}
          
          // Component safety wrapper with better detection
          let AppComponent = window.App;

          if (!AppComponent || typeof AppComponent !== 'function') {
            // Try alternative global names
            AppComponent = window.Component || window.default || window.Main;
          }

          if (!AppComponent || typeof AppComponent !== 'function') {
            console.warn('App component not found, using fallback component');
            AppComponent = function App() {
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
            if (window.previewShell?.hasUserRender?.()) {
              console.log('Skipping auto-render: component mounted itself')
              queueMicrotask(() => window.previewShell?.applyHints())
            } else {
              const root = ReactDOM.createRoot(rootElement);
              root.render(React.createElement(AppComponent));
              queueMicrotask(() => window.previewShell?.applyHints())
            }
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

  private isCssModule(path: string): boolean {
    return /\.module\.(css|scss|sass)$/i.test(path)
  }

  private processCssModule(
    cssContent: string,
    moduleId: string
  ): { scopedCss: string; classMap: Record<string, string> } {
    const classMap: Record<string, string> = {}
    const scopePrefix = moduleId.replace(/[^a-zA-Z0-9_]/g, '_')

    const scopedCss = cssContent.replace(/\.([_a-zA-Z][\w-]*)/g, (match, className) => {
      const scopedName = `${scopePrefix}__${className}`
      classMap[className] = scopedName
      return `.${scopedName}`
    })

    return { scopedCss, classMap }
  }

  private createCssModuleExport(moduleId: string, classMap: Record<string, string>): string {
    const serializedMap = JSON.stringify(classMap)
    return `
const classMap = ${serializedMap};
module.exports = classMap;
module.exports.default = classMap;
Object.defineProperty(module.exports, '__esModule', { value: true });
`
  }

  private createCssSideEffectModule(moduleId: string): string {
    return `
// CSS side-effect module for ${moduleId}
module.exports = {};
module.exports.default = module.exports;
Object.defineProperty(module.exports, '__esModule', { value: true });
`
  }
}

// Helper function to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
