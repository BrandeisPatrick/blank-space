import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'
import { parse } from '@babel/parser'
import { GlobeIcon } from './icons'

export const PreviewPanel = ({ files }) => {
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [errors, setErrors] = useState([])
  const [showErrors, setShowErrors] = useState(false)
  const [zoom, setZoom] = useState(100)

  // Helper function to strip ES6 imports from React code
  const stripImports = (code) => {
    return code
      // Remove ALL import statements
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')
      // Remove all export statements (export default, export function, export const, etc.)
      .replace(/export\s+(default\s+)?/g, '')
      .trim()
  }

  // Validate code with Babel parser BEFORE sending to iframe
  const validateFiles = () => {
    const validationErrors = []

    Object.entries(files).forEach(([filename, code]) => {
      // Only validate JS/JSX files
      if (!filename.endsWith('.js') && !filename.endsWith('.jsx')) return

      try {
        parse(code, {
          sourceType: 'module',
          plugins: ['jsx']
        })
      } catch (error) {
        validationErrors.push({
          message: `Syntax error in ${filename}: ${error.message}`,
          source: filename,
          line: error.loc?.line,
          timestamp: Date.now()
        })
      }
    })

    return validationErrors
  }

  // Zoom control functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25))
  }

  const handleZoomReset = () => {
    setZoom(100)
  }

  useEffect(() => {
    if (!files || Object.keys(files).length === 0 || !iframeRef.current) return

    setErrors([])

    // VALIDATE FILES FIRST - catch syntax errors before Babel
    const validationErrors = validateFiles()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setShowErrors(true)
      return // Don't generate preview if validation fails
    }

    const generatePreview = () => {
      // Check if this is a React artifact
      const isReact = files['App.jsx'] || files['App.js']

      let fullHtml

      if (isReact) {
        // React app - use CDN-based approach
        const css = files['styles.css'] || ''

        // Collect and combine all component files
        const allCode = Object.entries(files)
          .filter(([filename]) =>
            filename.endsWith('.jsx') ||
            filename.endsWith('.js') && filename !== 'script.js'
          )
          .map(([, code]) => stripImports(code))
          .join('\n\n')

        fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App Preview</title>

    <!-- Tailwind CSS CDN for runtime styling -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, "Segoe UI Symbol", "Noto Sans Symbols", "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
      ${css}
    </style>
</head>
<body>
    <div id="root"></div>

    <!-- React & ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <!-- Babel Standalone for JSX transpilation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Your App Code -->
    <script type="text/babel">
      const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, useTransition } = React;

      ${allCode}

      // Render the app
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>

    <!-- Error handling -->
    <script>
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
</body>
</html>`
      } else {
        // Regular HTML artifact
        const html = files['index.html'] || ''
        const css = files['styles.css'] || ''
        const js = files['script.js'] || ''

        fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, "Segoe UI Symbol", "Noto Sans Symbols", "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
      ${css}
    </style>
</head>
<body>
    ${html}
    <script>
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

      if (iframeRef.current) {
        iframeRef.current.srcdoc = fullHtml
      }
    }

    generatePreview()
  }, [files])

  // Listen for error messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'preview-error') {
        const newError = event.data.error
        setErrors(prev => [...prev, newError])
        setShowErrors(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Mouse wheel zoom support
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      // Only zoom if Ctrl/Cmd is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()

        const delta = e.deltaY > 0 ? -25 : 25
        setZoom(prev => Math.max(25, Math.min(200, prev + delta)))
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  if (!files || Object.keys(files).length === 0) {
    return (
      <div style={{
        height: '100%',
        background: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.lg,
      }}>
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['2xl'],
          marginTop: '-16px',
        }}>
          <div style={{
            marginBottom: theme.spacing.lg,
            opacity: 0.6,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <GlobeIcon size={48} color={theme.colors.text.tertiary} />
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
          }}>
            No preview available
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
        borderBottom: `1px solid ${theme.colors.bg.border}`,
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
            background: theme.colors.accent.success || '#10b981',
            boxShadow: `0 0 8px ${theme.colors.accent.success || '#10b981'}40`,
          }}></div>
          Live Preview
        </div>

        {/* Zoom controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.bg.border}`,
              color: zoom <= 25 ? theme.colors.text.tertiary : theme.colors.text.primary,
              cursor: zoom <= 25 ? 'not-allowed' : 'pointer',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.radius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              opacity: zoom <= 25 ? 0.5 : 1,
            }}
            title="Zoom out (Ctrl/Cmd + Scroll)"
          >
            −
          </button>

          <button
            onClick={handleZoomReset}
            style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.bg.border}`,
              color: theme.colors.text.primary,
              cursor: 'pointer',
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.radius.md,
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              minWidth: '60px',
            }}
            title="Reset zoom"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.bg.border}`,
              color: zoom >= 200 ? theme.colors.text.tertiary : theme.colors.text.primary,
              cursor: zoom >= 200 ? 'not-allowed' : 'pointer',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.radius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              opacity: zoom >= 200 ? 0.5 : 1,
            }}
            title="Zoom in (Ctrl/Cmd + Scroll)"
          >
            +
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#ffffff',
          borderRadius: errors.length > 0 ? '0' : `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
          overflow: 'auto',
          border: `2px solid ${theme.colors.bg.border}`,
          borderTop: 'none',
          borderBottom: errors.length > 0 ? 'none' : `2px solid ${theme.colors.bg.border}`,
          position: 'relative',
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          minWidth: zoom !== 100 ? `${100 * 100 / zoom}%` : '100%',
          minHeight: zoom !== 100 ? `${100 * 100 / zoom}%` : '100%',
        }}>
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            sandbox="allow-scripts allow-forms allow-same-origin"
            title="Website Preview"
          />
        </div>
      </div>

      {/* Error Display Section */}
      {errors.length > 0 && (
        <div style={{
          background: theme.colors.bg.secondary,
          borderTop: `1px solid ${theme.colors.bg.border}`,
          borderLeft: `2px solid ${theme.colors.bg.border}`,
          borderRight: `2px solid ${theme.colors.bg.border}`,
          borderBottom: `2px solid ${theme.colors.bg.border}`,
          borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        }}>
          {/* Error Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: '#fee2e2',
              borderBottom: showErrors ? `1px solid ${theme.colors.bg.border}` : 'none',
              cursor: 'pointer',
            }}
            onClick={() => setShowErrors(!showErrors)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: '#dc2626',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: theme.radius.full,
                background: '#dc2626',
                boxShadow: '0 0 8px #dc262640',
              }}></div>
              {errors.length} Error{errors.length > 1 ? 's' : ''} Found
            </div>

            <div style={{
              transform: showErrors ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: '#dc2626',
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
                  borderBottom: index < errors.length - 1 ? `1px solid ${theme.colors.bg.border}` : 'none',
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: 'Monaco, "Consolas", monospace',
                }}>
                  <div style={{
                    color: '#dc2626',
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                  }}>
                    {error.message}
                  </div>
                  {error.source && (
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.typography.fontSize.xs,
                    }}>
                      Source: {error.source}{error.line ? `:${error.line}` : ''}
                    </div>
                  )}
                </div>
              ))}

              <div style={{
                padding: theme.spacing.sm,
                borderTop: `1px solid ${theme.colors.bg.border}`,
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
                    border: `1px solid ${theme.colors.bg.border}`,
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    borderRadius: theme.radius.lg,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.sans,
                    transition: `all ${theme.animation.normal}`,
                    boxShadow: theme.shadows.outset,
                  }}
                >
                  Clear Errors
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
