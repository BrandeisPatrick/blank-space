import { theme } from '../../styles/theme'

export interface ConsoleMessage {
  id: string
  type: 'error' | 'warning' | 'log' | 'info'
  message: string
  timestamp: number
  source?: string
  line?: number
  column?: number
}

interface ErrorConsoleProps {
  messages: ConsoleMessage[]
  onClear: () => void
}

export const ErrorConsole = ({ messages, onClear }: ErrorConsoleProps) => {
  const getMessageIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'log': return '📝'
      default: return '📝'
    }
  }

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      case 'log': return '#cccccc'
      default: return '#cccccc'
    }
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: theme.colors.bg.secondary,
      display: 'flex',
      flexDirection: 'column',
      borderTop: `1px solid ${theme.colors.bg.border}`,
    }}>
      {/* Console Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: `1px solid ${theme.colors.bg.border}`,
        backgroundColor: theme.colors.bg.tertiary,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            color: theme.colors.text.secondary,
            fontSize: '13px',
            fontWeight: 500,
          }}>
            Console
          </span>
          {messages.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              {messages.filter(m => m.type === 'error').length > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {messages.filter(m => m.type === 'error').length}
                </span>
              )}
              {messages.filter(m => m.type === 'warning').length > 0 && (
                <span style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {messages.filter(m => m.type === 'warning').length}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.text.secondary,
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.bg.hover
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          Clear
        </button>
      </div>

      {/* Console Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            color: theme.colors.text.tertiary,
            fontSize: '13px',
            padding: '12px',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            No console messages
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '6px 8px',
                  backgroundColor: message.type === 'error' 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : message.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'transparent',
                  borderRadius: '4px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '12px',
                  lineHeight: '18px',
                }}
              >
                <span style={{ 
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {getMessageIcon(message.type)}
                </span>
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  <div style={{ 
                    color: getMessageColor(message.type),
                    wordBreak: 'break-word',
                  }}>
                    {message.message}
                  </div>
                  {message.source && (
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: '11px',
                    }}>
                      {message.source}
                      {message.line && `:${message.line}`}
                      {message.column && `:${message.column}`}
                    </div>
                  )}
                </div>
                <span style={{
                  color: theme.colors.text.tertiary,
                  fontSize: '11px',
                  flexShrink: 0,
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}