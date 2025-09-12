import { transformReactComponent, initializeEsbuild, isEsbuildInitialized } from '../utils/esbuild'

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
      
      // Simple JSX transformation for fallback
      const transformedCode = this.basicJSXTransform(code)
      
      const endTime = performance.now()
      console.log(`📚 Babel fallback completed in ${(endTime - startTime).toFixed(2)}ms`)

      return {
        code: transformedCode,
        warnings: ['Using Babel fallback due to esbuild initialization failure']
      }
    } catch (fallbackError) {
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
    // Remove imports and exports for browser compatibility
    let transformed = code
      .replace(/^\s*import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
      .replace(/^\s*export\s+.*?$/gm, '')
      .replace(/export\s+default\s+/, '')
      .replace(/export\s+/, '')

    // Simple JSX to React.createElement transformation
    // This is very basic - just enough to get components working
    transformed = transformed
      .replace(/<(\w+)([^>]*?)>(.*?)<\/\1>/gs, (match, tag, props, children) => {
        const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
        const childrenStr = children.trim() ? `, ${this.parseChildren(children)}` : ''
        return `React.createElement('${tag}'${propsStr}${childrenStr})`
      })
      .replace(/<(\w+)([^>]*?)\/>/gs, (match, tag, props) => {
        const propsStr = props.trim() ? `, ${this.parseProps(props)}` : ''
        return `React.createElement('${tag}'${propsStr})`
      })

    return transformed
  }

  /**
   * Parse JSX props to object literal
   */
  private parseProps(propsStr: string): string {
    if (!propsStr.trim()) return 'null'
    
    // Very basic prop parsing - just return as object
    const cleaned = propsStr.trim().replace(/\s+/g, ' ')
    if (cleaned.includes('=')) {
      return `{${cleaned.replace(/(\w+)=\{([^}]+)\}/g, '$1: $2').replace(/(\w+)="([^"]+)"/g, '$1: "$2"')}}`
    }
    return 'null'
  }

  /**
   * Parse JSX children
   */
  private parseChildren(children: string): string {
    if (!children.trim()) return ''
    
    // If it's just text, wrap in quotes
    if (!children.includes('<')) {
      return `"${children.trim()}"`
    }
    
    // For complex children, just return as-is (likely already transformed)
    return children.trim()
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
          ${transpileResult.code}
          
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