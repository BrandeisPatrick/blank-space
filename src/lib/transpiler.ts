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
          // Transpiled component code
          ${transpiledCode}
          
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
          if (!${handlesOwnRender ? 'true' : 'false'}) {
            if (rootElement) {
              const root = ReactDOM.createRoot(rootElement);
              root.render(React.createElement(App));
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
