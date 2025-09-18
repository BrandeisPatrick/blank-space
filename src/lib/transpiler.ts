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
      .replace(/<(\w+)([^>]*?)\/>/gs, (match, tag, props) => {
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
        .replace(/<(\w+)([^>]*?)>(.*?)<\/\1>/gs, (match, tag, props, children) => {
          const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
          const childrenStr = children.trim() ? `, ${this.parseChildren(children)}` : ''
          return `React.createElement('${tag}'${propsStr}${childrenStr})`
        })
      iterations++
    }

    // Handle React Fragments (after JSX transformation to avoid conflicts)
    transformed = transformed
      .replace(/<React\.Fragment([^>]*)>/g, (match, props) => {
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
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
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
              const root = ReactDOM.createRoot(rootElement);
              root.render(React.createElement(App));

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
