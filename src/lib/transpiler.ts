import { transformReactComponent, initializeEsbuild, isEsbuildInitialized } from '../lib/esbuild'

export interface TranspilerResult {
  code: string
  error?: string
  warnings?: any[]
}

export class TranspilerService {
  private static instance: TranspilerService | null = null
  private initializationPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): TranspilerService {
    if (!TranspilerService.instance) {
      TranspilerService.instance = new TranspilerService()
    }
    return TranspilerService.instance
  }

  /**
   * Initialize the transpiler service
   */
  async initialize(): Promise<void> {
    if (isEsbuildInitialized()) {
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = initializeEsbuild()
    return this.initializationPromise
  }

  /**
   * Transpile JSX/React code to JavaScript
   */
  async transpileReactCode(code: string): Promise<TranspilerResult> {
    try {
      await this.initialize()
      
      const startTime = performance.now()
      const transformedCode = await transformReactComponent(code)
      const endTime = performance.now()

      console.log(`⚡ esbuild transpilation completed in ${(endTime - startTime).toFixed(2)}ms`)

      return {
        code: transformedCode,
        warnings: []
      }
    } catch (error) {
      console.warn('esbuild transpilation failed, falling back to Babel:', error)
      return this.fallbackToBabelTranspilation(code)
    }
  }

  /**
   * Fallback to browser Babel transpilation
   */
  private fallbackToBabelTranspilation(code: string): TranspilerResult {
    try {
      const startTime = performance.now()
      
      console.log('🔄 Using Babel fallback for JSX transpilation')
      console.log('Input code preview:', code.substring(0, 200) + (code.length > 200 ? '...' : ''))
      
      // Simple JSX transformation for fallback
      let transformedCode = this.basicJSXTransform(code)
      
      const endTime = performance.now()
      console.log(`📚 Babel fallback completed in ${(endTime - startTime).toFixed(2)}ms`)
      console.log('Output code preview:', transformedCode.substring(0, 200) + (transformedCode.length > 200 ? '...' : ''))

      // Validate generated code for basic syntax
      try {
        new Function(transformedCode)
        console.log('✅ Generated code passed basic syntax validation')
      } catch (syntaxError) {
        console.warn('⚠️ Generated code has syntax issues:', syntaxError)
        return {
          code: '',
          error: `Generated code has syntax errors: ${syntaxError instanceof Error ? syntaxError.message : 'Unknown syntax error'}`
        }
      }

      // Check if App component exists in the transformed code
      const hasAppComponent = /(?:function\s+App|const\s+App\s*=|var\s+App\s*=|let\s+App\s*=)/.test(transformedCode)
      if (!hasAppComponent) {
        console.warn('⚠️ No App component found in transformed code')
        
        // Try to extract any component function and rename it to App
        const componentMatch = transformedCode.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|var\s+(\w+)\s*=|let\s+(\w+)\s*=).*?React\.createElement/)
        if (componentMatch) {
          const componentName = componentMatch[1] || componentMatch[2] || componentMatch[3] || componentMatch[4]
          console.log(`🔄 Found component '${componentName}', renaming to 'App'`)
          transformedCode = transformedCode.replace(new RegExp(`\\b${componentName}\\b`, 'g'), 'App')
        } else {
          console.warn('⚠️ No React components found in code')
        }
      }

      return {
        code: transformedCode,
        warnings: [
          'Using Babel fallback due to esbuild WASM initialization failure',
          'Basic JSX transformation - complex features may not work correctly'
        ]
      }
    } catch (fallbackError) {
      console.error('❌ Babel fallback failed:', fallbackError)
      return {
        code: '',
        error: `Both esbuild and fallback transpilation failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Basic JSX transformation without full transpilation
   */
  private basicJSXTransform(code: string): string {
    // Remove imports for browser compatibility but preserve the component structure
    let transformed = code
      .replace(/^\s*import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    
    // Handle exports more carefully - preserve function declarations
    transformed = transformed
      .replace(/export\s+default\s+(function\s+\w+)/g, '$1') // export default function App -> function App
      .replace(/export\s+default\s+(const\s+\w+\s*=)/g, '$1') // export default const App = -> const App =  
      .replace(/export\s+(function\s+\w+)/g, '$1') // export function App -> function App
      .replace(/export\s+(const\s+\w+\s*=)/g, '$1') // export const App = -> const App =
      .replace(/^\s*export\s*\{\s*.*?\s*\}\s*;?\s*$/gm, '') // Remove export { ... } statements

    // Transform self-closing JSX elements first
    transformed = transformed
      .replace(/<(\w+)([^>]*?)\/>/gs, (_match, tag, props) => {
        const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
        return `React.createElement('${tag}'${propsStr})`
      })

    // Transform JSX elements with children
    // Use iterative approach for nested elements
    let lastTransformed = ''
    let iterations = 0
    const maxIterations = 10
    
    while (transformed !== lastTransformed && iterations < maxIterations) {
      lastTransformed = transformed
      transformed = transformed
        .replace(/<(\w+)([^>]*?)>(.*?)<\/\1>/gs, (_match, tag, props, children) => {
          const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
          const childrenStr = children.trim() ? `, ${this.parseChildren(children)}` : ''
          return `React.createElement('${tag}'${propsStr}${childrenStr})`
        })
      iterations++
    }

    // Handle React Fragments (after JSX transformation to avoid conflicts)
    transformed = transformed
      .replace(/<React\.Fragment([^>]*)>/g, (_match, props) => {
        const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
        return `React.createElement(React.Fragment${propsStr}`
      })
      .replace(/<\/React\.Fragment>/g, ')')
      .replace(/<>/g, 'React.createElement(React.Fragment, null, ')
      .replace(/<\/>/g, ')')

    return transformed
  }

  /**
   * Parse JSX props to object literal
   */
  private parseProps(propsStr: string): string {
    if (!propsStr.trim()) return 'null'
    
    const props: string[] = []
    const cleaned = propsStr.trim()
    
    // Match attribute patterns: name="value", name={expression}, name (boolean)
    const attrRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]+)\}))?/g
    let match
    
    while ((match = attrRegex.exec(cleaned)) !== null) {
      const [, name, doubleQuoted, singleQuoted, expression] = match
      
      if (doubleQuoted !== undefined) {
        // String value with double quotes
        props.push(`${name}: "${doubleQuoted}"`)
      } else if (singleQuoted !== undefined) {
        // String value with single quotes  
        props.push(`${name}: "${singleQuoted}"`)
      } else if (expression !== undefined) {
        // JavaScript expression in braces
        props.push(`${name}: ${expression}`)
      } else {
        // Boolean attribute
        props.push(`${name}: true`)
      }
    }
    
    return props.length > 0 ? `{${props.join(', ')}}` : 'null'
  }

  /**
   * Parse JSX children
   */
  private parseChildren(children: string): string {
    if (!children.trim()) return ''
    
    const trimmed = children.trim()
    
    // If it's just text content, wrap in quotes and escape
    if (!trimmed.includes('<') && !trimmed.includes('{')) {
      // Escape quotes and newlines in text content
      const escaped = trimmed
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
      return `"${escaped}"`
    }
    
    // If contains JSX elements, it should already be transformed by parent regex
    // If contains expressions {}, return as-is
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed.slice(1, -1) // Remove outer braces
    }
    
    // For mixed content or already transformed content
    return trimmed
  }

  /**
   * Check if transpiler is ready
   */
  isReady(): boolean {
    return isEsbuildInitialized()
  }

  /**
   * Prepare React component HTML with transpiled code
   */
  async createReactHTML(
    componentCode: string, 
    cssCode: string = ''
  ): Promise<string> {
    const transpileResult = await this.transpileReactCode(componentCode)
    
    if (transpileResult.error) {
      return this.createErrorHTML(transpileResult.error)
    }

    const transpiledCode = transpileResult.code
    const handlesOwnRender = /ReactDOM\.render\s*\(.*\)/.test(transpiledCode) ||
      /ReactDOM\.createRoot\s*\(/.test(transpiledCode) ||
      /\broot\.render\s*\(.*\)/.test(transpiledCode)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>

    <!-- Tailwind CSS for modern styling -->
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

    <!-- Lucide Icons for modern iconography -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <!-- Chart.js for data visualization -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- Animate.css for smooth animations -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">

    <!-- Modern utilities -->
    <script>
      // Make Lucide icons available globally for React components
      window.LucideIcons = lucide;

      // Create icon component helper
      window.createIcon = function(iconName, props = {}) {
        const iconElement = document.createElement('i');
        iconElement.setAttribute('data-lucide', iconName);
        Object.keys(props).forEach(key => {
          iconElement.style[key] = props[key];
        });
        return iconElement.outerHTML;
      };

      // Modern color utilities
      window.modernColors = {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        gradients: {
          primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        }
      };
    </script>

    <style>
      *, *::before, *::after { box-sizing: border-box; }
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      body {
        margin: 0;
        padding: 56px 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: #f8fafc;
      }

      @media (max-width: 768px) {
        body {
          padding: 36px 20px;
        }
      }

      #root {
        width: 100%;
        max-width: 960px;
        margin: 0 auto;
      }

      #root > * {
        background: rgba(15, 23, 42, 0.55);
        border-radius: 24px;
        padding: 36px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(22px);
      }

      @media (max-width: 768px) {
        #root > * {
          padding: 28px;
          border-radius: 20px;
        }
      }

      body.full-screen-app {
        padding: 0;
      }

      body.full-screen-app #root {
        max-width: none;
      }

      body.full-screen-app #root > * {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        backdrop-filter: none;
      }

      h1, h2, h3, h4, h5, h6 {
        margin: 0 0 18px;
        color: #f8fafc;
        letter-spacing: 0.02em;
      }

      p, span, label {
        color: rgba(248, 250, 252, 0.82);
        line-height: 1.6;
      }

      form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 20px;
      }

      input,
      textarea,
      select {
        flex: 1 1 220px;
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.45);
        color: #f8fafc;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      }

      input::placeholder,
      textarea::placeholder {
        color: rgba(248, 250, 252, 0.55);
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color: rgba(244, 114, 182, 0.7);
        box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.25);
        transform: translateY(-1px);
      }

      input[type='checkbox'],
      input[type='radio'] {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        accent-color: #a855f7;
        margin-right: 8px;
      }

      button {
        flex: 0 0 auto;
        padding: 14px 20px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        color: #f8fafc;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 12px 25px rgba(168, 85, 247, 0.35);
      }

      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 30px rgba(168, 85, 247, 0.45);
      }

      button:active {
        transform: translateY(0);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 24px 0 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 20px;
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 20px 35px rgba(15, 23, 42, 0.32);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      li:hover {
        transform: translateY(-3px);
        box-shadow: 0 28px 40px rgba(15, 23, 42, 0.4);
      }

      li > span,
      li > p {
        flex: 1 1 auto;
      }

      li button {
        flex: 0 0 auto;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 14px;
        box-shadow: none;
        background: rgba(148, 163, 184, 0.18);
        border: 1px solid rgba(248, 250, 252, 0.18);
        transition: background 0.2s ease, border-color 0.2s ease;
      }

      li button:hover {
        background: rgba(248, 250, 252, 0.22);
        border-color: rgba(248, 250, 252, 0.4);
      }

      .tag,
      .pill,
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.18);
        color: rgba(248, 250, 252, 0.85);
        font-size: 13px;
        letter-spacing: 0.03em;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        border-radius: 18px;
        overflow: hidden;
        background: rgba(15, 23, 42, 0.58);
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      th, td {
        padding: 16px 20px;
        text-align: left;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        color: rgba(248, 250, 252, 0.85);
      }

      tr:last-child td {
        border-bottom: none;
      }

      /* Modern animation utilities */
      .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
      .animate-slide-up { animation: slideUp 0.3s ease-out; }
      .hover-scale { transition: transform 0.2s ease-in-out; }
      .hover-scale:hover { transform: scale(1.02); }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      /* Glassmorphism utilities */
      .glass {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .glass-dark {
        backdrop-filter: blur(10px);
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* Modern gradients */
      .gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .gradient-secondary { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      .gradient-success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      .gradient-warning { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

      /* Custom component styles */
      ${cssCode}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        try {
          // Transpiled component code
          ${transpiledCode}
          
          // Component safety wrapper
          if (typeof App === 'undefined') {
            console.warn('App component not found, using fallback component');
            function App() {
              return React.createElement('div', {
                className: 'min-h-screen flex items-center justify-center p-8',
                style: {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
              }, [
                React.createElement('div', {
                  key: 'container',
                  className: 'glass max-w-md w-full p-8 rounded-2xl shadow-2xl animate-fade-in',
                  style: {
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }
                }, [
                  React.createElement('div', {
                    key: 'icon',
                    className: 'w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center',
                    style: {
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }
                  }, [
                    React.createElement('span', {
                      key: 'emoji',
                      style: { fontSize: '32px' }
                    }, '⚡')
                  ]),
                  React.createElement('h3', {
                    key: 'title',
                    className: 'text-2xl font-bold text-white text-center mb-4'
                  }, 'Component Loading'),
                  React.createElement('p', {
                    key: 'message',
                    className: 'text-white/80 text-center leading-relaxed'
                  }, 'The React component is being prepared. If this persists, try generating again with a different prompt.'),
                  React.createElement('div', {
                    key: 'loading',
                    className: 'mt-6 flex justify-center'
                  }, [
                    React.createElement('div', {
                      key: 'spinner',
                      className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-white'
                    })
                  ])
                ])
              ]);
            }
          }

          // Render with React 18 createRoot API
          const rootElement = document.getElementById('root');
          if (!${handlesOwnRender ? 'true' : 'false'}) {
            if (rootElement) {
              if (window.previewShell?.hasUserRender?.()) {
                console.log('Skipping auto-render: component mounted itself');
                queueMicrotask(() => window.previewShell?.applyHints());
              } else {
                const root = ReactDOM.createRoot(rootElement);
                root.render(React.createElement(App));

                queueMicrotask(() => window.previewShell?.applyHints());
              }

              // Initialize Lucide icons after React render
              setTimeout(() => {
                if (window.lucide && window.lucide.createIcons) {
                  window.lucide.createIcons();
                }
              }, 100);
            } else {
              console.error('Root element not found');
            }
          } else if (!rootElement) {
            console.warn('App handled its own render but #root is missing');
          }
        } catch (error) {
          console.error('React render error:', error);
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = \`
              <div style="color: #d73a49; padding: 20px; border: 1px solid #d73a49; border-radius: 6px; margin: 20px; font-family: system-ui, sans-serif;">
                <h4 style="margin: 0 0 12px 0;">❌ React Render Error</h4>
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
   * Create error HTML when transpilation fails
   */
  private createErrorHTML(error: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transpilation Error</title>
    <style>
      body { 
        margin: 0; 
        padding: 20px; 
        font-family: system-ui, sans-serif;
        background: #f8f9fa;
      }
    </style>
</head>
<body>
    <div style="color: #d73a49; padding: 20px; border: 1px solid #d73a49; border-radius: 6px; background: white;">
      <h3 style="margin: 0 0 12px 0;">⚠️ Transpilation Error</h3>
      <p style="margin: 0; font-family: monospace; font-size: 14px; white-space: pre-wrap;">${error}</p>
    </div>
</body>
</html>`
  }
}
