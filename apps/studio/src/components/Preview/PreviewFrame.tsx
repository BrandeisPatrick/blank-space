import { useEffect, useRef } from 'react'
import { useAppStore } from '../../state/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

export const PreviewFrame = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { currentArtifactId, artifacts } = useAppStore()
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const currentArtifact = artifacts.find(a => a.id === currentArtifactId)

  useEffect(() => {
    if (!currentArtifact || !iframeRef.current) return

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
        borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        overflow: 'hidden',
        border: `2px solid ${theme.colors.border}`,
        borderTop: 'none',
      }}>
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
          }}
          sandbox="allow-scripts allow-same-origin"
          title="Website Preview"
        />
      </div>
    </div>
  )
}