import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { ArrowUpIcon } from '../icons/icons';
import { COLORS, LAYOUT } from '../../constants';
import { MODEL_TIERS } from '../../services/config/modelConfig';

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

// Sparkles icon for Knowledge Base
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
  onToggleKnowledgeBase,
  modelTier = 'lite',
  onChangeModelTier,
  activeArtifact = null,
  isEditingArtifact = false
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [message, setMessage] = useState(initialMessage);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isProComponentsHovered, setIsProComponentsHovered] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const modelButtonRef = useRef(null);

  // Update message when initialMessage prop changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Close dropdowns when clicking outside
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
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target) &&
        modelButtonRef.current &&
        !modelButtonRef.current.contains(event.target)
      ) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
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

  // Blue color for Knowledge Base text
  const proComponentsColor = COLORS.PRO_COMPONENTS_BLUE;

  return (
    <div style={{
      position: 'fixed',
      bottom: theme.spacing.xl,
      left: '50%',
      transform: 'translateX(-50%)',
      width: LAYOUT.CHAT_INPUT_WIDTH,
      maxWidth: LAYOUT.CHAT_INPUT_MAX_WIDTH,
      zIndex: LAYOUT.CHAT_INPUT_Z_INDEX,
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
            ...createGlassEffect(theme),
            background: mode === 'dark'
              ? 'rgba(30, 30, 35, 0.6)'
              : 'rgba(255, 255, 255, 0.65)',
            borderRadius: theme.radius.xl,
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
              : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.03)',
            minWidth: '200px',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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

          {/* Knowledge Base Option */}
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
              Knowledge Base
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
        gap: theme.spacing.md,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        ...createGlassEffect(theme),
        background: mode === 'dark'
          ? 'rgba(30, 30, 35, 0.6)'
          : 'rgba(255, 255, 255, 0.65)',
        borderRadius: LAYOUT.CHAT_INPUT_BORDER_RADIUS,
        boxShadow: mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.03)',
      }}>
        {/* Input Row - TOP */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.lg,
            fontFamily: theme.typography.fontFamily.sans,
            padding: `${theme.spacing.sm} 0`,
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
              width: '42px',
              height: '42px',
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
            <PlusIcon size={24} />
          </button>

          {/* Model Tier Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              ref={modelButtonRef}
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                ...createGlassEffect(theme),
                background: mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.5)',
                boxShadow: mode === 'dark'
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.03)',
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                borderRadius: theme.radius.full,
                transition: `all ${theme.animation.fast}`,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.7)';
              }}
              onMouseLeave={(e) => {
                if (!showModelDropdown) {
                  e.currentTarget.style.background = mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.5)';
                }
              }}
            >
              <span>{MODEL_TIERS[modelTier]?.name || 'Regular'}</span>
              <ChevronDownIcon size={14} color={theme.colors.text.secondary} />
            </button>

            {/* Model Dropdown Menu */}
            {showModelDropdown && (
              <div
                ref={modelDropdownRef}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: theme.spacing.sm,
                  ...createGlassEffect(theme),
                  background: mode === 'dark'
                    ? 'rgba(30, 30, 35, 0.6)'
                    : 'rgba(255, 255, 255, 0.65)',
                  borderRadius: theme.radius.xl,
                  boxShadow: mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.03)',
                  minWidth: '140px',
                  overflow: 'hidden',
                  animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 100,
                }}
              >
                {Object.entries(MODEL_TIERS).map(([key, tier]) => (
                  <div
                    key={key}
                    onClick={() => {
                      onChangeModelTier && onChangeModelTier(key);
                      setShowModelDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      cursor: 'pointer',
                      background: modelTier === key
                        ? (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                        : 'transparent',
                      transition: `background ${theme.animation.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      if (modelTier !== key) {
                        e.currentTarget.style.background = mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (modelTier !== key) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.primary,
                      }}>
                        {tier.name}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.tertiary,
                      }}>
                        {tier.description}
                      </div>
                    </div>
                    {modelTier === key && (
                      <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge Base - icon transforms to X on hover */}
          {useKnowledgeBase && (
            <button
              type="button"
              onClick={() => {
                if (isProComponentsHovered) {
                  // Hovered = showing X, so disable
                  onToggleKnowledgeBase && onToggleKnowledgeBase();
                } else {
                  // Not hovered, open dropdown
                  toggleDropdown();
                }
              }}
              onMouseEnter={() => setIsProComponentsHovered(true)}
              onMouseLeave={() => setIsProComponentsHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                background: isProComponentsHovered ? theme.colors.bg.tertiary : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: proComponentsColor,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.radius.full,
                transition: `all ${theme.animation.fast}`,
              }}
            >
              {isProComponentsHovered ? (
                <span style={{ fontSize: '18px', lineHeight: 1 }}>×</span>
              ) : (
                <SparklesIcon size={18} color={proComponentsColor} />
              )}
              <span>Knowledge Base</span>
              <ChevronDownIcon size={18} color={proComponentsColor} />
            </button>
          )}

          {/* Editing Indicator - Shows when artifact is open */}
          {isEditingArtifact && activeArtifact && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            }}>
              <span style={{
                color: theme.colors.text.tertiary,
              }}>
                Editing
              </span>
              <span style={{
                color: '#3B82F6',
              }}>
                {activeArtifact.name}
              </span>
            </div>
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
              width: '42px',
              height: '42px',
              background: message.trim() ? '#C97D63' : theme.colors.bg.tertiary,
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
                e.currentTarget.style.background = '#d89077';
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim()) {
                e.currentTarget.style.background = '#C97D63';
              }
            }}
          >
            <ArrowUpIcon size={24} />
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
  onToggleKnowledgeBase: PropTypes.func,
  modelTier: PropTypes.oneOf(['lite', 'pro']),
  onChangeModelTier: PropTypes.func,
  activeArtifact: PropTypes.object,
  isEditingArtifact: PropTypes.bool
};
