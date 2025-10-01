import { transform as sucraseTransform } from 'sucrase'

export interface ModuleBundleResult {
  code: string
  css: string
  html: string
  error?: string
  warnings?: string[]
  dependencies: string[]
}

export interface ModuleBundleOptions {
  entryPoint: string
  target?: 'es2020' | 'es2022'
  format?: 'iife' | 'esm' | 'cjs'
}

export class ModuleBundler {
  private files: Record<string, string> = {}
  private processedFiles: Set<string> = new Set()
  private bundledCode: string = ''

  constructor() {}

  /**
   * Resolve import path relative to current file
   */
  private resolveImportPath(currentFile: string, importPath: string): string | null {
    // Remove quotes
    const cleanPath = importPath.replace(/['"]/g, '')

    // Skip external packages
    if (!cleanPath.startsWith('.')) {
      return null
    }

    // Get directory of current file
    const currentDir = currentFile.includes('/')
      ? currentFile.substring(0, currentFile.lastIndexOf('/'))
      : ''

    // Resolve relative path
    let resolvedPath = cleanPath
    if (cleanPath.startsWith('./')) {
      resolvedPath = currentDir ? `${currentDir}/${cleanPath.slice(2)}` : cleanPath.slice(2)
    } else if (cleanPath.startsWith('../')) {
      const parts = currentDir.split('/').filter(Boolean)
      let path = cleanPath
      while (path.startsWith('../')) {
        parts.pop()
        path = path.slice(3)
      }
      resolvedPath = parts.length > 0 ? `${parts.join('/')}/${path}` : path
    }

    // Try different extensions
    const extensions = ['.tsx', '.ts', '.jsx', '.js']
    for (const ext of extensions) {
      if (this.files[resolvedPath + ext]) {
        return resolvedPath + ext
      }
    }

    // Try exact path
    if (this.files[resolvedPath]) {
      return resolvedPath
    }

    return null
  }

  /**
   * Process a file and inline its imports
   */
  private processFile(filePath: string): string {
    if (this.processedFiles.has(filePath)) {
      return '' // Already processed
    }

    const content = this.files[filePath]
    if (!content) {
      return `// File not found: ${filePath}\n`
    }

    this.processedFiles.add(filePath)

    let processedContent = content
    const importedCode: string[] = []

    // Find and process all imports
    const importRegex = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"];?\s*/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const defaultImport = match[1]
      const namedImports = match[2]
      const importPath = match[3]

      // Skip react imports - these will be handled separately
      if (importPath === 'react' || importPath.startsWith('react/')) {
        continue
      }

      // Skip CSS imports - these are collected separately
      if (importPath.endsWith('.css')) {
        continue
      }

      const resolvedPath = this.resolveImportPath(filePath, importPath)
      if (resolvedPath) {
        // Recursively process the imported file
        const importedFileCode = this.processFile(resolvedPath)
        if (importedFileCode) {
          importedCode.push(`\n// Inlined from: ${resolvedPath}`)
          importedCode.push(importedFileCode)
        }
      }
    }

    // Remove all imports from this file
    processedContent = processedContent
      .replace(/import\s+(?:\w+|{[^}]+})\s+from\s+['"][^'"]+['"];?\s*/g, '')

    // Remove export statements but keep the declarations
    processedContent = processedContent
      .replace(/export\s+default\s+function\s+/g, 'function ')
      .replace(/export\s+default\s+const\s+/g, 'const ')
      .replace(/export\s+default\s+class\s+/g, 'class ')
      .replace(/export\s+function\s+/g, 'function ')
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+class\s+/g, 'class ')
      .replace(/export\s+default\s+(\w+);?\s*/g, '// export default $1')
      .replace(/export\s+\{[^}]*\};?\s*/g, '')
      .replace(/export\s+(interface|type)\s+/g, '$1 ')

    // Combine imported code with processed content
    return importedCode.join('\n') + '\n' + processedContent
  }

  async bundle(
    files: Record<string, string>,
    options: ModuleBundleOptions
  ): Promise<ModuleBundleResult> {
    // Store files for import resolution
    this.files = files
    this.processedFiles = new Set()
    this.bundledCode = ''

    const entryContent = files[options.entryPoint]

    if (!entryContent) {
      return {
        code: '',
        css: '',
        html: '',
        error: `Entry point not found: ${options.entryPoint}`,
        dependencies: []
      }
    }

    // For basic functionality, just return the file contents
    if (options.entryPoint.endsWith('.html')) {
      return {
        code: '',
        css: '',
        html: entryContent,
        dependencies: Object.keys(files)
      }
    }

    // Collect all CSS files
    const cssContent = Object.keys(files)
      .filter(path => path.endsWith('.css'))
      .map(path => files[path])
      .join('\n')

    // Check if this is a React component
    const isReact = options.entryPoint.match(/\.(jsx|tsx)$/) ||
                    entryContent.includes('React') ||
                    entryContent.includes('from \'react\'') ||
                    entryContent.includes('from "react"')

    if (isReact) {
      // Process the entry file and all its imports
      let transformedCode = this.processFile(options.entryPoint)

      // Strip TypeScript type annotations using Sucrase
      // This removes <generics>, : types, interface, type declarations, etc.
      try {
        const stripped = sucraseTransform(transformedCode, {
          transforms: ['typescript'],
          // Preserve JSX - Babel will handle it in the browser
          filePath: options.entryPoint
        })
        transformedCode = stripped.code
      } catch (error) {
        console.warn('TypeScript stripping failed, continuing with original code:', error)
        // Continue with original code if stripping fails
      }

      // Transform React imports to work with CDN-loaded React
      transformedCode = transformedCode
        // Remove React imports and replace with global React
        .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (match, hooks) => {
          // Extract hook names
          const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
          // Create destructuring from React global
          return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
        })
        .replace(/import\s+\*\s+as\s+React\s+from\s+['"]react['"];?\s*/g, '')
        .replace(/import\s+React\s+from\s+['"]react['"];?\s*/g, '')
        .replace(/import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (match, hooks) => {
          const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
          return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
        })

      const sanitizedCode = transformedCode.replace(/<\/script>/gi, '<\\/script>')

      // Generate complete HTML for React component
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        ${cssContent}
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module" data-presets="react,typescript">
        ${sanitizedCode}

        // Find the main component at runtime
        // Check for function components
        const functionMatch = /function\s+(\w+)/.exec(\`${transformedCode.replace(/`/g, '\\`')}\`);
        // Check for const/let arrow function components
        const constMatch = /(?:const|let)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])*=>/s.exec(\`${transformedCode.replace(/`/g, '\\`')}\`);

        let Component = null;
        let componentName = null;

        // Try to find the component
        if (functionMatch && functionMatch[1]) {
          componentName = functionMatch[1];
          Component = window[componentName] || typeof eval(componentName) !== 'undefined' ? eval(componentName) : null;
        } else if (constMatch && constMatch[1]) {
          componentName = constMatch[1];
          Component = window[componentName] || typeof eval(componentName) !== 'undefined' ? eval(componentName) : null;
        }

        // Fallback to common component names
        if (!Component) {
          const fallbackNames = ['App', 'Main', 'Root', 'Component'];
          for (const name of fallbackNames) {
            if (typeof window[name] !== 'undefined') {
              Component = window[name];
              componentName = name;
              break;
            }
            try {
              const evalComponent = eval(name);
              if (typeof evalComponent === 'function') {
                Component = evalComponent;
                componentName = name;
                break;
              }
            } catch (e) {
              // Continue to next fallback
            }
          }
        }

        // Render the component if found
        if (Component) {
          try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(Component));
          } catch (error) {
            console.error('Failed to render component:', error);
            document.getElementById('root').innerHTML = \`
              <div style="color: red; padding: 20px; font-family: system-ui;">
                <h3>Render Error</h3>
                <pre>\${error.message}</pre>
                <p>Component: \${componentName}</p>
              </div>
            \`;
          }
        } else {
          console.error('No React component found');
          document.getElementById('root').innerHTML = \`
            <div style="color: red; padding: 20px; font-family: system-ui;">
              <h3>Component Not Found</h3>
              <p>Could not find a valid React component to render.</p>
              <p>Make sure your component is properly defined as a function.</p>
            </div>
          \`;
        }
    </script>
</body>
</html>`

      return {
        code: transformedCode,
        css: cssContent,
        html,
        dependencies: Object.keys(files),
        warnings: ['Using simplified bundler for multi-file React projects. Some features may not work.']
      }
    }

    // For non-React files, return basic bundle
    return {
      code: entryContent,
      css: cssContent,
      html: '',
      dependencies: Object.keys(files)
    }
  }
}
