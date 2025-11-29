import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { BinaIcon } from '../icons'

// Animated dots component for loading state
const LoadingDots = () => {
  return (
    <span style={{ display: 'inline-flex', gap: '4px' }}>
      <span className="loading-dot" style={{ animationDelay: '0ms' }}>.</span>
      <span className="loading-dot" style={{ animationDelay: '200ms' }}>.</span>
      <span className="loading-dot" style={{ animationDelay: '400ms' }}>.</span>
      <style>{`
        @keyframes loadingDot {
          0%, 20% { opacity: 0.3; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0.3; }
        }
        .loading-dot {
          animation: loadingDot 1.4s ease-in-out infinite;
          font-size: 1.5em;
          line-height: 0.5;
        }
      `}</style>
    </span>
  )
}

export const FloatingChatPanel = ({
  visible = false,
  messages = [],
}) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!visible) {
    return null;
  }

  // Get only the current message to display
  // Priority: loading message > last assistant response > last user message
  const visibleMessages = messages.filter(msg =>
    ['user', 'assistant', 'complete', 'error'].includes(msg.type)
  )

  // Find the loading message (if any)
  const loadingMessage = visibleMessages.find(msg => msg.isLoading)

  // Find the last user message
  const lastUserMessage = [...visibleMessages].reverse().find(msg => msg.type === 'user')

  // Find the last assistant response (non-loading)
  const lastAssistantMessage = [...visibleMessages].reverse().find(msg =>
    (msg.type === 'assistant' || msg.type === 'complete') && !msg.isLoading && msg.content
  )

  // Show loading message if AI is working, otherwise show last user message
  const currentMessage = loadingMessage || lastAssistantMessage || lastUserMessage

  // Separate Bina icon + simplified current message display
  return (
    <>
      {/* Bina Icon - Separate floating indicator in top-right */}
      <div
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: theme.radius.full,
          ...createGlassEffect(theme),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          boxShadow: theme.shadows.xl,
        }}
      >
        <BinaIcon size={32} />
      </div>

      {/* Chat Panel - Below the Bina icon */}
      <div
        style={{
          position: 'fixed',
          top: '170px',
          right: '20px',
          width: '400px',
          maxHeight: '60vh',
          borderRadius: theme.radius['2xl'],
          ...createGlassEffect(theme),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 100,
          boxShadow: theme.shadows.xl,
        }}
      >
        {/* Messages container */}
        <div style={{
          padding: theme.spacing.lg,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}>
          {/* User's message */}
          {lastUserMessage && (
            <div style={{
              alignSelf: 'flex-end',
              background: theme.colors.accent.primary,
              color: '#fff',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.radius.lg,
              borderBottomRightRadius: theme.radius.sm,
              fontSize: theme.typography.fontSize.sm,
              maxWidth: '85%',
            }}>
              {lastUserMessage.content}
            </div>
          )}

          {/* Loading/status indicator */}
          {loadingMessage && (
            <div style={{
              alignSelf: 'flex-start',
              color: theme.colors.text.secondary,
              padding: `${theme.spacing.sm} 0`,
              fontSize: theme.typography.fontSize.sm,
              fontStyle: 'italic',
            }}>
              {loadingMessage.content ? loadingMessage.content : <LoadingDots />}
            </div>
          )}

          {/* Assistant response */}
          {!loadingMessage && lastAssistantMessage && (
            <div style={{
              alignSelf: 'flex-start',
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: theme.typography.lineHeight.relaxed,
              whiteSpace: 'pre-wrap',
              maxWidth: '95%',
            }}>
              {lastAssistantMessage.content}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
