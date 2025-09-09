export interface FileSystemNode {
  type: 'file' | 'folder'
  name: string
  path: string
  content?: string
  children?: Record<string, FileSystemNode>
  metadata?: {
    size?: number
    lastModified?: string
    isExpanded?: boolean
  }
}

export interface FileSystem {
  root: FileSystemNode
  currentPath?: string
}

export class FileSystemManager {
  private root: FileSystemNode

  constructor(initialFiles?: Record<string, string>) {
    this.root = {
      type: 'folder',
      name: 'root',
      path: '',
      children: {}
    }
    
    if (initialFiles) {
      this.loadFromFlatStructure(initialFiles)
    }
  }

  /**
   * Convert flat file structure to hierarchical tree
   */
  loadFromFlatStructure(files: Record<string, string>): void {
    this.root.children = {}
    
    Object.entries(files).forEach(([filePath, content]) => {
      this.createFile(filePath, content)
    })
  }

  /**
   * Convert hierarchical tree back to flat structure
   */
  toFlatStructure(): Record<string, string> {
    const result: Record<string, string> = {}
    
    const traverse = (node: FileSystemNode, currentPath: string) => {
      if (node.type === 'file' && node.content !== undefined) {
        result[currentPath] = node.content
      } else if (node.type === 'folder' && node.children) {
        Object.entries(node.children).forEach(([name, child]) => {
          const childPath = currentPath ? `${currentPath}/${name}` : name
          traverse(child, childPath)
        })
      }
    }
    
    if (this.root.children) {
      Object.entries(this.root.children).forEach(([name, child]) => {
        traverse(child, name)
      })
    }
    
    return result
  }

  /**
   * Create a file at the specified path
   */
  createFile(filePath: string, content: string = ''): boolean {
    const parts = filePath.split('/').filter(p => p.length > 0)
    let current = this.root
    
    // Navigate/create directories
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current.children) current.children = {}
      
      if (!current.children[part]) {
        current.children[part] = {
          type: 'folder',
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: {},
          metadata: { isExpanded: false }
        }
      }
      current = current.children[part]
    }
    
    // Create the file
    const fileName = parts[parts.length - 1]
    if (!current.children) current.children = {}
    
    current.children[fileName] = {
      type: 'file',
      name: fileName,
      path: filePath,
      content,
      metadata: {
        size: content.length,
        lastModified: new Date().toISOString()
      }
    }
    
    return true
  }

  /**
   * Create a folder at the specified path
   */
  createFolder(folderPath: string): boolean {
    const parts = folderPath.split('/').filter(p => p.length > 0)
    let current = this.root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!current.children) current.children = {}
      
      if (!current.children[part]) {
        current.children[part] = {
          type: 'folder',
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: {},
          metadata: { isExpanded: false }
        }
      }
      current = current.children[part]
    }
    
    return true
  }

  /**
   * Get file content by path
   */
  getFile(filePath: string): string | null {
    const node = this.getNode(filePath)
    return node && node.type === 'file' ? node.content || null : null
  }

  /**
   * Update file content
   */
  updateFile(filePath: string, content: string): boolean {
    const node = this.getNode(filePath)
    if (node && node.type === 'file') {
      node.content = content
      if (node.metadata) {
        node.metadata.size = content.length
        node.metadata.lastModified = new Date().toISOString()
      }
      return true
    }
    return false
  }

  /**
   * Delete file or folder
   */
  delete(path: string): boolean {
    const parts = path.split('/').filter(p => p.length > 0)
    if (parts.length === 0) return false
    
    let current = this.root
    
    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current.children || !current.children[parts[i]]) {
        return false
      }
      current = current.children[parts[i]]
    }
    
    // Delete the target
    const targetName = parts[parts.length - 1]
    if (current.children && current.children[targetName]) {
      delete current.children[targetName]
      return true
    }
    
    return false
  }

  /**
   * Rename file or folder
   */
  rename(oldPath: string, newName: string): boolean {
    const node = this.getNode(oldPath)
    if (!node) return false
    
    const parts = oldPath.split('/').filter(p => p.length > 0)
    const parentPath = parts.slice(0, -1).join('/')
    const newPath = parentPath ? `${parentPath}/${newName}` : newName
    
    // Create copy with new name/path
    const newNode = { ...node, name: newName, path: newPath }
    
    // Update all child paths if it's a folder
    if (node.type === 'folder' && node.children) {
      const updateChildPaths = (children: Record<string, FileSystemNode>, basePath: string) => {
        Object.entries(children).forEach(([name, child]) => {
          const childPath = `${basePath}/${name}`
          child.path = childPath
          if (child.children) {
            updateChildPaths(child.children, childPath)
          }
        })
      }
      updateChildPaths(node.children, newPath)
    }
    
    // Delete old and create new
    this.delete(oldPath)
    
    const parentNode = parentPath ? this.getNode(parentPath) : this.root
    if (parentNode && parentNode.children) {
      parentNode.children[newName] = newNode
      return true
    }
    
    return false
  }

  /**
   * Get node by path
   */
  private getNode(path: string): FileSystemNode | null {
    const parts = path.split('/').filter(p => p.length > 0)
    let current = this.root
    
    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        return null
      }
      current = current.children[part]
    }
    
    return current
  }

  /**
   * Toggle folder expansion
   */
  toggleExpanded(folderPath: string): boolean {
    const node = this.getNode(folderPath)
    if (node && node.type === 'folder' && node.metadata) {
      node.metadata.isExpanded = !node.metadata.isExpanded
      return true
    }
    return false
  }

  /**
   * Get all files as array (useful for file tabs)
   */
  getAllFiles(): { path: string; name: string; content: string }[] {
    const files: { path: string; name: string; content: string }[] = []
    
    const traverse = (node: FileSystemNode) => {
      if (node.type === 'file' && node.content !== undefined) {
        files.push({
          path: node.path,
          name: node.name,
          content: node.content
        })
      } else if (node.type === 'folder' && node.children) {
        Object.values(node.children).forEach(traverse)
      }
    }
    
    if (this.root.children) {
      Object.values(this.root.children).forEach(traverse)
    }
    
    return files
  }

  /**
   * Get folder structure for display
   */
  getFolderStructure(): FileSystemNode {
    return this.root
  }
}

/**
 * Create a React project template
 */
export function createReactProjectTemplate(): Record<string, string> {
  return {
    'package.json': JSON.stringify({
      name: 'my-react-app',
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      }
    }, null, 2),
    
    'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Web site created using Create React App" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

    'public/favicon.ico': '# Favicon placeholder',
    
    'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

    'src/App.js': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;`,

    'src/App.css': `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.App-header h1 {
  margin-bottom: 20px;
}

.App-header p {
  margin: 0;
}`,

    'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,

    'src/components/Button/Button.jsx': `import React from 'react';
import './Button.module.css';

const Button = ({ children, onClick, variant = 'primary', ...props }) => {
  return (
    <button 
      className={\`btn btn--\${variant}\`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;`,

    'src/components/Button/Button.module.css': `.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: #007bff;
  color: white;
}

.btn--primary:hover {
  background-color: #0056b3;
}

.btn--secondary {
  background-color: #6c757d;
  color: white;
}

.btn--secondary:hover {
  background-color: #545b62;
}`,

    'README.md': `# My React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm run build\`

Builds the app for production to the \`build\` folder.`,

    '.gitignore': `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`
  }
}