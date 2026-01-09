import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { LightningIcon } from '../icons'
import { Error } from './Error'
import { LoadingDots } from '../ui/LoadingDots'
import { filterVisibleMessages } from '../../utils/messageUtils'

export const Messages = ({ messages = [], onFixBug, isMobile = false }) => {
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
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Messages container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isMobile ? theme.spacing.sm : theme.spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? theme.spacing.md : theme.spacing.lg,
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
              .map((message, index) => {
                // Bug #8 fix: Generate stable key if message.id is missing
                // Use index as final fallback to ensure unique keys
                const key = message.id || `msg-${message.timestamp || index}-${message.type || index}`;
                return (
                  <ChatMessage key={key} message={message} onFixBug={onFixBug} isMobile={isMobile} />
                );
              })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

const ChatMessage = ({ message, onFixBug, isMobile = false }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  const isLoading = message.isLoading

  // Font sizes responsive to mobile
  const fontSize = isMobile ? '14px' : '15px'
  const codeFontSize = isMobile ? '12px' : '13px'

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

    return <Error error={message.error} onFixBug={handleFixBug} />;
  }

  // Legacy error messages (with content only) - simple plain text style
  if (isError) {
    return (
      <div style={{
        alignSelf: 'flex-start',
        padding: `${theme.spacing.xs} 0`,
        fontFamily: theme.typography.fontFamily.sans,
        fontSize,
        lineHeight: '1.6',
        color: theme.colors.text.secondary,
      }}>
        {message.content || 'An error occurred'}
      </div>
    )
  }

  // Loading message with animated dots or action text (Grok-style: left-aligned, minimal)
  if (isLoading) {
    return (
      <div style={{
        alignSelf: 'flex-start',
        color: theme.colors.text.secondary,
        padding: `${theme.spacing.xs} 0`,
        fontFamily: theme.typography.fontFamily.sans,
        fontSize,
        lineHeight: '1.6',
        fontStyle: 'italic',
      }}>
        {message.content || <LoadingDots />}
      </div>
    )
  }

  // Bug #12 fix: Null check for content
  const content = message.content || '';

  // Grok-style messages: user = right-aligned bubbles, AI = plain left-aligned text
  if (isUser) {
    return (
      <div style={{
        alignSelf: 'flex-end',
        background: theme.colors.bg.tertiary,
        color: theme.colors.text.primary,
        padding: isMobile ? '10px 14px' : '12px 18px',
        borderRadius: isMobile ? '18px' : '20px',
        maxWidth: isMobile ? '85%' : '80%',
        width: 'fit-content',
        fontFamily: theme.typography.fontFamily.sans,
        fontSize,
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>
    )
  }

  // AI/assistant message - markdown rendered
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        color: theme.colors.text.primary,
        padding: `${theme.spacing.xs} 0`,
        maxWidth: isMobile ? '95%' : '90%',
        fontFamily: theme.typography.fontFamily.sans,
        fontSize,
        lineHeight: '1.6',
        fontWeight: 400,
        letterSpacing: '0.01em',
      }}
      className="markdown-content"
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ margin: isMobile ? '0 0 10px 0' : '0 0 12px 0' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: isMobile ? '6px 0' : '8px 0', paddingLeft: isMobile ? '16px' : '20px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: isMobile ? '6px 0' : '8px 0', paddingLeft: isMobile ? '16px' : '20px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: isMobile ? '3px 0' : '4px 0' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          code: ({ inline, children }) => inline
            ? <code style={{ background: theme.colors.bg.tertiary, padding: '2px 6px', borderRadius: '4px', fontSize: codeFontSize }}>{children}</code>
            : <pre style={{ background: theme.colors.bg.tertiary, padding: isMobile ? '10px' : '12px', borderRadius: '8px', overflow: 'auto', margin: isMobile ? '6px 0' : '8px 0', fontSize: codeFontSize }}><code>{children}</code></pre>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
