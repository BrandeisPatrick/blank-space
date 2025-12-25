import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { parse } from '@babel/parser'
import { GlobeIcon } from '../icons'

export const PreviewPanel = ({ files, onError, onDebug, isDebugging = false, zoom: externalZoom, hideHeader = false }) => {
  const iframeRef = useRef(null)
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [errors, setErrors] = useState([])
  const [showErrors, setShowErrors] = useState(false)
  const [internalZoom, setInternalZoom] = useState(100)

  // Use external zoom if provided, otherwise use internal
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom
  const setZoom = setInternalZoom

  // Helper function to strip ES6 imports and duplicate declarations from React code
  const stripImports = (code) => {
    return code
      // Remove ALL import statements
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')
      // Remove all export statements (export default, export function, export const, etc.)
      .replace(/export\s+(default\s+)?/g, '')
      // Remove duplicate AnimatePresence declarations (already provided by template)
      .replace(/const\s+AnimatePresence\s*=\s*[^;]+;?\s*/g, '')
      // Remove duplicate motion declarations (already provided by template)
      .replace(/const\s+motion\s*=\s*[^;]+;?\s*/g, '')
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

      // Notify parent component about error
      if (onError && validationErrors[0]) {
        const error = validationErrors[0];
        onError({
          message: error.message,
          file: error.source,
          line: error.line,
          column: null
        });
      }

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
        // Each non-App file is wrapped in an IIFE to isolate scope (prevents duplicate declaration errors)
        const allCode = Object.entries(files)
          .filter(([filename]) =>
            filename.endsWith('.jsx') ||
            filename.endsWith('.js') && filename !== 'script.js'
          )
          .map(([filename, code]) => {
            const stripped = stripImports(code)

            // App.jsx stays in global scope for ReactDOM.render
            if (filename === 'App.jsx') {
              return stripped
            }

            // Extract component name from filename (e.g., "components/GameInfo.jsx" -> "GameInfo")
            const componentName = filename
              .replace(/^.*\//, '')  // Remove path
              .replace(/\.(jsx?|tsx?)$/, '')  // Remove extension

            // Wrap in IIFE to isolate scope, expose component globally
            return `(function() {
${stripped}
  if (typeof ${componentName} !== 'undefined') window.${componentName} = ${componentName};
})();`
          })
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
      html { overflow-x: hidden; overflow-y: auto; }
      body, #root { min-height: 100vh; }

      /* Custom scrollbar styling */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.4); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.6); }
      * { scrollbar-width: thin; scrollbar-color: rgba(128, 128, 128, 0.4) transparent; }
      ${css}
    </style>
</head>
<body>
    <div id="root"></div>

    <!-- localStorage Polyfill for Sandboxed Iframe -->
    <script>
      // Create in-memory storage that mimics localStorage API
      (function() {
        const storage = {};

        const memoryStorage = {
          getItem: function(key) {
            return storage.hasOwnProperty(key) ? storage[key] : null;
          },
          setItem: function(key, value) {
            storage[key] = String(value);
          },
          removeItem: function(key) {
            delete storage[key];
          },
          clear: function() {
            for (let key in storage) {
              if (storage.hasOwnProperty(key)) {
                delete storage[key];
              }
            }
          },
          key: function(index) {
            const keys = Object.keys(storage);
            return index >= 0 && index < keys.length ? keys[index] : null;
          },
          get length() {
            return Object.keys(storage).length;
          }
        };

        // Override localStorage and sessionStorage
        Object.defineProperty(window, 'localStorage', {
          value: memoryStorage,
          writable: false,
          configurable: false
        });

        Object.defineProperty(window, 'sessionStorage', {
          value: memoryStorage,
          writable: false,
          configurable: false
        });
      })();
    </script>

    <!-- React & ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <!-- Framer Motion for animations -->
    <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>

    <!-- Error handling - MUST be before Babel to catch transpilation errors -->
    <script>
      window.addEventListener('error', function(e) {
        window.parent.postMessage({
          type: 'preview-error',
          error: {
            message: e.message || 'Unknown error',
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
            message: 'Promise rejection: ' + (e.reason?.message || e.reason || 'Unknown'),
            timestamp: Date.now()
          }
        }, '*');
      });
    </script>

    <!-- Babel Standalone for JSX transpilation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Your App Code -->
    <script type="text/babel">
      const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, useTransition } = React;

      // Framer Motion - expose if available
      const motion = window.Motion?.motion || ((tag) => tag);
      const AnimatePresence = window.Motion?.AnimatePresence || (({ children }) => children);

      ${allCode}

      // Render the app
      const root = ReactDOM.createRoot(document.getElementById('root'));
      if (typeof App !== 'undefined') {
        root.render(<App />);
      } else {
        root.render(
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <h3>No App Component Found</h3>
            <p>Please define an App component in your code.</p>
          </div>
        );
      }
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
      html { overflow-x: hidden; overflow-y: auto; }
      body, #root { min-height: 100vh; }

      /* Custom scrollbar styling */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.4); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.6); }
      * { scrollbar-width: thin; scrollbar-color: rgba(128, 128, 128, 0.4) transparent; }
      ${css}
    </style>
</head>
<body>
    <!-- localStorage Polyfill for Sandboxed Iframe -->
    <script>
      // Create in-memory storage that mimics localStorage API
      (function() {
        const storage = {};

        const memoryStorage = {
          getItem: function(key) {
            return storage.hasOwnProperty(key) ? storage[key] : null;
          },
          setItem: function(key, value) {
            storage[key] = String(value);
          },
          removeItem: function(key) {
            delete storage[key];
          },
          clear: function() {
            for (let key in storage) {
              if (storage.hasOwnProperty(key)) {
                delete storage[key];
              }
            }
          },
          key: function(index) {
            const keys = Object.keys(storage);
            return index >= 0 && index < keys.length ? keys[index] : null;
          },
          get length() {
            return Object.keys(storage).length;
          }
        };

        // Override localStorage and sessionStorage
        Object.defineProperty(window, 'localStorage', {
          value: memoryStorage,
          writable: false,
          configurable: false
        });

        Object.defineProperty(window, 'sessionStorage', {
          value: memoryStorage,
          writable: false,
          configurable: false
        });
      })();
    </script>

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

    // Debounce preview updates to avoid excessive iframe reloads
    // Wait 500ms after files stop changing before updating preview
    const timeoutId = setTimeout(() => {
      generatePreview()
    }, 500)

    // Cleanup: cancel pending update if files change again
    return () => clearTimeout(timeoutId)
    // Note: onError is included in dependencies to avoid stale closures
  }, [files, onError])

  // Listen for error messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'preview-error') {
        const newError = event.data.error
        setErrors(prev => [...prev, newError])
        setShowErrors(true)

        // Notify parent component about runtime errors
        if (onError) {
          onError(newError)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
    // Note: onError added to dependencies to avoid stale closures
  }, [onError])


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
      {/* Preview header - hidden when used in FloatingBrowserWindow */}
      {!hideHeader && (
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
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.01em',
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
      )}

      {/* Preview iframe */}
      <div
        style={{
          flex: 1,
          background: '#ffffff',
          borderRadius: errors.length > 0 ? '0' : `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
          overflow: 'hidden',
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
          overflow: 'hidden',
        }}>
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            sandbox="allow-scripts allow-forms"
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
          {/* Error Header with Debug Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2',
              borderBottom: showErrors ? `1px solid ${theme.colors.bg.border}` : 'none',
            }}
          >
            {/* Left: Error count (clickable to expand/collapse) */}
            <div
              onClick={() => setShowErrors(!showErrors)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                cursor: 'pointer',
                flex: 1,
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: theme.radius.full,
                background: '#ef4444',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
              }} />
              <span style={{
                color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
              }}>
                {errors.length} Error{errors.length > 1 ? 's' : ''} Found
              </span>
              <span style={{
                transform: showErrors ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${theme.animation.fast}`,
                color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                fontSize: '12px',
              }}>
                ▼
              </span>
            </div>

            {/* Right: Debug Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onDebug) {
                  onDebug(errors)
                } else {
                  setErrors([])
                  setShowErrors(false)
                }
              }}
              disabled={isDebugging}
              style={{
                background: isDebugging
                  ? (mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)')
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                cursor: isDebugging ? 'wait' : 'pointer',
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                borderRadius: theme.radius.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: theme.typography.fontFamily.sans,
                transition: `all ${theme.animation.fast}`,
                boxShadow: isDebugging ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
                opacity: isDebugging ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              {isDebugging ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Fixing...
                </>
              ) : (
                'Debug'
              )}
            </button>
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
                  padding: `${theme.spacing.md} ${theme.spacing.md}`,
                  borderBottom: index < errors.length - 1 ? `1px solid ${theme.colors.bg.border}` : 'none',
                }}>
                  <div style={{
                    color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.sans,
                    marginBottom: '4px',
                    lineHeight: 1.4,
                  }}>
                    {error.message}
                  </div>
                  {error.source && (
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.typography.fontSize.xs,
                      fontFamily: theme.typography.fontFamily.mono,
                    }}>
                      {error.source}{error.line ? `:${error.line}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
