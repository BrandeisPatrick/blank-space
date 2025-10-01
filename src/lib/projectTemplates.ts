/**
 * Project templates for WebContainer-based preview
 * These files are automatically added to generated projects
 */

export const VITE_CONFIG_TEMPLATE = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
})
`

export const PACKAGE_JSON_TEMPLATE = {
  name: 'preview-app',
  version: '0.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview'
  },
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0'
  },
  devDependencies: {
    '@types/react': '^18.2.43',
    '@types/react-dom': '^18.2.17',
    '@vitejs/plugin-react': '^4.2.1',
    typescript: '^5.2.2',
    vite: '^5.0.8'
  }
}

export const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

export const MAIN_TSX_TEMPLATE = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`

export const INDEX_CSS_TEMPLATE = `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

#root {
  min-height: 100vh;
}
`

/**
 * Adds necessary project files to a files object for Vite to work
 */
export function addViteProjectFiles(
  files: Record<string, string>,
  _entryComponent: string = 'App.tsx'
): Record<string, string> {
  const enhancedFiles = { ...files }

  // Add package.json if not present
  if (!enhancedFiles['package.json']) {
    enhancedFiles['package.json'] = JSON.stringify(PACKAGE_JSON_TEMPLATE, null, 2)
  }

  // Add vite.config.ts if not present
  if (!enhancedFiles['vite.config.ts']) {
    enhancedFiles['vite.config.ts'] = VITE_CONFIG_TEMPLATE
  }

  // Add index.html if not present
  if (!enhancedFiles['index.html']) {
    enhancedFiles['index.html'] = INDEX_HTML_TEMPLATE
  }

  // Add src/main.tsx if not present
  if (!enhancedFiles['src/main.tsx']) {
    // Detect which component file to import
    let importPath = './App'
    if (files['src/App.tsx']) {
      importPath = './App'
    } else if (files['App.tsx']) {
      // Move App.tsx to src/App.tsx
      enhancedFiles['src/App.tsx'] = files['App.tsx']
      delete enhancedFiles['App.tsx']
      importPath = './App'
    } else if (files['src/App.jsx']) {
      importPath = './App'
    } else if (files['App.jsx']) {
      enhancedFiles['src/App.jsx'] = files['App.jsx']
      delete enhancedFiles['App.jsx']
      importPath = './App'
    }

    enhancedFiles['src/main.tsx'] = MAIN_TSX_TEMPLATE.replace('./App', importPath)
  }

  // Add src/index.css if not present
  if (!enhancedFiles['src/index.css']) {
    // Check if there's a styles.css to use
    const cssContent = files['styles.css'] || files['src/styles.css'] || INDEX_CSS_TEMPLATE
    enhancedFiles['src/index.css'] = cssContent

    // Remove old CSS files
    delete enhancedFiles['styles.css']
  }

  // Move component files to src/ if they're in root
  const componentFiles = Object.keys(files).filter(path =>
    (path.endsWith('.tsx') || path.endsWith('.jsx')) &&
    !path.startsWith('src/') &&
    path !== 'App.tsx' &&
    path !== 'App.jsx'
  )

  for (const file of componentFiles) {
    if (!enhancedFiles[`src/${file}`]) {
      enhancedFiles[`src/${file}`] = files[file]
      delete enhancedFiles[file]
    }
  }

  // Move utility/hook files to src/ if they're in root
  const srcFiles = Object.keys(files).filter(path =>
    (path.includes('utils/') || path.includes('hooks/') || path.includes('lib/') || path.includes('components/')) &&
    !path.startsWith('src/')
  )

  for (const file of srcFiles) {
    enhancedFiles[`src/${file}`] = files[file]
    delete enhancedFiles[file]
  }

  return enhancedFiles
}
