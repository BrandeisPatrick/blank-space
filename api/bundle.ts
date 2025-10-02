import type { VercelRequest, VercelResponse } from '@vercel/node'
import { transform as sucraseTransform } from 'sucrase'

interface BundleRequest {
  files: Record<string, string>
  entryPoint: string
  target?: 'es2020' | 'es2022'
  format?: 'iife' | 'esm' | 'cjs'
}

interface ModuleBundleResult {
  code: string
  css: string
  html: string
  error?: string
  warnings?: string[]
  dependencies: string[]
}

interface ModuleBundleOptions {
  entryPoint: string
  target?: 'es2020' | 'es2022'
  format?: 'iife' | 'esm' | 'cjs'
}

// Inline ModuleBundler class to avoid import issues in serverless
class ModuleBundler {
  private files: Record<string, string> = {}
  private processedFiles: Set<string> = new Set()

  constructor() {}

  // Extract metadata from generated index.html
  private extractHtmlMetadata(html: string): {
    title: string
    cdnScripts: string[]
    customStyles: string
    bodyClass: string
  } {
    const metadata = {
      title: 'React App', // fallback
      cdnScripts: [] as string[],
      customStyles: '',
      bodyClass: ''
    }

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    if (titleMatch) {
      metadata.title = titleMatch[1]
    }

    // Extract CDN scripts (Tailwind, Chart.js, etc.)
    const scriptRegex = /<script[^>]*src=["']([^"']+cdn[^"']+)["'][^>]*><\/script>/gi
    let scriptMatch
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      metadata.cdnScripts.push(scriptMatch[0])
    }

    // Extract custom styles from <style> tag
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
    if (styleMatch) {
      metadata.customStyles = styleMatch[1]
    }

    // Extract body class
    const bodyMatch = html.match(/<body[^>]*class=["']([^"']+)["']/i)
    if (bodyMatch) {
      metadata.bodyClass = bodyMatch[1]
    }

    return metadata
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    const cleanPath = importPath.replace(/['"]/g, '')

    if (!cleanPath.startsWith('.')) {
      return null
    }

    const currentDir = currentFile.includes('/')
      ? currentFile.substring(0, currentFile.lastIndexOf('/'))
      : ''

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

    const extensions = ['.tsx', '.ts', '.jsx', '.js']
    for (const ext of extensions) {
      if (this.files[resolvedPath + ext]) {
        return resolvedPath + ext
      }
    }

    if (this.files[resolvedPath]) {
      return resolvedPath
    }

    return null
  }

  private processFile(filePath: string): string {
    if (this.processedFiles.has(filePath)) {
      return ''
    }

    const content = this.files[filePath]
    if (!content) {
      return `// File not found: ${filePath}\n`
    }

    this.processedFiles.add(filePath)

    let processedContent = content
    const importedCode: string[] = []

    const importRegex = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"];?\s*/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[3]

      if (importPath === 'react' || importPath.startsWith('react/')) {
        continue
      }

      if (importPath.endsWith('.css')) {
        continue
      }

      const resolvedPath = this.resolveImportPath(filePath, importPath)
      if (resolvedPath) {
        const importedFileCode = this.processFile(resolvedPath)
        if (importedFileCode) {
          importedCode.push(`\n// Inlined from: ${resolvedPath}`)
          importedCode.push(importedFileCode)
        }
      }
    }

    // Remove ALL imports including CSS imports
    processedContent = processedContent
      .replace(/import\s+(?:\w+|{[^}]+}|\*\s+as\s+\w+)?\s*from\s+['"][^'"]+['"];?\s*/g, '')
      .replace(/import\s+['"][^'"]+['"];?\s*/g, '') // CSS imports without named imports

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

    return importedCode.join('\n') + '\n' + processedContent
  }

  // Strip TypeScript from individual file
  private stripTypeScriptFromFile(content: string, filePath: string): string {
    try {
      // Only process TypeScript files
      if (!filePath.match(/\.tsx?$/)) {
        return content
      }

      console.log(`\n=== BEFORE Sucrase (${filePath}) ===`)
      console.log(content.substring(0, 500)) // First 500 chars

      // Only strip TypeScript types, preserve JSX for browser Babel to handle
      const result = sucraseTransform(content, {
        transforms: ['typescript'],
        // Preserve JSX syntax - don't transform it
        // This prevents duplicate _jsxFileName declarations when bundling
        production: true,
        filePath
      })

      console.log(`\n=== AFTER Sucrase (${filePath}) ===`)
      console.log(result.code.substring(0, 500)) // First 500 chars
      console.log('===\n')

      return result.code
    } catch (error) {
      console.error(`Failed to strip TypeScript from ${filePath}:`, error)
      console.error('Content was:', content.substring(0, 200))
      // Return original content if stripping fails - better to see the error in browser
      return content
    }
  }

  async bundle(
    files: Record<string, string>,
    options: ModuleBundleOptions
  ): Promise<ModuleBundleResult> {
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

    if (options.entryPoint.endsWith('.html')) {
      return {
        code: '',
        css: '',
        html: entryContent,
        dependencies: Object.keys(files)
      }
    }

    const isReact = options.entryPoint.match(/\.(jsx|tsx)$/) ||
                    entryContent.includes('React') ||
                    entryContent.includes('from \'react\'') ||
                    entryContent.includes('from "react"')

    if (isReact) {
      // STEP 1: Strip TypeScript from ALL files BEFORE bundling
      const jsFiles: Record<string, string> = {}
      for (const [path, content] of Object.entries(files)) {
        jsFiles[path] = this.stripTypeScriptFromFile(content, path)
      }

      // STEP 2: Now process with clean JavaScript files
      this.files = jsFiles
      this.processedFiles = new Set()

      let transformedCode = this.processFile(options.entryPoint)

      // Collect CSS after processing
      const cssContent = Object.keys(files)
        .filter(path => path.endsWith('.css'))
        .map(path => files[path])
        .join('\n')

      // Extract metadata from generated index.html (if exists)
      const htmlMetadata = files['index.html']
        ? this.extractHtmlMetadata(files['index.html'])
        : { title: 'React App', cdnScripts: [], customStyles: '', bodyClass: '' }

      transformedCode = transformedCode
        .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (_match, hooks) => {
          const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
          return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
        })
        .replace(/import\s+\*\s+as\s+React\s+from\s+['"]react['"];?\s*/g, '')
        .replace(/import\s+React\s+from\s+['"]react['"];?\s*/g, '')
        .replace(/import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (_match, hooks) => {
          const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
          return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
        })

      const sanitizedCode = transformedCode.replace(/<\/script>/gi, '<\\/script>')

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${htmlMetadata.title}</title>
    ${htmlMetadata.cdnScripts.join('\n    ')}
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        ${htmlMetadata.customStyles}
        ${cssContent}
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body${htmlMetadata.bodyClass ? ` class="${htmlMetadata.bodyClass}"` : ''}>
    <div id="root"></div>
    <script type="text/babel" data-type="module" data-presets="react">
        ${sanitizedCode}

        // Find the main component at runtime
        const functionMatch = /function\\s+(\\w+)/.exec(\`${transformedCode.replace(/`/g, '\\`')}\`);
        const constMatch = /(?:const|let)\\s+(\\w+)\\s*=\\s*(?:\\([^)]*\\)|[^=])*=>/s.exec(\`${transformedCode.replace(/`/g, '\\`')}\`);

        let Component = null;
        let componentName = null;

        if (functionMatch && functionMatch[1]) {
          componentName = functionMatch[1];
          Component = window[componentName] || typeof eval(componentName) !== 'undefined' ? eval(componentName) : null;
        } else if (constMatch && constMatch[1]) {
          componentName = constMatch[1];
          Component = window[componentName] || typeof eval(componentName) !== 'undefined' ? eval(componentName) : null;
        }

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
              // Continue
            }
          }
        }

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
        warnings: ['Using simplified bundler for multi-file React projects.']
      }
    }

    // Collect CSS for non-React files
    const cssContent = Object.keys(files)
      .filter(path => path.endsWith('.css'))
      .map(path => files[path])
      .join('\n')

    return {
      code: entryContent,
      css: cssContent,
      html: '',
      dependencies: Object.keys(files)
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { files, entryPoint, target = 'es2020', format = 'iife' }: BundleRequest = req.body

    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Files object is required' })
    }

    if (!entryPoint || typeof entryPoint !== 'string') {
      return res.status(400).json({ error: 'Entry point is required' })
    }

    if (!files[entryPoint]) {
      return res.status(400).json({
        error: `Entry point "${entryPoint}" not found in files`,
        availableFiles: Object.keys(files)
      })
    }

    const bundler = new ModuleBundler()

    const bundleResult = await bundler.bundle(files, {
      entryPoint,
      format,
      target
    })

    if (bundleResult.error) {
      return res.status(400).json({
        error: 'Bundling failed',
        details: bundleResult.error,
        warnings: bundleResult.warnings
      })
    }

    return res.status(200).json({
      success: true,
      html: bundleResult.html,
      code: bundleResult.code,
      css: bundleResult.css,
      dependencies: bundleResult.dependencies,
      warnings: bundleResult.warnings
    })

  } catch (error) {
    console.error('Bundle API error:', error)

    return res.status(500).json({
      error: 'Internal bundling error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
