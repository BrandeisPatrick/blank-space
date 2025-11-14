import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { PaperclipIcon, ArrowUpIcon } from '../icons/icons';

export const EnhancedChatInput = ({ placeholder = "Let's make something", onFocus, onSend }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: theme.spacing.xl,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '800px',
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.bg.border}`,
        borderRadius: theme.radius.xl,
        boxShadow: theme.shadows.md,
      }}>
        {/* Attachment Button */}
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            background: 'transparent',
            border: 'none',
            borderRadius: theme.radius.full,
            cursor: 'pointer',
            color: theme.colors.text.tertiary,
            transition: `all ${theme.animation.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.bg.tertiary;
            e.currentTarget.style.color = theme.colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.colors.text.tertiary;
          }}
        >
          <PaperclipIcon size={20} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.sans,
            padding: `${theme.spacing.sm} 0`,
          }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            background: message.trim() ? '#333333' : theme.colors.bg.tertiary,
            border: 'none',
            borderRadius: theme.radius.full,
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            color: message.trim() ? '#ffffff' : theme.colors.text.tertiary,
            transition: `all ${theme.animation.fast}`,
            opacity: message.trim() ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (message.trim()) {
              e.currentTarget.style.background = '#444444';
            }
          }}
          onMouseLeave={(e) => {
            if (message.trim()) {
              e.currentTarget.style.background = '#333333';
            }
          }}
        >
          <ArrowUpIcon size={20} />
        </button>
      </div>
    </div>
  );
};
