import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { LoadingDots } from './LoadingDots'
import { filterVisibleMessages } from '../../utils/messageUtils'
import { Z_INDEX, FLOATING_WINDOWS } from '../../constants'
import { CloseIcon } from '../icons/icons'

// Simple tips shown during loading
const TIPS = [
  'Try describing your app in detail for better results',
  'You can ask to modify specific parts of your app',
  'Use the Pro model for more complex applications',
  'Save your favorite apps to access them later',
  'Check out the App Store for ready-to-use templates',
];
const getRandomTip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

export const AIResponsePanel = ({
  visible = false,
  messages = [],
  onCollapse,
}) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [tip, setTip] = useState(() => getRandomTip())

  // Get only the current message to display
  // Priority: loading message > last assistant response > last user message
  const visibleMessages = filterVisibleMessages(messages)

  // Find the loading message (if any)
  const loadingMessage = visibleMessages.find(msg => msg.isLoading)

  // Rotate tips every 5 seconds while loading
  useEffect(() => {
    if (!loadingMessage) return
    const interval = setInterval(() => {
      setTip(getRandomTip())
    }, 5000)
    return () => clearInterval(interval)
  }, [loadingMessage])

  if (!visible) {
    return null;
  }

  // Find the last user message
  const lastUserMessage = [...visibleMessages].reverse().find(msg => msg.type === 'user')

  // Find the last assistant response (non-loading)
  const lastAssistantMessage = [...visibleMessages].reverse().find(msg =>
    (msg.type === 'assistant' || msg.type === 'complete') && !msg.isLoading && msg.content
  )

  // Show loading message if AI is working, otherwise show last user message
  const currentMessage = loadingMessage || lastAssistantMessage || lastUserMessage

  return (
    <div
      style={{
        position: 'fixed',
        top: FLOATING_WINDOWS.AI_RESPONSE.PANEL_TOP,
        right: FLOATING_WINDOWS.AI_RESPONSE.PANEL_RIGHT,
        width: `min(${FLOATING_WINDOWS.AI_RESPONSE.PANEL_WIDTH}, calc(100vw - 40px))`,
        maxHeight: FLOATING_WINDOWS.AI_RESPONSE.PANEL_MAX_HEIGHT,
        borderRadius: theme.radius['2xl'],
        ...createGlassEffect(theme),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: Z_INDEX.AI_RESPONSE_PANEL,
        boxSizing: 'border-box',
      }}
    >
        {/* Collapse button */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className={`hover-glass-strong-${mode} hover-transition`}
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              right: theme.spacing.sm,
              width: '32px',
              height: '32px',
              borderRadius: theme.radius.full,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <CloseIcon size={16} color={theme.colors.text.secondary} />
          </button>
        )}

        {/* Messages container */}
        <div style={{
          padding: theme.spacing.lg,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}>
          {/* Empty state - no messages yet */}
          {visibleMessages.length === 0 && (
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily.sans,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            }}>
              What do you want to imagine today?
            </div>
          )}

          {/* User's message */}
          {lastUserMessage && (
            <div style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.base,
              lineHeight: theme.typography.lineHeight.relaxed,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              {lastUserMessage.content}
            </div>
          )}

          {/* Loading/status indicator with tip */}
          {loadingMessage && (
            <div style={{
              alignSelf: 'flex-start',
              color: theme.colors.text.secondary,
              padding: `${theme.spacing.sm} 0`,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              {loadingMessage.content && loadingMessage.content !== 'Thinking...' ? loadingMessage.content : <LoadingDots />}
              <div style={{
                marginTop: theme.spacing.md,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}>
                Tips: {tip}
              </div>
            </div>
          )}

          {/* Assistant response with markdown support */}
          {!loadingMessage && lastAssistantMessage && (
            <div
              style={{
                alignSelf: 'flex-start',
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
                lineHeight: theme.typography.lineHeight.relaxed,
                fontFamily: theme.typography.fontFamily.sans,
                maxWidth: '95%',
              }}
              className="markdown-content"
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: '0 0 12px 0' }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li style={{ margin: '4px 0' }}>{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600 }}>{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code style={{
                      background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.9em',
                    }}>{children}</code>
                  ),
                }}
              >
                {lastAssistantMessage.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
    </div>
  )
}
