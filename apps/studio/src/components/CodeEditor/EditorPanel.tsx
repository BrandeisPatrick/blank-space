import { useState, useEffect } from 'react'
import { CodeEditor } from './CodeEditor'
import { FileTabs } from './FileTabs'
import { useAppStore } from '../../state/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

export const EditorPanel = () => {
  const { currentArtifactId, artifacts } = useAppStore()
  const [activeFile, setActiveFile] = useState('index.html')
  const [files, setFiles] = useState<Record<string, string>>({})
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const currentArtifact = artifacts.find(a => a.id === currentArtifactId)

  useEffect(() => {
    if (currentArtifact) {
      setFiles(currentArtifact.files)
      // Set active file to the first available file
      const fileNames = Object.keys(currentArtifact.files)
      if (fileNames.length > 0 && !fileNames.includes(activeFile)) {
        setActiveFile(fileNames[0])
      }
    } else {
      // Default template when no artifact
      setFiles({
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to Your Generated Website</h1>
        <p>Enter a prompt below to generate your custom website</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
        'styles.css': `/* Generated styles will appear here */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
    text-align: center;
    padding-top: 100px;
}

h1 {
    color: #333;
    margin-bottom: 20px;
}

p {
    color: #666;
    font-size: 18px;
}`,
        'script.js': `// Generated JavaScript will appear here
console.log('Website loaded successfully');

// Add interactivity here`
      })
      setActiveFile('index.html')
    }
  }, [currentArtifact])

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html'
    if (filename.endsWith('.css')) return 'css'
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript'
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript'
    return 'plaintext'
  }

  const handleFileChange = (filename: string, value: string | undefined) => {
    if (value !== undefined) {
      setFiles(prev => ({
        ...prev,
        [filename]: value
      }))
      
      // TODO: Update the artifact in the store
      // This would trigger a re-render of the preview
    }
  }

  if (Object.keys(files).length === 0) {
    return (
      <div style={{
        height: '100%',
        background: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.text.secondary,
        borderRadius: theme.radius.lg,
        margin: theme.spacing.xs,
      }}>
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['2xl'],
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: theme.spacing.lg,
            opacity: 0.6 
          }}>
            ⚡
          </div>
          <div style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Loading editor...
          </div>
          <div style={{ 
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
          }}>
            Preparing your code workspace
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      background: theme.colors.bg.primary,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    }}>
      <FileTabs
        files={files}
        activeFile={activeFile}
        onFileSelect={setActiveFile}
      />
      
      <div style={{ 
        flex: 1,
        borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        overflow: 'hidden',
      }}>
        <CodeEditor
          content={files[activeFile] || ''}
          language={getLanguage(activeFile)}
          onChange={(value) => handleFileChange(activeFile, value)}
        />
      </div>
    </div>
  )
}