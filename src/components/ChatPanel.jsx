import { useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'
import { LightningIcon, BinaIcon } from './icons'
import { CompactThinkingPanel } from './CompactThinkingPanel'

export const ChatPanel = ({ messages = [], thinkingState = null }) => {
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
      {/* Chat header */}
      <div style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.md}`,
        borderBottom: `1px solid ${theme.colors.bg.border}`,
        background: theme.colors.bg.secondary,
        display: 'flex',
        alignItems: 'center',
        height: '97.34px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          color: theme.colors.text.primary,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: theme.radius.full,
            background: theme.colors.bg.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BinaIcon size={28} />
          </div>
          Bina
        </div>
      </div>

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
            {messages
              .filter(message => {
                // Show user, assistant, complete, and error messages
                // Exclude 'thinking', 'intent', and 'plan' messages (handled separately)
                const visibleTypes = ['user', 'assistant', 'complete', 'error']
                return visibleTypes.includes(message.type)
              })
              .map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}

            {/* Thinking Panel - styled as a Bina message, shown after messages */}
            {thinkingState && thinkingState.isActive && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: theme.radius.full,
                    background: theme.colors.bg.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    <BinaIcon size={24} />
                  </div>
                  <span style={{ fontWeight: theme.typography.fontWeight.medium }}>
                    Bina
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  maxWidth: '85%',
                }}>
                  <CompactThinkingPanel
                    phase={thinkingState.phase}
                    steps={thinkingState.steps}
                    answer={thinkingState.answer}
                    isVisible={thinkingState.isVisible}
                    onToggleVisibility={thinkingState.toggleVisibility}
                  />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

const ChatMessage = ({ message }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const isUser = message.type === 'user'
  const isError = message.type === 'error'

  // Error messages
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

  // Regular user/assistant/complete messages
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.sm,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: theme.radius.full,
          background: isUser ? theme.colors.gradient.primary : theme.colors.bg.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          {isUser ? '👤' : <BinaIcon size={24} />}
        </div>
        <span style={{ fontWeight: theme.typography.fontWeight.medium }}>
          {isUser ? 'You' : 'Bina'}
        </span>
      </div>

      <div style={{
        background: isUser ? theme.colors.bg.tertiary : theme.colors.bg.secondary,
        color: theme.colors.text.primary,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        borderRadius: theme.radius.md,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.relaxed,
        whiteSpace: 'pre-wrap',
        maxWidth: '85%',
        border: `1px solid ${theme.colors.border}`,
      }}>
        {message.content}
      </div>
    </div>
  )
}
