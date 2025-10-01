export interface CodeTranspilerResult {
  code: string
  map?: string
  error?: string
  warnings?: string[]
}

export class TranspilerService {
  private static instance: TranspilerService

  constructor() {}

  static getInstance(): TranspilerService {
    if (!TranspilerService.instance) {
      TranspilerService.instance = new TranspilerService()
    }
    return TranspilerService.instance
  }

  async initialize(): Promise<void> {
    // Simplified initialization
  }

  async transpile(
    code: string,
    _filename: string
  ): Promise<CodeTranspilerResult> {
    // Simplified transpiler that just returns the code as-is
    return {
      code,
      warnings: []
    }
  }

  createReactHTML(
    componentCode: string,
    cssCode: string = '',
    allFiles: Record<string, string> = {}
  ): string {
    // Strip ES6 module syntax and transform for browser environment
    let cleanedCode = componentCode
    let inlinedCode = ''

    // First, handle local imports by inlining their content
    const localImportRegex = /import\s+(?:\{([^}]*)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]\.(\/[^'"]+)['"]/g
    let match
    const processedImports = new Set<string>()

    while ((match = localImportRegex.exec(componentCode)) !== null) {
      const importPath = match[4] // e.g., "/types"

      // Try different file extensions
      const possiblePaths = [
        importPath.replace(/^\//, ''), // Remove leading slash
        `${importPath.replace(/^\//, '')}.ts`,
        `${importPath.replace(/^\//, '')}.tsx`,
        `${importPath.replace(/^\//, '')}.js`,
        `${importPath.replace(/^\//, '')}.jsx`,
      ]

      for (const path of possiblePaths) {
        if (allFiles[path] && !processedImports.has(path)) {
          // Inline the imported file's content
          let importedContent = allFiles[path]

          // Remove exports from imported content
          importedContent = importedContent
            .replace(/export\s+(interface|type)\s+/g, '$1 ')
            .replace(/export\s+\{[^}]*\};?\s*/g, '')
            .replace(/export\s+default\s+/g, '')

          inlinedCode += `\n// Inlined from ${path}\n${importedContent}\n`
          processedImports.add(path)
          break
        }
      }
    }

    // Transform React imports to use global React object
    cleanedCode = cleanedCode
      // Handle: import React, { useState, useEffect } from 'react'
      .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (match, hooks) => {
        const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
        return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
      })
      // Handle: import * as React from 'react'
      .replace(/import\s+\*\s+as\s+React\s+from\s+['"]react['"];?\s*/g, '')
      // Handle: import React from 'react'
      .replace(/import\s+React\s+from\s+['"]react['"];?\s*/g, '')
      // Handle: import { useState, useEffect } from 'react'
      .replace(/import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*/g, (match, hooks) => {
        const hookList = hooks.split(',').map((h: string) => h.trim()).filter(Boolean)
        return hookList.length > 0 ? `const { ${hookList.join(', ')} } = React;\n` : ''
      })
      // Remove CSS imports (handled separately)
      .replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '')
      // Remove local imports (already inlined)
      .replace(/import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]\.[^'"]*['"];?\s*/g, '')
      // Remove export default function/const statements
      .replace(/export\s+default\s+function\s+/g, 'function ')
      .replace(/export\s+default\s+const\s+/g, 'const ')
      .replace(/export\s+function\s+/g, 'function ')
      .replace(/export\s+const\s+/g, 'const ')
      // Remove export default identifier
      .replace(/export\s+default\s+(\w+);?\s*/g, '')
      .replace(/export\s+\{[^}]*\};?\s*/g, '')

    // Combine inlined code with the main component code
    cleanedCode = inlinedCode + '\n' + cleanedCode

    // Extract component name (usually App or first function/const component)
    const functionMatch = cleanedCode.match(/function\s+(\w+)/)
    const constMatch = cleanedCode.match(/const\s+(\w+)\s*=/)
    const componentName = functionMatch?.[1] || constMatch?.[1] || 'App'

    const scriptPresets = 'react,typescript'

    // Ensure embedded scripts never prematurely terminate the HTML
    const sanitizedComponentCode = cleanedCode.replace(/<\/script>/gi, '<\\/script>')

    // Simple HTML template for React components
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        ${cssCode}
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module" data-presets="${scriptPresets}">
        ${sanitizedComponentCode}

        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(${componentName}));
    </script>
</body>
</html>`
  }
}
