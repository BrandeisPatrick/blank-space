import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { ArrowUpIcon } from '../icons/icons';
import { COLORS, LAYOUT } from '../../constants';
import { MODEL_TIERS } from '../../services/config/modelConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';

// Grok-style colors - filled chat bar
const GROK_INPUT_COLORS = {
  dark: {
    inputBg: '#1a1a1a',
    inputBorder: '#1a1a1a',
    dropdownBg: '#1a1a1a',
    hoverBg: '#2a2a2a',
    buttonBg: 'transparent',
    buttonBorder: '#333333',
  },
  light: {
    inputBg: '#f5f5f5',
    inputBorder: '#f5f5f5',
    dropdownBg: '#ffffff',
    hoverBg: '#e8e8e8',
    buttonBg: '#f5f5f5',
    buttonBorder: '#e0e0e0',
  },
};

// Chevron down icon for dropdown
const ChevronDownIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Lock icon for auth-required features
const LockIcon = ({ size = 14, color = "currentColor" }) => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const EnhancedChatInput = ({
  placeholder = "Message...",
  onFocus,
  onSend,
  initialMessage = '',
  modelTier = 'lite',
  onChangeModelTier,
  activeArtifact = null,
  isEditingArtifact = false,
  disabled = false,
  centered = false, // When true, use relative positioning (for centered layout)
  isMobile: isMobileProp, // Optional prop, falls back to hook
}) => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { openAuthModal } = useSettings();
  const theme = getTheme(mode);
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp ?? isMobileHook;
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();
  const [message, setMessage] = useState(initialMessage);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef(null);
  const modelButtonRef = useRef(null);

  // Bug #15 fix: Update message when initialMessage prop changes (including to empty)
  useEffect(() => {
    setMessage(initialMessage || '');
  }, [initialMessage]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Editing Indicator - shared component for desktop and mobile
  const EditingIndicator = () => {
    if (!isEditingArtifact || !activeArtifact) return null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        fontSize: isMobile ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        color: COLORS.PRO_COMPONENTS_BLUE,
        ...(isMobile && { marginTop: `-${theme.spacing.xs}` }),
      }}>
        <span>Editing</span>
        <span style={isMobile ? {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        } : undefined}>{activeArtifact.name}</span>
      </div>
    );
  };

  // Get Grok-style colors based on mode
  const colors = mode === 'dark' ? GROK_INPUT_COLORS.dark : GROK_INPUT_COLORS.light;

  // Container styles based on centered prop
  const containerStyle = centered
    ? {
        // Centered/inline positioning
        position: 'relative',
        width: '100%',
        maxWidth: LAYOUT.CHAT_INPUT_MAX_WIDTH,
      }
    : {
        // Fixed bottom positioning
        position: 'fixed',
        bottom: isMobile && isKeyboardVisible
          ? `${keyboardHeight + 10}px`
          : theme.spacing.xl,
        left: '50%',
        transform: 'translateX(-50%)',
        width: LAYOUT.CHAT_INPUT_WIDTH,
        maxWidth: LAYOUT.CHAT_INPUT_MAX_WIDTH,
        zIndex: LAYOUT.CHAT_INPUT_Z_INDEX,
        transition: isMobile ? 'bottom 0.15s ease-out' : 'none',
      };

  return (
    <div style={containerStyle}>
      {/* Main Input Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? theme.spacing.sm : theme.spacing.md,
        padding: isMobile
          ? `${theme.spacing.md} ${theme.spacing.md}`
          : `${theme.spacing.lg} ${theme.spacing.xl}`,
        background: colors.inputBg,
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: isMobile ? '28px' : LAYOUT.CHAT_INPUT_BORDER_RADIUS,
      }}>
        {/* Input Row - TOP */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Generating...' : placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.colors.text.primary,
            fontSize: isMobile ? theme.typography.fontSize.base : theme.typography.fontSize.lg,
            fontFamily: theme.typography.fontFamily.sans,
            padding: isMobile ? `${theme.spacing.xs} 0` : `${theme.spacing.sm} 0`,
            opacity: disabled ? 0.6 : 1,
          }}
        />

        {/* Controls Row - BOTTOM */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? theme.spacing.xs : theme.spacing.sm,
        }}>
          {/* Model Tier Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              ref={modelButtonRef}
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                background: colors.buttonBg,
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.bold,
                fontFamily: theme.typography.fontFamily.sans,
                padding: `6px 14px`,
                borderRadius: '12px',
                transition: `all ${theme.animation.fast}`,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!showModelDropdown) {
                  e.currentTarget.style.background = colors.buttonBg;
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
                  marginBottom: '8px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  minWidth: '160px',
                  overflow: 'hidden',
                  zIndex: 100,
                  padding: '6px',
                }}
              >
                {Object.entries(MODEL_TIERS).map(([key, tier]) => {
                  const needsAuth = !user && key === 'pro';
                  const isSelected = modelTier === key && !needsAuth;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        if (needsAuth) {
                          setShowModelDropdown(false);
                          openAuthModal();
                        } else {
                          onChangeModelTier && onChangeModelTier(key);
                          setShowModelDropdown(false);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: isSelected
                          ? (mode === 'dark' ? '#2a2a2a' : '#f0f0f0')
                          : 'transparent',
                        borderRadius: '8px',
                        transition: 'background 0.15s ease',
                        opacity: needsAuth ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = mode === 'dark' ? '#2a2a2a' : '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.colors.text.primary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: theme.typography.fontFamily.sans,
                        }}>
                          {tier.name}
                          {needsAuth && <LockIcon size={12} color={theme.colors.text.tertiary} />}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          marginTop: '2px',
                          fontFamily: theme.typography.fontFamily.sans,
                        }}>
                          {needsAuth ? 'Sign in required' : tier.description}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 500 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Editing Indicator (desktop - inline) */}
          {!isMobile && <EditingIndicator />}

          {/* Flex spacer */}
          <div style={{ flex: 1 }} />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? '36px' : '42px',
              height: isMobile ? '36px' : '42px',
              background: message.trim() && !disabled ? '#C97D63' : theme.colors.bg.tertiary,
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed',
              color: message.trim() && !disabled ? '#ffffff' : theme.colors.text.tertiary,
              transition: `all ${theme.animation.fast}`,
              opacity: message.trim() && !disabled ? 1 : 0.5,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (message.trim() && !disabled) {
                e.currentTarget.style.background = '#d89077';
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim() && !disabled) {
                e.currentTarget.style.background = '#C97D63';
              }
            }}
          >
            <ArrowUpIcon size={isMobile ? 20 : 24} />
          </button>
        </div>

        {/* Editing Indicator (mobile - separate row) */}
        {isMobile && <EditingIndicator />}
      </div>
    </div>
  );
};

EnhancedChatInput.propTypes = {
  placeholder: PropTypes.string,
  onFocus: PropTypes.func,
  onSend: PropTypes.func.isRequired,
  initialMessage: PropTypes.string,
  modelTier: PropTypes.oneOf(['lite', 'pro']),
  onChangeModelTier: PropTypes.func,
  activeArtifact: PropTypes.object,
  isEditingArtifact: PropTypes.bool,
  disabled: PropTypes.bool,
  centered: PropTypes.bool,
  isMobile: PropTypes.bool,
};
