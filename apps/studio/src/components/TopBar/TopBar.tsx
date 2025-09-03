import { useAppStore } from '../../state/appStore'
import { useResponsive } from '../../hooks/useResponsive'
import { useTheme } from '../../contexts/ThemeContext'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import { getTheme } from '../../styles/theme'

interface TopBarProps {
  onNavigateToSignIn?: () => void
  onNavigateToDeveloper?: () => void
  user?: { name: string; email: string } | null
  isAuthenticated?: boolean
}

export const TopBar = ({ onNavigateToSignIn, onNavigateToDeveloper, user, isAuthenticated }: TopBarProps) => {
  const { showChat, showCode, showPreview, togglePanel } = useAppStore()
  const { isMobile } = useResponsive()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Check if developer mode is enabled
  const isDeveloperMode = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVELOPER_MODE === 'true'

  const buttonStyle = (isActive: boolean) => ({
    background: isActive ? theme.colors.gradient.primary : theme.colors.bg.secondary,
    border: 'none',
    color: isActive ? theme.colors.accent.primary : theme.colors.text.secondary,
    cursor: 'pointer',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.lg,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.sans,
    transition: `all ${theme.animation.normal}`,
    boxShadow: isActive ? theme.shadows.sm : theme.shadows.outset,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  })

  return (
    <div style={{
      height: '64px',
      background: theme.colors.gradient.subtle,
      borderBottom: `1px solid ${theme.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'space-between',
      padding: isMobile ? `0 ${theme.spacing.sm}` : `0 ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.sm,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      overflow: 'hidden',
      boxShadow: theme.shadows.outsetMd,
    }}>
      {/* Left section - Panel toggles - Hide on mobile since we have MobileToggleBar */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          background: theme.colors.bg.primary,
          padding: theme.spacing.xs,
          borderRadius: theme.radius.xl,
          boxShadow: theme.shadows.md,
        }}>
          <button
            onClick={() => togglePanel('chat')}
            style={buttonStyle(showChat)}
            onMouseEnter={(e) => {
              if (!showChat) {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.accent.primary
                e.currentTarget.style.boxShadow = theme.shadows.glow
              }
            }}
            onMouseLeave={(e) => {
              if (!showChat) {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.color = theme.colors.text.secondary
                e.currentTarget.style.boxShadow = theme.shadows.outset
              }
            }}
          >
            Chat
          </button>
          
          <button
            onClick={() => togglePanel('code')}
            style={buttonStyle(showCode)}
            onMouseEnter={(e) => {
              if (!showCode) {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.accent.primary
                e.currentTarget.style.boxShadow = theme.shadows.glow
              }
            }}
            onMouseLeave={(e) => {
              if (!showCode) {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.color = theme.colors.text.secondary
                e.currentTarget.style.boxShadow = theme.shadows.outset
              }
            }}
          >
            Code
          </button>
          
          <button
            onClick={() => togglePanel('preview')}
            style={buttonStyle(showPreview)}
            onMouseEnter={(e) => {
              if (!showPreview) {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.accent.primary
                e.currentTarget.style.boxShadow = theme.shadows.glow
              }
            }}
            onMouseLeave={(e) => {
              if (!showPreview) {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.color = theme.colors.text.secondary
                e.currentTarget.style.boxShadow = theme.shadows.outset
              }
            }}
          >
            Preview
          </button>
        </div>
      )}

      {/* Center section - Logo/Title */}
      <div style={{
        position: isMobile ? 'static' : 'absolute',
        left: isMobile ? 'auto' : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: isMobile ? theme.typography.fontSize.base : theme.typography.fontSize.lg,
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <span style={{ whiteSpace: 'nowrap' }}>
          {isMobile ? 'Studio' : (
            <>
              <span style={{ 
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 10px rgba(0, 0, 0, 0.8)',
                color: theme.colors.accent.primary,
                fontWeight: theme.typography.fontWeight.bold,
                display: 'inline-block',
                transform: 'translateZ(0)'
              }}>&lt;</span> blank space <span style={{ 
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 10px rgba(0, 0, 0, 0.8)',
                color: theme.colors.accent.primary,
                fontWeight: theme.typography.fontWeight.bold,
                display: 'inline-block',
                transform: 'translateZ(0)'
              }}>&gt;</span>
            </>
          )}
        </span>
      </div>

      {/* Right section - Actions - Hide on mobile for space */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <ThemeToggle />
          
          {/* Developer Button - Only show in development mode */}
          {isDeveloperMode && onNavigateToDeveloper && (
            <button
              onClick={onNavigateToDeveloper}
              style={{
                background: theme.colors.accent.warning + '20',
                color: theme.colors.accent.warning,
                border: `1px solid ${theme.colors.accent.warning}`,
                borderRadius: theme.radius.lg,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                transition: `all ${theme.animation.normal}`,
                height: '48px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.accent.warning + '30'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.accent.warning + '20'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🔧 Dev
            </button>
          )}
          
          {onNavigateToSignIn && (
            <button
              onClick={onNavigateToSignIn}
              style={{
                background: theme.colors.bg.secondary,
                border: 'none',
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                borderRadius: theme.radius.lg,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                transition: `all ${theme.animation.normal}`,
                boxShadow: theme.shadows.outset,
                height: '48px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.accent.primary
                e.currentTarget.style.boxShadow = theme.shadows.glow
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.color = theme.colors.text.secondary
                e.currentTarget.style.boxShadow = theme.shadows.outset
              }}
            >
              {isAuthenticated ? `Dashboard` : 'Sign In'}
            </button>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.colors.text.secondary,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              borderRadius: theme.radius.lg,
              transition: `all ${theme.animation.normal}`,
              background: theme.colors.bg.secondary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              boxShadow: theme.shadows.outset,
              height: '48px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.accent.primary
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.text.secondary
              e.currentTarget.style.background = theme.colors.bg.secondary
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = theme.shadows.outset
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      )}
    </div>
  )
}