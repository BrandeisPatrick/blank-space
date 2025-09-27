import { useState, useEffect } from 'react'
import { CodeEditor } from './CodeEditor'
import { FileTabs } from './FileTabs'
import { useAppStore } from '../../stores/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

export const EditorPanel = () => {
  const { currentArtifactId, artifacts, updateArtifact } = useAppStore()
  const [activeFile, setActiveFile] = useState('index.html')
  const [files, setFiles] = useState<Record<string, string>>({})
  const [showExplorer, setShowExplorer] = useState(true)
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
      const newFiles = {
        ...files,
        [filename]: value
      }
      setFiles(newFiles)
      
      // Update the artifact in the store to trigger preview update
      if (currentArtifactId) {
        updateArtifact(currentArtifactId, newFiles)
      }
    }
  }

  const handleFileClose = (filename: string) => {
    // Don't close if it's the only file
    const fileList = Object.keys(files)
    if (fileList.length <= 1) return
    
    // If closing the active file, switch to another file
    if (filename === activeFile) {
      const currentIndex = fileList.indexOf(filename)
      const newIndex = currentIndex > 0 ? currentIndex - 1 : 1
      setActiveFile(fileList[newIndex])
    }
    
    // Remove the file from the files object
    const newFiles = { ...files }
    delete newFiles[filename]
    setFiles(newFiles)
    
    // Update the artifact in the store
    if (currentArtifactId) {
      updateArtifact(currentArtifactId, newFiles)
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
      {/* Header with Explorer Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        background: theme.colors.bg.secondary,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          color: theme.colors.text.primary,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {/* Code Editor Icon - brackets <> */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: theme.typography.fontWeight.bold,
            color: '#808080',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
          }}>
            <span style={{ opacity: 0.7 }}>&lt;</span>
            <span style={{ margin: '0 2px', opacity: 0.5 }}>/</span>
            <span style={{ opacity: 0.7 }}>&gt;</span>
          </div>
          <span>Code Editor</span>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Simple File List */}
        <div style={{
          width: showExplorer ? '280px' : '0px',
          transition: `width ${theme.animation.normal}`,
          overflow: 'hidden',
          position: 'relative',
          background: theme.colors.bg.secondary,
          borderRight: `1px solid ${theme.colors.border}`,
        }}>
          {showExplorer && (
            <div style={{ padding: theme.spacing.md }}>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
              }}>
                Files
              </div>
              {Object.keys(files).map(filename => (
                <div
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    cursor: 'pointer',
                    borderRadius: theme.radius.md,
                    background: activeFile === filename ? theme.colors.bg.hover : 'transparent',
                    color: activeFile === filename ? theme.colors.text.primary : theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    transition: `all ${theme.animation.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    if (activeFile !== filename) {
                      e.currentTarget.style.background = theme.colors.bg.tertiary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFile !== filename) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {filename}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Editor Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: showExplorer ? '0' : '24px',
          transition: `margin-left ${theme.animation.normal}`,
        }}>
          <FileTabs
            files={files}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
            onFileClose={handleFileClose}
            showExplorer={showExplorer}
            onToggleExplorer={() => setShowExplorer(!showExplorer)}
          />
          
          <div style={{ 
            flex: 1,
            overflow: 'hidden',
          }}>
            <CodeEditor
              content={files[activeFile] || ''}
              language={getLanguage(activeFile)}
              onChange={(value) => handleFileChange(activeFile, value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
