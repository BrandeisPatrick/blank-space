import { useRef, useEffect } from 'react'
import { useAppStore } from '../../state/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { ChatMessage } from '../../types'
import { getTheme } from '../../styles/theme'
import { ReasoningTab } from './ReasoningTab'

export const ChatPanel = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { chatMessages } = useAppStore()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  return (
    <div style={{
      height: '100%',
      backgroundColor: theme.colors.bg.primary,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chat header */}
      <div style={{
        padding: theme.spacing['2xl'],
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bg.secondary,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.sm,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: theme.radius.full,
              background: theme.colors.gradient.primary,
              boxShadow: `0 0 12px ${theme.colors.accent.primary}40`,
            }}></div>
            AI Assistant
          </div>
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          lineHeight: theme.typography.lineHeight.normal,
        }}>
          Describe the website you want to create. Be specific about design, features, and functionality.
        </div>
      </div>

      {/* Messages container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: theme.spacing['2xl'],
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing['2xl'],
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.colors.border} transparent`,
        minHeight: 0, // Critical: allows flex item to shrink below content size
        maxHeight: '100%', // Ensure it doesn't exceed container height
      }}>
        {chatMessages.length === 0 ? (
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
                fontSize: '64px', 
                marginBottom: theme.spacing['2xl'],
                backgroundImage: theme.colors.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                ⚡
              </div>
              <div style={{ 
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
              }}>
                Ready to build something amazing?
              </div>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.tertiary,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}>
                Start by describing the website you want to create. I'll generate the code and show you a live preview.
              </div>
            </div>
          </div>
        ) : (
          chatMessages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

interface ChatMessageComponentProps {
  message: ChatMessage
}

const ChatMessageComponent = ({ message }: ChatMessageComponentProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isUser = message.type === 'user'

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
        order: isUser ? 1 : 0,
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: theme.radius.full,
          background: isUser ? theme.colors.gradient.primary : theme.colors.accent.success,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          boxShadow: isUser ? theme.shadows.glow : `0 0 12px ${theme.colors.accent.success}40`,
        }}>
          {isUser ? '👤' : '🤖'}
        </div>
        <span style={{ fontWeight: theme.typography.fontWeight.medium }}>
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        <span style={{ opacity: 0.7 }}>{formatTime(message.timestamp)}</span>
      </div>

      {/* Show reasoning section for AI messages */}
      {!isUser && (message.reasoningSteps || message.thinking) && (
        <div style={{ maxWidth: '85%' }}>
          <ReasoningTab 
            steps={message.reasoningSteps || []} 
            isVisible={true}
            autoCollapse={true}
          />
        </div>
      )}
      
      <div style={{
        background: isUser ? theme.colors.gradient.primary : theme.colors.bg.secondary,
        color: theme.colors.text.primary,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        borderRadius: theme.radius.xl,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.relaxed,
        whiteSpace: 'pre-wrap',
        maxWidth: '85%',
        boxShadow: isUser ? theme.shadows.glow : theme.shadows.md,
        border: `1px solid ${isUser ? 'transparent' : theme.colors.border}`,
        position: 'relative',
        backdropFilter: 'blur(10px)',
      }}>
        {message.content}
        
        {/* Message tail */}
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          [isUser ? 'right' : 'left']: '20px',
          width: '12px',
          height: '12px',
          background: isUser ? theme.colors.accent.primary : theme.colors.bg.secondary,
          transform: 'rotate(45deg)',
          border: `1px solid ${isUser ? 'transparent' : theme.colors.border}`,
          borderTop: 'none',
          borderLeft: 'none',
        }} />
      </div>
      
      {message.artifactId && (
        <div style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: theme.colors.bg.tertiary,
          borderRadius: theme.radius.md,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
          border: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          maxWidth: '85%',
        }}>
          <div style={{
            fontSize: '16px',
            background: theme.colors.gradient.primary,
            borderRadius: theme.radius.sm,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.primary }}>
              Website Generated
            </div>
            <div style={{ fontSize: theme.typography.fontSize.xs, opacity: 0.7 }}>
              Check the code editor and preview panels
            </div>
          </div>
        </div>
      )}
    </div>
  )
}