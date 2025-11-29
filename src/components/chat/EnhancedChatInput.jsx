import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { ArrowUpIcon } from '../icons/icons';

// Plus icon for the dropdown trigger
const PlusIcon = ({ size = 20, color = "currentColor" }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Sparkles icon for Pro Components
const SparklesIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
    <path d="M19 15L20 18L23 19L20 20L19 23L18 20L15 19L18 18L19 15Z" />
  </svg>
);

// X icon for removing chip
const XSmallIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const EnhancedChatInput = ({
  placeholder = "Let's make something",
  onFocus,
  onSend,
  initialMessage = '',
  useKnowledgeBase = true,
  onToggleKnowledgeBase
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [message, setMessage] = useState(initialMessage);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Update message when initialMessage prop changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleAddProComponents = () => {
    if (onToggleKnowledgeBase && !useKnowledgeBase) {
      onToggleKnowledgeBase();
    }
    setShowDropdown(false);
  };

  const handleRemoveProComponents = (e) => {
    e.stopPropagation();
    if (onToggleKnowledgeBase && useKnowledgeBase) {
      onToggleKnowledgeBase();
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
      {/* Dropdown Menu - Positioned above the input */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: theme.spacing.sm,
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.xl,
            minWidth: '200px',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          <style>
            {`
              @keyframes dropdownFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>

          {/* Pro Components Option */}
          <div
            onClick={handleAddProComponents}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              cursor: useKnowledgeBase ? 'default' : 'pointer',
              transition: `background ${theme.animation.fast}`,
              opacity: useKnowledgeBase ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!useKnowledgeBase) {
                e.currentTarget.style.background = theme.colors.bg.tertiary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              color: '#a855f7',
            }}>
              <SparklesIcon size={18} />
            </div>

            {/* Label */}
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              Pro Components
            </span>

            {/* Already added indicator */}
            {useKnowledgeBase && (
              <span style={{
                marginLeft: 'auto',
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                Added
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: useKnowledgeBase ? theme.spacing.sm : 0,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
      }}>
        {/* Chips Row - Shows when Pro Components is enabled */}
        {useKnowledgeBase && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            paddingLeft: '48px', // Align with input text (after + button)
          }}>
            {/* Pro Components Chip */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px 4px 10px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: theme.radius.full,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                color: '#a855f7',
                fontFamily: theme.typography.fontFamily.sans,
              }}
            >
              <SparklesIcon size={12} />
              <span>Pro Components</span>
              <button
                onClick={handleRemoveProComponents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  padding: 0,
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#a855f7',
                  transition: `all ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                }}
              >
                <XSmallIcon size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Input Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          {/* Plus Button (Dropdown Trigger) */}
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: showDropdown ? theme.colors.bg.tertiary : 'transparent',
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: 'pointer',
              color: showDropdown ? theme.colors.text.primary : theme.colors.text.tertiary,
              transition: `all ${theme.animation.fast}`,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!showDropdown) {
                e.currentTarget.style.background = theme.colors.bg.tertiary;
                e.currentTarget.style.color = theme.colors.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!showDropdown) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.colors.text.tertiary;
              }
            }}
          >
            <PlusIcon size={20} />
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
              background: message.trim() ? theme.colors.accent.primary : theme.colors.bg.tertiary,
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: message.trim() ? 'pointer' : 'not-allowed',
              color: message.trim() ? '#ffffff' : theme.colors.text.tertiary,
              transition: `all ${theme.animation.fast}`,
              opacity: message.trim() ? 1 : 0.5,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (message.trim()) {
                e.currentTarget.style.background = theme.colors.accent.warning;
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim()) {
                e.currentTarget.style.background = theme.colors.accent.primary;
              }
            }}
          >
            <ArrowUpIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

EnhancedChatInput.propTypes = {
  placeholder: PropTypes.string,
  onFocus: PropTypes.func,
  onSend: PropTypes.func.isRequired,
  initialMessage: PropTypes.string,
  useKnowledgeBase: PropTypes.bool,
  onToggleKnowledgeBase: PropTypes.func
};
