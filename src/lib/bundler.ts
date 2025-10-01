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
  constructor() {}

  async bundle(
    files: Record<string, string>,
    options: ModuleBundleOptions
  ): Promise<ModuleBundleResult> {
    // Simplified bundler that just returns the entry file content
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
      // Transform React component for browser execution
      let transformedCode = entryContent

      // Transform imports to work with CDN-loaded React
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
        // Remove CSS imports
        .replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '')
        // Remove other component imports (we'll need to handle these properly in a full implementation)
        .replace(/import\s+\{[^}]*\}\s+from\s+['"]\.[^'"]*['"];?\s*/g, '')
        .replace(/import\s+\w+\s+from\s+['"]\.[^'"]*['"];?\s*/g, '')
        // Remove export statements
        .replace(/export\s+default\s+(\w+);?\s*/g, '')
        .replace(/export\s+\{[^}]*\};?\s*/g, '')
        .replace(/export\s+default\s+function\s+/g, 'function ')
        .replace(/export\s+function\s+/g, 'function ')
        .replace(/export\s+(interface|type)\s+/g, '$1 ')

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
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
