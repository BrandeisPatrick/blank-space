import React, { useState } from 'react'
import { useAppStore } from '../../pages/appStore'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'

interface ChatInputProps {
  onSend: (message: string) => void
}

export const ChatInput = React.memo(({ onSend }: ChatInputProps) => {
  const { isGenerating } = useAppStore()
  const [message, setMessage] = useState('')
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const handleSubmit = () => {
    if (message.trim() && !isGenerating) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={{
      padding: theme.spacing.lg,
      borderTop: `1px solid ${theme.colors.border}`,
      background: theme.colors.bg.secondary,
    }}>
      <div style={{
        display: 'flex',
        gap: theme.spacing.md,
        alignItems: 'flex-end'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say hello or describe what you want to build..."
            disabled={isGenerating}
            style={{
              width: '100%',
              minHeight: '52px',
              maxHeight: '120px',
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              background: theme.colors.bg.primary,
              border: 'none',
              borderRadius: theme.radius.lg,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: theme.typography.lineHeight.normal,
              resize: 'none',
              outline: 'none',
              fontFamily: theme.typography.fontFamily.sans,
              boxShadow: theme.shadows.sm,
              transition: `all ${theme.animation.normal}`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.sm
            }}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isGenerating}
          style={{
            padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
            background: (!message.trim() || isGenerating) 
              ? theme.colors.bg.tertiary 
              : mode === 'dark' ? theme.colors.gradient.button : theme.colors.gradient.primary,
            color: mode === 'dark' ? '#ffffff' : ((!message.trim() || isGenerating) ? theme.colors.text.disabled : theme.colors.accent.primary),
            border: 'none',
            borderRadius: theme.radius.lg,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.bold,
            cursor: (!message.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            transition: `all ${theme.animation.normal}`,
            minWidth: '80px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: (!message.trim() || isGenerating) 
              ? mode === 'dark' ? theme.shadows.md : theme.shadows.sm 
              : theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            if (message.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = theme.shadows.glow
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (message.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = theme.shadows.outset
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          {isGenerating ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${theme.colors.text.disabled}`,
              borderTop: '2px solid transparent',
              borderRadius: theme.radius.full,
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            '▶'
          )}
        </button>
      </div>
      
      <div style={{
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
        marginTop: theme.spacing.sm,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{message.length}/2000</span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})