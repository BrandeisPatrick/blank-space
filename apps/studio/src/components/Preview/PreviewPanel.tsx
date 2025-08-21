import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../state/appStore'
import { ErrorConsole, ConsoleMessage } from './ErrorConsole'
import { theme } from '../../styles/theme'

type TabType = 'preview' | 'console'

export const PreviewPanel = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { currentArtifactId, artifacts } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabType>('preview')
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [errorCount, setErrorCount] = useState(0)
  const [warningCount, setWarningCount] = useState(0)
  
  const currentArtifact = artifacts.find(a => a.id === currentArtifactId)

  const addConsoleMessage = useCallback((message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    const newMessage: ConsoleMessage = {
      ...message,
      id: `console_${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    }
    setConsoleMessages(prev => [...prev, newMessage])
    
    if (message.type === 'error') {
      setErrorCount(prev => prev + 1)
    } else if (message.type === 'warning') {
      setWarningCount(prev => prev + 1)
    }
  }, [])

  const clearConsole = () => {
    setConsoleMessages([])
    setErrorCount(0)
    setWarningCount(0)
  }

  useEffect(() => {
    if (!currentArtifact || !iframeRef.current) return

    // For now, just display the generated HTML directly
    const html = currentArtifact.files['index.html'] || ''
    const css = currentArtifact.files['styles.css'] || ''
    const js = currentArtifact.files['script.js'] || ''

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      ${css}
    </style>
</head>
<body>
    ${html}
    <script>${js}</script>
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    iframeRef.current.src = url

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [currentArtifact])

  if (!currentArtifact) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            No website generated yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Enter a prompt above to generate your website
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      position: 'relative',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '8px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981'
        }}></div>
        Generated Website Preview
      </div>
      
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          paddingTop: '40px',
          boxSizing: 'border-box'
        }}
        sandbox="allow-scripts allow-same-origin"
        title="Generated Website Preview"
      />
    </div>
  )
}