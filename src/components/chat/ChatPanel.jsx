import { useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { LightningIcon } from '../icons'
import { ErrorMessage } from './ErrorMessage'
import { LoadingDots } from '../ui/LoadingDots'
import { filterVisibleMessages } from '../../utils/messageUtils'

export const ChatPanel = ({ messages = [], onFixBug }) => {
  const messagesEndRef = useRef(null)
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div style={{
      height: '100%',
      backgroundColor: theme.colors.bg.primary,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Messages container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: theme.spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
        minHeight: 0,
        maxHeight: '100%',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              maxWidth: '300px',
            }}>
              <div style={{
                marginBottom: theme.spacing.lg,
                display: 'flex',
                justifyContent: 'center',
              }}>
                <LightningIcon size={48} color={theme.colors.text.tertiary} />
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
              }}>
                Ready to build?
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.tertiary,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}>
                Start by describing what you want to create
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Regular messages */}
            {filterVisibleMessages(messages)
              .map((message, index) => (
                <ChatMessage key={message.id || index} message={message} onFixBug={onFixBug} />
              ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

const ChatMessage = ({ message, onFixBug }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  const isLoading = message.isLoading

  // Error messages with error object (from preview/runtime errors)
  if (isError && message.error) {
    const handleFixBug = () => {
      if (onFixBug) {
        // Format error message for AI
        const errorContext = message.error.file
          ? `Syntax error in ${message.error.file}: ${message.error.message}${message.error.line ? ` (line ${message.error.line})` : ''}\nSource: ${message.error.file}${message.error.line ? `:${message.error.line}` : ''}\nfix this bug`
          : `Error: ${message.error.message}\nfix this bug`;

        onFixBug(errorContext);
      }
    };

    return <ErrorMessage error={message.error} onFixBug={handleFixBug} />;
  }

  // Legacy error messages (with content only)
  if (isError) {
    return (
      <div style={{
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        background: '#fee2e2',
        borderRadius: theme.radius.lg,
        borderLeft: '4px solid #dc2626',
        fontSize: theme.typography.fontSize.sm,
        color: '#dc2626',
      }}>
        ⚠️ {message.content}
      </div>
    )
  }

  // Loading message with animated dots or action text
  if (isLoading) {
    return (
      <div style={{
        background: theme.colors.bg.secondary,
        color: theme.colors.text.secondary,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        borderRadius: theme.radius.lg,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.relaxed,
        width: '100%',
        border: `1px solid ${theme.colors.border}`,
        fontStyle: 'italic',
      }}>
        {message.content ? message.content : <LoadingDots />}
      </div>
    )
  }

  // Regular user/assistant/complete messages - simplified, no avatars, all left-aligned
  return (
    <div style={{
      background: isUser ? theme.colors.bg.tertiary : theme.colors.bg.secondary,
      color: theme.colors.text.primary,
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      borderRadius: theme.radius.lg,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.relaxed,
      whiteSpace: 'pre-wrap',
      width: '100%',
      border: `1px solid ${theme.colors.border}`,
    }}>
      {message.content}
    </div>
  )
}
