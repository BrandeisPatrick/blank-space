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

// Chevron down icon for dropdown
const ChevronDownIcon = ({ size = 16, color = "currentColor" }) => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Sparkles icon for Pro Components
const SparklesIcon = ({ size = 16, color = "currentColor" }) => (
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
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
    <path d="M19 15L20 18L23 19L20 20L19 23L18 20L15 19L18 18L19 15Z" />
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
    if (onToggleKnowledgeBase) {
      onToggleKnowledgeBase();
    }
    setShowDropdown(false);
  };

  // Blue color for Pro Components text
  const proComponentsColor = '#3b82f6';

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
              cursor: 'pointer',
              transition: `background ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.tertiary;
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
              color: proComponentsColor,
            }}>
              <SparklesIcon size={18} color={proComponentsColor} />
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

            {/* Checkmark when enabled */}
            {useKnowledgeBase && (
              <span style={{
                marginLeft: 'auto',
                fontSize: theme.typography.fontSize.sm,
                color: proComponentsColor,
              }}>
                ✓
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
      }}>
        {/* Input Row - TOP */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.sans,
            padding: `${theme.spacing.xs} 0`,
          }}
        />

        {/* Controls Row - BOTTOM */}
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
              width: '32px',
              height: '32px',
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
            <PlusIcon size={18} />
          </button>

          {/* Pro Components Text + Chevron */}
          {useKnowledgeBase && (
            <button
              type="button"
              onClick={toggleDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: proComponentsColor,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.radius.md,
                transition: `background ${theme.animation.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <SparklesIcon size={14} color={proComponentsColor} />
              <span>Pro Components</span>
              <ChevronDownIcon size={14} color={proComponentsColor} />
            </button>
          )}

          {/* Flex spacer */}
          <div style={{ flex: 1 }} />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
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
                e.currentTarget.style.background = theme.colorVariants?.accent?.primaryHover || theme.colors.accent.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim()) {
                e.currentTarget.style.background = theme.colors.accent.primary;
              }
            }}
          >
            <ArrowUpIcon size={18} />
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
