/**
 * React Fast Refresh runtime integration
 * Enables state preservation during component updates
 */

export interface RefreshRuntime {
  register: (type: any, id: string) => void
  createSignatureFunctionForTransform: () => (type: any, key: string, forceReset?: boolean, getCustomHooks?: () => any[]) => any
  isLikelyComponentType: (type: any) => boolean
  collectCustomHooksForSignature: (type: any) => any[] | null
  getFamilyByType: (type: any) => any
  hasUnrecoverableErrors: () => boolean
  findAffectedHostInstances: (families: Set<any>) => Set<any>
  injectIntoGlobalHook: (globalObject: any) => void
  performReactRefresh: () => void
}

declare global {
  interface Window {
    $RefreshReg$: (type: any, id: string) => void
    $RefreshSig$: () => (type: any, key: string, forceReset?: boolean, getCustomHooks?: () => any[]) => any
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any
    ReactRefreshRuntime?: RefreshRuntime
  }
}

export class ReactRefreshService {
  private isInitialized = false
  private pendingUpdates = new Set<string>()
  private componentSignatures = new Map<string, any>()
  private lastUpdateId = 0

  /**
   * Initialize React Refresh runtime
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load React Refresh runtime from CDN
      await this.loadRefreshRuntime()
      
      // Setup global functions for transformed code
      this.setupGlobalFunctions()
      
      // Initialize the runtime
      this.initializeRuntime()
      
      this.isInitialized = true
      console.log('🔄 React Refresh runtime initialized')
    } catch (error) {
      console.error('Failed to initialize React Refresh:', error)
      throw error
    }
  }

  /**
   * Load React Refresh runtime script with polyfills
   */
  private async loadRefreshRuntime(): Promise<void> {
    // Add browser polyfills first
    this.addBrowserPolyfills()
    
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.ReactRefreshRuntime) {
        resolve()
        return
      }

      // Try multiple CDN sources for React Refresh
      const sources = [
        'https://unpkg.com/@vitejs/plugin-react@4.0.0/dist/refresh-runtime.js',
        'https://cdn.skypack.dev/@vitejs/plugin-react@4.0.0/dist/refresh-runtime.js',
        'https://esm.sh/@vitejs/plugin-react@4.0.0/dist/refresh-runtime.js'
      ]

      this.tryLoadScript(sources, 0, resolve, reject)
    })
  }

  /**
   * Try loading script from multiple sources
   */
  private tryLoadScript(
    sources: string[], 
    index: number, 
    resolve: () => void, 
    reject: (error: Error) => void
  ): void {
    if (index >= sources.length) {
      // All sources failed, create minimal refresh runtime
      this.createMinimalRefreshRuntime()
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = sources[index]
    
    script.onload = () => {
      // Check for various runtime locations
      const runtime = window.ReactRefreshRuntime || 
                      (window as any).__vite_plugin_react_preamble_installed__ ||
                      (window as any).RefreshRuntime

      if (runtime) {
        if (!window.ReactRefreshRuntime) {
          window.ReactRefreshRuntime = runtime
        }
        resolve()
      } else {
        // Try next source
        this.tryLoadScript(sources, index + 1, resolve, reject)
      }
    }
    
    script.onerror = () => {
      // Try next source
      this.tryLoadScript(sources, index + 1, resolve, reject)
    }
    
    document.head.appendChild(script)
  }

  /**
   * Add necessary browser polyfills
   */
  private addBrowserPolyfills(): void {
    // Add process polyfill
    if (typeof (window as any).process === 'undefined') {
      (window as any).process = {
        env: { NODE_ENV: 'development' }
      }
    }

    // Add global polyfill if needed
    if (typeof (window as any).global === 'undefined') {
      (window as any).global = window
    }
  }

  /**
   * Create minimal React Refresh runtime fallback
   */
  private createMinimalRefreshRuntime(): void {
    const minimalRuntime = {
      register: (type: any, id: string) => {
        // Minimal registration - just store for debugging
        console.debug('Refresh register:', id, type)
      },
      createSignatureFunctionForTransform: () => {
        return (type: any, key: string) => {
          console.debug('Refresh signature:', key, type)
          return type
        }
      },
      isLikelyComponentType: (type: any) => {
        return typeof type === 'function'
      },
      collectCustomHooksForSignature: () => null,
      getFamilyByType: () => null,
      hasUnrecoverableErrors: () => false,
      findAffectedHostInstances: () => new Set(),
      injectIntoGlobalHook: () => {},
      performReactRefresh: () => {
        console.warn('React Refresh not available, using minimal fallback')
      }
    }

    window.ReactRefreshRuntime = minimalRuntime
    console.log('🔄 Using minimal React Refresh runtime fallback')
  }

  /**
   * Setup global functions that transformed code will use
   */
  private setupGlobalFunctions(): void {
    const runtime = window.ReactRefreshRuntime!

    // Register function for components
    window.$RefreshReg$ = (type: any, id: string) => {
      if (type != null && (typeof type === 'function' || typeof type === 'object')) {
        runtime.register(type, id)
      }
    }

    // Signature function for Hot Module Replacement
    window.$RefreshSig$ = runtime.createSignatureFunctionForTransform()
  }

  /**
   * Initialize the runtime with React DevTools integration
   */
  private initializeRuntime(): void {
    const runtime = window.ReactRefreshRuntime!
    
    // Integrate with React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      runtime.injectIntoGlobalHook(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
    }
  }

  /**
   * Transform component code to include Refresh integration
   */
  transformCodeForRefresh(code: string, filename: string): string {
    if (!this.isInitialized) {
      return code
    }

    // Generate unique component IDs based on filename
    const componentMatches = code.match(/(function|const|let|var)\s+([A-Z][a-zA-Z0-9_]*)/g) || []
    let transformedCode = code

    componentMatches.forEach((match, index) => {
      const componentName = match.split(/\s+/)[1]
      const componentId = `${filename}%${componentName}%${index}`
      
      // Add refresh registration after component definition
      const registrationCode = `
if (typeof $RefreshReg$ !== 'undefined') {
  $RefreshReg$(${componentName}, "${componentId}");
}`

      // Insert registration after component definition
      const componentRegex = new RegExp(`(${match}[\\s\\S]*?(?=\\n\\n|\\nconst|\\nlet|\\nvar|\\nfunction|$))`, 'g')
      transformedCode = transformedCode.replace(componentRegex, `$1\n${registrationCode}`)
    })

    // Add signature tracking for hooks
    transformedCode = this.addHookSignatures(transformedCode, filename)

    return transformedCode
  }

  /**
   * Add hook signatures for better Hot Module Replacement
   */
  private addHookSignatures(code: string, filename: string): string {
    // Find function components that use hooks
    const functionComponentRegex = /(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)[^{]*\{([^}]*(?:use[A-Z][a-zA-Z0-9_]*)[^}]*)\}/gs
    
    return code.replace(functionComponentRegex, (match, componentName, body) => {
      if (body.includes('use')) {
        const signatureId = `${filename}%${componentName}%signature`
        return `
${match}

if (typeof $RefreshSig$ !== 'undefined') {
  ${componentName} = $RefreshSig$()(${componentName}, "${signatureId}");
}
`
      }
      return match
    })
  }

  /**
   * Perform refresh update
   */
  performRefresh(): boolean {
    if (!this.isInitialized) {
      return false
    }

    const runtime = window.ReactRefreshRuntime!
    
    try {
      // Check for unrecoverable errors
      if (runtime.hasUnrecoverableErrors()) {
        console.warn('React Refresh detected unrecoverable errors, performing full reload')
        return false
      }

      // Perform the refresh
      runtime.performReactRefresh()
      
      console.log('🔄 React Refresh update applied')
      return true
    } catch (error) {
      console.error('React Refresh failed:', error)
      return false
    }
  }

  /**
   * Check if runtime is ready
   */
  isReady(): boolean {
    return this.isInitialized && !!window.ReactRefreshRuntime
  }

  /**
   * Create refresh-enabled HTML wrapper
   */
  createRefreshHTML(jsCode: string, cssCode: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/react-refresh@0.14.0/runtime.js"></script>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      ${cssCode}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        // Initialize React Refresh
        if (window.ReactRefreshRuntime) {
          window.ReactRefreshRuntime.injectIntoGlobalHook(window);
          
          window.$RefreshReg$ = (type, id) => {
            window.ReactRefreshRuntime.register(type, id);
          };
          
          window.$RefreshSig$ = window.ReactRefreshRuntime.createSignatureFunctionForTransform();
        }
        
        try {
          // Component code with Refresh integration
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
            
            if (typeof $RefreshReg$ !== 'undefined') {
              $RefreshReg$(App, 'fallback%App');
            }
          }

          // Initial render
          const rootElement = document.getElementById('root');
          if (rootElement && typeof ReactDOM !== 'undefined') {
            const root = ReactDOM.createRoot(rootElement);
            root.render(React.createElement(App));
            
            // Store root for hot updates
            window.__REACT_ROOT__ = root;
          } else {
            console.error('Root element or ReactDOM not found');
          }
          
          // Listen for refresh updates from parent
          window.addEventListener('message', function(event) {
            if (event.data.type === 'react-refresh-update') {
              if (window.ReactRefreshRuntime && !window.ReactRefreshRuntime.hasUnrecoverableErrors()) {
                window.ReactRefreshRuntime.performReactRefresh();
              } else {
                // Full reload needed
                window.location.reload();
              }
            }
          });
          
        } catch (error) {
          console.error('Component execution error:', error);
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = \`
              <div style="color: #d73a49; padding: 20px; border: 1px solid #d73a49; border-radius: 6px; margin: 20px; font-family: system-ui, sans-serif;">
                <h4 style="margin: 0 0 12px 0;">❌ Component Execution Error</h4>
                <p style="margin: 0; font-family: monospace; font-size: 14px;">\${error.message}</p>
              </div>
            \`;
          }
        }
    </script>
</body>
</html>`
  }

  /**
   * Reset the refresh runtime (for cleanup)
   */
  reset(): void {
    this.pendingUpdates.clear()
    this.componentSignatures.clear()
    this.lastUpdateId = 0
  }
}