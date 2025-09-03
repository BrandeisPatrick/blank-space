import { } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface LandingPageProps {
  onTryNow: () => void
  onSignIn: () => void
}

export const LandingPage = ({ onTryNow, onSignIn }: LandingPageProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.colors.bg.primary,
      backgroundImage: theme.colors.gradient.subtle,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      {/* Header */}
      <header style={{
        padding: `${theme.spacing.xl} ${theme.spacing['3xl']}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: theme.colors.bg.secondary,
        boxShadow: theme.shadows.outset,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <h1 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
          </h1>
        </div>
        
        <button
          onClick={onSignIn}
          style={{
            background: theme.colors.bg.tertiary,
            border: 'none',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            borderRadius: theme.radius.lg,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `all ${theme.animation.normal}`,
            boxShadow: theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.bg.hover
            e.currentTarget.style.color = theme.colors.accent.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.bg.tertiary
            e.currentTarget.style.color = theme.colors.text.secondary
            e.currentTarget.style.boxShadow = theme.shadows.outset
          }}
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing['3xl'],
      }}>
        <div style={{
          maxWidth: '800px',
          textAlign: 'center',
        }}>
          {/* Hero Title */}
          <h2 style={{
            fontSize: '3.5rem',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: `0 0 ${theme.spacing.xl} 0`,
            lineHeight: theme.typography.lineHeight.tight,
          }}>
            <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
          </h2>

          {/* Hero Subtitle */}
          <p style={{
            fontSize: theme.typography.fontSize.xl,
            color: theme.colors.text.secondary,
            margin: `0 0 ${theme.spacing['3xl']} 0`,
            lineHeight: theme.typography.lineHeight.relaxed,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Turn ideas into websites with AI
          </p>


          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.lg,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={onTryNow}
              style={{
                padding: `${theme.spacing.xl} ${theme.spacing['2xl']}`,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: '#ffffff',
                backgroundColor: '#2a2a2a',
                border: 'none',
                borderRadius: theme.radius['2xl'],
                cursor: 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
                transition: `all ${theme.animation.normal}`,
                boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3)',
                minWidth: '160px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333'
                e.currentTarget.style.boxShadow = '6px 6px 12px rgba(0, 0, 0, 0.7), -6px -6px 12px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.2), inset -1px -1px 2px rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a'
                e.currentTarget.style.boxShadow = '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.8), -4px -4px 8px rgba(255, 255, 255, 0.05), inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(1px)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = '#333333'
                e.currentTarget.style.boxShadow = '6px 6px 12px rgba(0, 0, 0, 0.7), -6px -6px 12px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.2), inset -1px -1px 2px rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
            >
              Try It Free
            </button>

            <button
              onClick={onSignIn}
              style={{
                padding: `${theme.spacing.xl} ${theme.spacing['2xl']}`,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: '#ffffff',
                backgroundColor: '#2a2a2a',
                border: 'none',
                borderRadius: theme.radius['2xl'],
                cursor: 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
                transition: `all ${theme.animation.normal}`,
                boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3)',
                minWidth: '160px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333'
                e.currentTarget.style.boxShadow = '6px 6px 12px rgba(0, 0, 0, 0.7), -6px -6px 12px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.2), inset -1px -1px 2px rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a'
                e.currentTarget.style.boxShadow = '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.8), -4px -4px 8px rgba(255, 255, 255, 0.05), inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(1px)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = '#333333'
                e.currentTarget.style.boxShadow = '6px 6px 12px rgba(0, 0, 0, 0.7), -6px -6px 12px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.2), inset -1px -1px 2px rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
            >
              Sign In & Save Work
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}