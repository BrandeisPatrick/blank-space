import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { BinaIcon } from '../icons'
import { LoadingDots } from './LoadingDots'
import { filterVisibleMessages } from '../../utils/messageUtils'
import { Z_INDEX, FLOATING_WINDOWS } from '../../constants'

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
  const visibleMessages = filterVisibleMessages(messages)

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
          top: FLOATING_WINDOWS.CHAT_PANEL.ICON_TOP,
          right: FLOATING_WINDOWS.CHAT_PANEL.ICON_RIGHT,
          width: `${FLOATING_WINDOWS.CHAT_PANEL.ICON_SIZE}px`,
          height: `${FLOATING_WINDOWS.CHAT_PANEL.ICON_SIZE}px`,
          borderRadius: theme.radius.full,
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.7) 0%, rgba(20, 40, 70, 0.8) 50%, rgba(15, 30, 55, 0.85) 100%)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: Z_INDEX.FLOATING_CHAT_ICON,
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 20, 60, 0.5), inset 0 1px 0 rgba(100, 150, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
            : theme.shadows.xl,
          border: mode === 'dark' ? '1px solid rgba(80, 130, 200, 0.2)' : 'none',
        }}
      >
        <BinaIcon size={32} />
      </div>

      {/* Chat Panel - Below the Bina icon */}
      <div
        style={{
          position: 'fixed',
          top: FLOATING_WINDOWS.CHAT_PANEL.PANEL_TOP,
          right: FLOATING_WINDOWS.CHAT_PANEL.PANEL_RIGHT,
          width: FLOATING_WINDOWS.CHAT_PANEL.PANEL_WIDTH,
          maxHeight: FLOATING_WINDOWS.CHAT_PANEL.PANEL_MAX_HEIGHT,
          borderRadius: theme.radius['2xl'],
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'linear-gradient(145deg, rgba(25, 50, 85, 0.65) 0%, rgba(18, 38, 68, 0.75) 40%, rgba(12, 28, 52, 0.8) 100%)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: Z_INDEX.FLOATING_CHAT_PANEL,
          boxShadow: mode === 'dark'
            ? '0 12px 40px rgba(0, 15, 50, 0.6), inset 0 1px 0 rgba(100, 160, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25)'
            : theme.shadows.xl,
          border: mode === 'dark' ? '1px solid rgba(70, 120, 190, 0.18)' : 'none',
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
              background: '#C97D63',
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
