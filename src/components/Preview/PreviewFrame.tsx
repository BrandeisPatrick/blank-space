import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { TranspilerService } from '../../lib/transpiler'
import { ModuleBundler } from '../../lib/bundler'

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
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<'transpiling' | 'bundling' | 'rendering'>('transpiling')
  const previewBlobUrlRef = useRef<string | null>(null)

  const currentArtifact = artifacts.find(a => a.id === currentArtifactId)

  // Helper function to find React entry point
  const findReactEntryPoint = (files: Record<string, string>): string | null => {
    const entryOptions = ['App.tsx', 'App.jsx', 'src/App.tsx', 'src/App.jsx', 'index.tsx', 'index.jsx']
    for (const option of entryOptions) {
      if (files[option]) {
        return option
      }
    }
    return null
  }

  useEffect(() => {
    if (!currentArtifact || !iframeRef.current) return

    // Start loading state
    setIsLoading(true)
    setLoadingPhase('transpiling')

    // Clear errors and console messages when loading new artifact
    setErrors([])
    setConsoleMessages([])

    // Check for .bina.json manifest to determine preview mode
    let previewMode = 'auto' // auto, single-file, bundled
    let manifestEntry = 'App.tsx'

    if (currentArtifact.files['.bina.json']) {
      try {
        const manifest = JSON.parse(currentArtifact.files['.bina.json'])
        previewMode = manifest.previewMode || 'single-file'
        manifestEntry = manifest.entry || 'App.tsx'
      } catch (e) {
        console.warn('Failed to parse .bina.json, using auto mode')
      }
    }

    // Check if this is a React artifact or regular HTML
    const reactEntryPoint = findReactEntryPoint(currentArtifact.files)
    const isReactArtifact = reactEntryPoint !== null ||
                           currentArtifact.metadata?.isReact ||
                           currentArtifact.metadata?.framework === 'react'

    const generatePreview = async () => {
      let fullHtml: string

      if (isReactArtifact) {
        // Use manifest-based routing if available
        const useBundler = previewMode === 'bundled' && currentArtifact.files['.bina.json']

        // Fallback to folder detection if no manifest
        const fileNames = Object.keys(currentArtifact.files)
        const hasMultipleComponents = previewMode === 'auto' && fileNames.some(name =>
          name.startsWith('components/') ||
          name.startsWith('hooks/') ||
          name.startsWith('utils/') ||
          name.startsWith('lib/')
        )

        const shouldBundle = useBundler || hasMultipleComponents

        if (shouldBundle) {
          // Use bundler for multi-file projects
          setLoadingPhase('bundling')

          const bundler = new ModuleBundler()

          // Find entry point
          const entryPoint = reactEntryPoint || 'App.jsx'

          try {
            const bundleResult = await bundler.bundle(currentArtifact.files, {
              entryPoint,
              format: 'iife',
              target: 'es2020'
            })

            if (bundleResult.error) {
              console.error('Bundle error:', bundleResult.error)
              fullHtml = `
                <html>
                  <body>
                    <div style="color: red; padding: 20px;">
                      <h3>Bundle Error</h3>
                      <pre>${bundleResult.error}</pre>
                    </div>
                  </body>
                </html>
              `
            } else if (!bundleResult.html) {
              console.error('Bundle returned empty HTML')
              fullHtml = `
                <html>
                  <body>
                    <div style="color: red; padding: 20px;">
                      <h3>Bundle Error</h3>
                      <pre>Bundler returned empty HTML. Entry point: ${entryPoint}</pre>
                      <pre>Available files: ${Object.keys(currentArtifact.files).join(', ')}</pre>
                    </div>
                  </body>
                </html>
              `
            } else {
              fullHtml = bundleResult.html
              console.log('Bundle successful, rendering HTML')
            }
          } catch (error) {
            console.error('Bundling failed:', error)
            fullHtml = `
              <html>
                <body>
                  <div style="color: red; padding: 20px;">
                    <h3>Bundling Failed</h3>
                    <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
                  </div>
                </body>
              </html>
            `
          }
        } else {
          // Single-file React component - use existing transpiler
          setLoadingPhase('transpiling')

          const transpilerService = TranspilerService.getInstance()

          // Get the component code from the detected entry point
          const componentCode = reactEntryPoint ? currentArtifact.files[reactEntryPoint] : ''

          if (componentCode) {
            const cssCode = currentArtifact.files['App.module.css'] || currentArtifact.files['styles.css'] || ''
            fullHtml = await transpilerService.createReactHTML(componentCode, cssCode, currentArtifact.files)
          } else {
            // No React entry point found
            const availableFiles = Object.keys(currentArtifact.files).join(', ')
            console.error('No React entry point found for component. Available files:', availableFiles)
            fullHtml = `
              <html>
                <body>
                  <div style="color: #d73a49; padding: 20px; border: 1px solid #d73a49; border-radius: 6px; margin: 20px; font-family: system-ui, sans-serif;">
                    <h3>❌ Component File Not Found</h3>
                    <p>No React entry point (App.jsx, App.tsx, etc.) was found.</p>
                    <p style="margin-top: 10px; font-size: 14px; color: #586069;">
                      <strong>Available files:</strong> ${availableFiles || 'none'}
                    </p>
                    <p style="margin-top: 10px; font-size: 14px; color: #586069;">
                      Please ensure your component is named App.jsx or App.tsx
                    </p>
                  </div>
                </body>
              </html>
            `
          }
        }
      } else {
        // For regular HTML artifacts, use separate files
        const html = currentArtifact.files['index.html'] || ''
        const css = currentArtifact.files['styles.css'] || ''
        const js = currentArtifact.files['script.js'] || ''

        // For regular HTML artifacts, construct the full HTML
        fullHtml = `
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
      }

      // Add console interception to React components
      if (isReactArtifact && fullHtml) {
        fullHtml = fullHtml.replace(
          '</body>',
          `<script>
            // Console interception for React components
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

            // Error handling for React components
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
          </script>
          </body>`
        )
      }

      setLoadingPhase('rendering')

        if (iframeRef.current) {
          const iframe = iframeRef.current

          // Clean up any previously created blob URLs
          if (previewBlobUrlRef.current) {
            URL.revokeObjectURL(previewBlobUrlRef.current)
            previewBlobUrlRef.current = null
          }

          // Serve the preview HTML from a Blob-backed URL so relative asset
          // resolution has a valid origin instead of about:blank.
          const htmlBlob = new Blob([fullHtml], { type: 'text/html' })
          const blobUrl = URL.createObjectURL(htmlBlob)
          previewBlobUrlRef.current = blobUrl

          iframe.src = blobUrl

          // Listen for iframe load to end loading state
          const handleLoad = () => {
            // Add a small delay to ensure content is fully rendered
            setTimeout(() => {
              setIsLoading(false)
            }, 300)
          }

          iframe.addEventListener('load', handleLoad)

          return () => {
            iframe.removeEventListener('load', handleLoad)
            // Reset the iframe to a blank page and revoke the blob URL
            iframe.src = 'about:blank'
            if (previewBlobUrlRef.current) {
              URL.revokeObjectURL(previewBlobUrlRef.current)
              previewBlobUrlRef.current = null
            }
          }
        }

      return () => {}
    }

    generatePreview()
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

  // Ensure any allocated blob URLs are released when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current)
        previewBlobUrlRef.current = null
      }
    }
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
        position: 'relative',
      }}>
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: (errors.length > 0 || consoleMessages.length > 0) ? '0' : `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
            opacity: isLoading ? 0.3 : 1,
            transition: 'opacity 0.3s ease',
          }}
          sandbox="allow-scripts allow-forms"
          title="Website Preview"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.colors.bg.secondary,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.lg,
            zIndex: 10,
            border: `1px solid ${theme.colors.border}`,
          }}>
            {/* Animated Spinner */}
            <div style={{
              width: '48px',
              height: '48px',
              border: `3px solid ${theme.colors.border}40`,
              borderTop: `3px solid ${theme.colors.accent.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 20px ${theme.colors.accent.primary}20`,
            }} />

            {/* Loading Text */}
            <div style={{
              textAlign: 'center',
              color: theme.colors.text.primary,
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                textShadow: `0 1px 3px ${theme.colors.bg.primary}80`,
              }}>
                {loadingPhase === 'transpiling' && 'Transpiling React code...'}
                {loadingPhase === 'bundling' && 'Bundling components...'}
                {loadingPhase === 'rendering' && 'Rendering preview...'}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                opacity: 0.9,
                textShadow: `0 1px 2px ${theme.colors.bg.primary}60`,
              }}>
                {loadingPhase === 'transpiling' && 'Converting JSX to JavaScript'}
                {loadingPhase === 'bundling' && 'Combining all modules'}
                {loadingPhase === 'rendering' && 'Loading your website'}
              </div>
            </div>

            {/* Progress Dots */}
            <div style={{
              display: 'flex',
              gap: theme.spacing.sm,
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: theme.colors.accent.primary,
                    opacity: 0.3,
                    animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* CSS for animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(1); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
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
