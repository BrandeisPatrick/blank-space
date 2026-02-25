import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { LightningIcon } from '../icons'
import { ThinkingBlock } from '../ui/ThinkingBlock'
import { filterVisibleMessages } from '../../utils/messageUtils'

// Reply arrow icon for suggestion buttons
const ReplyArrowIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </svg>
)

const SuggestionButtons = ({ suggestions, onSend, isMobile = false }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!suggestions || suggestions.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginTop: '12px',
    }}>
      {suggestions.map((suggestion, idx) => {
        const truncated = suggestion.length > 60 ? suggestion.slice(0, 57) + '...' : suggestion
        return (
          <button
            key={idx}
            onClick={() => onSend(suggestion)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: isMobile ? '6px 4px' : '6px 4px',
              borderRadius: '8px',
              textAlign: 'left',
              color: theme.colors.text.tertiary,
              fontFamily: theme.typography.fontFamily.sans,
              fontSize: isMobile ? '13px' : '14px',
              lineHeight: '1.4',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.text.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.text.tertiary;
            }}
          >
            <ReplyArrowIcon size={14} color="currentColor" />
            <span>{truncated}</span>
          </button>
        )
      })}
    </div>
  )
}

export const Messages = ({ messages = [], onDebug, onSendSuggestion, isProcessing = false, isMobile = false }) => {
  const messagesEndRef = useRef(null)
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Find the index of the last non-loading assistant message for suggestion rendering
  const visibleMessages = filterVisibleMessages(messages)
  let lastAssistantIdx = -1
  for (let i = visibleMessages.length - 1; i >= 0; i--) {
    if (visibleMessages[i].type === 'assistant' && !visibleMessages[i].isLoading) {
      lastAssistantIdx = i
      break
    }
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Messages container */}
      <div
        style={{
          padding: isMobile ? theme.spacing.sm : theme.spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? theme.spacing.md : theme.spacing.lg,
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
            {visibleMessages
              .map((message, index) => {
                // Bug #8 fix: Generate stable key if message.id is missing
                // Use index as final fallback to ensure unique keys
                const key = message.id || `msg-${message.timestamp || index}-${message.type || index}`;
                const showSuggestions = !isProcessing
                  && onSendSuggestion
                  && index === lastAssistantIdx
                  && message.suggestions?.length > 0;
                return (
                  <div key={key}>
                    <ChatMessage message={message} onDebug={onDebug} isMobile={isMobile} />
                    {showSuggestions && (
                      <SuggestionButtons
                        suggestions={message.suggestions}
                        onSend={onSendSuggestion}
                        isMobile={isMobile}
                      />
                    )}
                  </div>
                );
              })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

const ChatMessage = ({ message, onDebug, isMobile = false }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  const isLoading = message.isLoading

  // Font sizes responsive to mobile
  const fontSize = isMobile ? '14px' : '15px'
  const codeFontSize = isMobile ? '12px' : '13px'

  // Error messages should not be shown in chat - only in preview panel
  if (isError) {
    return null;
  }

  // Loading message with thinking steps
  if (isLoading) {
    return (
      <div style={{
        alignSelf: 'flex-start',
        padding: `${theme.spacing.xs} 0`,
        maxWidth: isMobile ? '95%' : '90%',
      }}>
        <ThinkingBlock
          steps={message.thinking || []}
          isComplete={false}
        />
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
        {/* Display images if present */}
        {message.images && message.images.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: content ? '8px' : 0,
          }}>
            {message.images.map((img, idx) => {
              // Use Storage URL if available, otherwise fall back to base64 data URL
              const src = img.url || (img.base64 ? `data:${img.mimeType};base64,${img.base64}` : null);
              if (!src) return null;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`Uploaded ${idx + 1}`}
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
              );
            })}
          </div>
        )}
        {content}
      </div>
    )
  }

  // AI/assistant message - markdown rendered with optional thinking block
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: `${theme.spacing.xs} 0`,
        maxWidth: isMobile ? '95%' : '90%',
      }}
    >
      {/* Collapsed thinking block (if thinking steps exist) */}
      {message.thinking && message.thinking.length > 0 && (
        <ThinkingBlock
          steps={message.thinking}
          duration={message.thinkingDuration}
          isComplete={true}
        />
      )}

      {/* Message content */}
      <div
        style={{
          color: theme.colors.text.primary,
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
    </div>
  )
}
