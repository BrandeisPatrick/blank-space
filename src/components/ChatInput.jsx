import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'

export const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('')
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && onSend) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div style={{
      padding: theme.spacing.lg,
      borderTop: `1px solid ${theme.colors.bg.border}`,
      background: theme.colors.bg.secondary,
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: theme.spacing.sm }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.bg.border}`,
            borderRadius: theme.radius.lg,
            outline: 'none',
            fontFamily: theme.typography.fontFamily.sans,
          }}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.bg.primary,
            background: message.trim() ? theme.colors.accent.primary : theme.colors.bg.tertiary,
            border: 'none',
            borderRadius: theme.radius.lg,
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            transition: `all ${theme.animation.normal}`,
            boxShadow: theme.shadows.outset,
            opacity: message.trim() ? 1 : 0.5,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
