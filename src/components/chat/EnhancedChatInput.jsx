import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { ArrowUpIcon, PlusIcon } from '../icons/icons';
import { COLORS, LAYOUT } from '../../constants';
import { MODEL_TIERS } from '../../services/config/modelConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';

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
  placeholder = "Let's make something",
  onFocus,
  onSend,
  initialMessage = '',
  modelTier = 'lite',
  onChangeModelTier,
  activeArtifact = null,
  isEditingArtifact = false
}) => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { openAuthModal } = useSettings();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();
  const [message, setMessage] = useState(initialMessage);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
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
    if (!user) {
      openAuthModal();
      return;
    }
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

  return (
    <div style={{
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
          marginLeft: `-${theme.spacing.sm}`,
          marginRight: `-${theme.spacing.sm}`,
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
                {Object.entries(MODEL_TIERS).map(([key, tier]) => {
                  const needsAuth = !user;
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
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        cursor: 'pointer',
                        background: modelTier === key && !needsAuth
                          ? (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                          : 'transparent',
                        transition: `background ${theme.animation.fast}`,
                        opacity: needsAuth ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (modelTier !== key || needsAuth) {
                          e.currentTarget.style.background = mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (modelTier !== key || needsAuth) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text.primary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}>
                          {tier.name}
                          {needsAuth && <LockIcon size={12} color={theme.colors.text.tertiary} />}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.text.tertiary,
                        }}>
                          {needsAuth ? 'Sign in required' : tier.description}
                        </div>
                      </div>
                      {modelTier === key && !needsAuth && (
                        <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
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
  isEditingArtifact: PropTypes.bool
};
