import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface PreviewError {
  message: string
  line?: number
  source?: string
  timestamp: number
}

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

export const PreviewFrame = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { currentArtifactId, artifacts } = useAppStore()
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [errors, setErrors] = useState<PreviewError[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [showConsole, setShowConsole] = useState(false)
  
  const currentArtifact = artifacts.find(a => a.id === currentArtifactId)

  useEffect(() => {
    if (!currentArtifact || !iframeRef.current) return

    // Clear errors and console messages when loading new artifact
    setErrors([])
    setConsoleMessages([])

    const html = currentArtifact.files['index.html'] || ''
    const css = currentArtifact.files['styles.css'] || ''
    const js = currentArtifact.files['script.js'] || ''

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      ${css}
    </style>
</head>
<body>
    ${html}
    <script>
      // Console interception
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
      };

      function interceptConsole(type) {
        console[type] = function(...args) {
          // Call original console method
          originalConsole[type].apply(console, args);
          
          // Send to parent
          window.parent.postMessage({
            type: 'console-message',
            message: {
              type: type,
              message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' '),
              timestamp: Date.now()
            }
          }, '*');
        };
      }

      // Intercept all console methods
      interceptConsole('log');
      interceptConsole('warn');
      interceptConsole('error');
      interceptConsole('info');

      // Error handling
      window.addEventListener('error', function(e) {
        window.parent.postMessage({
          type: 'preview-error',
          error: {
            message: e.message,
            line: e.lineno,
            source: e.filename,
            timestamp: Date.now()
          }
        }, '*');
      });

      window.addEventListener('unhandledrejection', function(e) {
        window.parent.postMessage({
          type: 'preview-error',
          error: {
            message: 'Promise rejection: ' + (e.reason?.message || e.reason),
            timestamp: Date.now()
          }
        }, '*');
      });

      try {
        ${js}
      } catch (error) {
        window.parent.postMessage({
          type: 'preview-error',
          error: {
            message: error.message,
            source: 'script.js',
            timestamp: Date.now()
          }
        }, '*');
      }
    </script>
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    iframeRef.current.src = url

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [currentArtifact])

  // Listen for error and console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'preview-error') {
        const newError: PreviewError = event.data.error
        setErrors(prev => [...prev, newError])
        setShowErrors(true)
      } else if (event.data.type === 'console-message') {
        const newMessage: ConsoleMessage = event.data.message
        setConsoleMessages(prev => [...prev, newMessage])
        if (newMessage.type === 'error') {
          setShowConsole(true)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!currentArtifact) {
    return (
      <div style={{
        height: '100%',
        background: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadows.md,
      }}>
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['2xl'],
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: theme.spacing.xl, 
            backgroundImage: theme.colors.gradient.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🌐
          </div>
          <div style={{ 
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            No preview available
          </div>
          <div style={{ 
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            lineHeight: theme.typography.lineHeight.relaxed,
          }}>
            Generate a website to see the preview
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      background: theme.colors.bg.primary,
      borderRadius: theme.radius.lg,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: theme.shadows.md,
    }}>
      {/* Preview header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
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
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: theme.radius.full,
            background: theme.colors.accent.success,
            boxShadow: `0 0 8px ${theme.colors.accent.success}40`,
          }}></div>
          Live Preview
        </div>
        
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs
        }}>
          <button style={{
            background: theme.colors.bg.primary,
            border: 'none',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            padding: theme.spacing.sm,
            borderRadius: theme.radius.sm,
            fontSize: theme.typography.fontSize.sm,
            transition: `all ${theme.animation.normal}`,
            boxShadow: theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.accent.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.text.secondary
            e.currentTarget.style.boxShadow = theme.shadows.outset
          }}
          >
            🔄
          </button>
          <button style={{
            background: theme.colors.bg.primary,
            border: 'none',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            padding: theme.spacing.sm,
            borderRadius: theme.radius.sm,
            fontSize: theme.typography.fontSize.sm,
            transition: `all ${theme.animation.normal}`,
            boxShadow: theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.accent.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.text.secondary
            e.currentTarget.style.boxShadow = theme.shadows.outset
          }}
          >
            ↗️
          </button>
        </div>
      </div>
      
      {/* Preview iframe */}
      <div style={{
        flex: 1,
        background: '#ffffff',
        borderRadius: (errors.length > 0 || consoleMessages.length > 0) ? '0' : `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        overflow: 'hidden',
        border: `2px solid ${theme.colors.border}`,
        borderTop: 'none',
        borderBottom: (errors.length > 0 || consoleMessages.length > 0) ? 'none' : `2px solid ${theme.colors.border}`,
      }}>
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: (errors.length > 0 || consoleMessages.length > 0) ? '0' : `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
          }}
          sandbox="allow-scripts allow-same-origin"
          title="Website Preview"
        />
      </div>

      {/* Error Display Section */}
      {errors.length > 0 && (
        <div style={{
          background: theme.colors.bg.secondary,
          borderTop: `1px solid ${theme.colors.border}`,
          borderLeft: `2px solid ${theme.colors.border}`,
          borderRight: `2px solid ${theme.colors.border}`,
          borderBottom: `2px solid ${theme.colors.border}`,
          borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        }}>
          {/* Error Header */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.accent.error + '20',
              borderBottom: showErrors ? `1px solid ${theme.colors.border}` : 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.normal}`,
            }}
            onClick={() => setShowErrors(!showErrors)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.accent.error + '30'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.accent.error + '20'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.accent.error,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: theme.radius.full,
                background: theme.colors.accent.error,
                boxShadow: `0 0 8px ${theme.colors.accent.error}40`,
              }}></div>
              {errors.length} Error{errors.length > 1 ? 's' : ''} Found
            </div>
            
            <div style={{
              transform: showErrors ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${theme.animation.normal}`,
              color: theme.colors.accent.error,
              fontSize: '14px',
            }}>
              ▼
            </div>
          </div>

          {/* Error List */}
          {showErrors && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              background: theme.colors.bg.primary,
            }}>
              {errors.map((error, index) => (
                <div key={index} style={{
                  padding: theme.spacing.md,
                  borderBottom: index < errors.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                }}>
                  <div style={{
                    color: theme.colors.accent.error,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                  }}>
                    {error.message}
                  </div>
                  {error.source && (
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.typography.fontSize.xs,
                      marginBottom: theme.spacing.xs,
                    }}>
                      Source: {error.source}{error.line ? `:${error.line}` : ''}
                    </div>
                  )}
                  <div style={{
                    color: theme.colors.text.tertiary,
                    fontSize: theme.typography.fontSize.xs,
                  }}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {/* Clear Errors Button */}
              <div style={{
                padding: theme.spacing.sm,
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setErrors([])
                    setShowErrors(false)
                  }}
                  style={{
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    transition: `all ${theme.animation.normal}`,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.tertiary
                    e.currentTarget.style.color = theme.colors.text.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.secondary
                    e.currentTarget.style.color = theme.colors.text.secondary
                  }}
                >
                  Clear Errors
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Console Display Section */}
      {consoleMessages.length > 0 && (
        <div style={{
          background: theme.colors.bg.secondary,
          borderTop: errors.length > 0 ? 'none' : `1px solid ${theme.colors.border}`,
          borderLeft: `2px solid ${theme.colors.border}`,
          borderRight: `2px solid ${theme.colors.border}`,
          borderBottom: `2px solid ${theme.colors.border}`,
          borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        }}>
          {/* Console Header */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.accent.primary + '20',
              borderBottom: showConsole ? `1px solid ${theme.colors.border}` : 'none',
              borderTop: errors.length > 0 ? `1px solid ${theme.colors.border}` : 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.normal}`,
            }}
            onClick={() => setShowConsole(!showConsole)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.accent.primary + '30'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.accent.primary + '20'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.accent.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: theme.radius.full,
                background: theme.colors.accent.primary,
                boxShadow: `0 0 8px ${theme.colors.accent.primary}40`,
              }}></div>
              Console ({consoleMessages.length})
            </div>
            
            <div style={{
              transform: showConsole ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${theme.animation.normal}`,
              color: theme.colors.accent.primary,
              fontSize: '14px',
            }}>
              ▼
            </div>
          </div>

          {/* Console Messages */}
          {showConsole && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              background: theme.colors.bg.primary,
            }}>
              {consoleMessages.map((msg, index) => {
                const getConsoleColor = (type: string) => {
                  switch (type) {
                    case 'error': return theme.colors.accent.error
                    case 'warn': return theme.colors.accent.warning || '#f59e0b'
                    case 'info': return theme.colors.accent.info || '#3b82f6'
                    default: return theme.colors.text.primary
                  }
                }

                return (
                  <div key={index} style={{
                    padding: theme.spacing.md,
                    borderBottom: index < consoleMessages.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                    fontSize: theme.typography.fontSize.sm,
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: theme.spacing.sm,
                    }}>
                      <div style={{
                        color: getConsoleColor(msg.type),
                        fontWeight: theme.typography.fontWeight.medium,
                        fontSize: theme.typography.fontSize.xs,
                        textTransform: 'uppercase',
                        minWidth: '40px',
                        marginTop: '2px',
                      }}>
                        {msg.type}
                      </div>
                      <div style={{
                        color: theme.colors.text.primary,
                        flex: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.message}
                      </div>
                    </div>
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.typography.fontSize.xs,
                      marginTop: theme.spacing.xs,
                      marginLeft: '52px',
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
              
              {/* Clear Console Button */}
              <div style={{
                padding: theme.spacing.sm,
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConsoleMessages([])
                    setShowConsole(false)
                  }}
                  style={{
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    transition: `all ${theme.animation.normal}`,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.tertiary
                    e.currentTarget.style.color = theme.colors.text.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.secondary
                    e.currentTarget.style.color = theme.colors.text.secondary
                  }}
                >
                  Clear Console
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}