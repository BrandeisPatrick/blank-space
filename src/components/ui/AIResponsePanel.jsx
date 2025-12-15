import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { LoadingDots } from './LoadingDots'
import { filterVisibleMessages } from '../../utils/messageUtils'
import { Z_INDEX, FLOATING_WINDOWS } from '../../constants'
import { getRandomTip } from '../../knowledge/tips'

export const AIResponsePanel = ({
  visible = false,
  messages = [],
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
        width: FLOATING_WINDOWS.AI_RESPONSE.PANEL_WIDTH,
        maxHeight: FLOATING_WINDOWS.AI_RESPONSE.PANEL_MAX_HEIGHT,
        borderRadius: theme.radius['2xl'],
        ...createGlassEffect(theme),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: Z_INDEX.AI_RESPONSE_PANEL,
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
              {loadingMessage.content ? loadingMessage.content : <LoadingDots />}
              <div style={{
                marginTop: theme.spacing.md,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}>
                Tips: {tip}
              </div>
            </div>
          )}

          {/* Assistant response */}
          {!loadingMessage && lastAssistantMessage && (
            <div style={{
              alignSelf: 'flex-start',
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.base,
              lineHeight: theme.typography.lineHeight.relaxed,
              fontFamily: theme.typography.fontFamily.sans,
              whiteSpace: 'pre-wrap',
              maxWidth: '95%',
            }}>
              {lastAssistantMessage.content}
            </div>
          )}
        </div>
    </div>
  )
}
