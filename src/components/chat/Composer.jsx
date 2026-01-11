import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { ArrowUpIcon } from '../icons/icons';
import { COLORS, LAYOUT } from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';
import { AppsModal } from './AppsModal';

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

// Plus icon for image upload
const PlusIcon = ({ size = 18, color = "currentColor" }) => (
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

// Close/X icon for removing images
const CloseIcon = ({ size = 14, color = "currentColor" }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Apps/Grid icon
const AppsIcon = ({ size = 18, color = "currentColor" }) => (
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
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const Composer = ({
  placeholder = "Message...",
  onFocus,
  onSend,
  initialMessage = '',
  activeArtifact = null,
  isEditingArtifact = false,
  disabled = false,
  centered = false, // When true, use relative positioning (for centered layout)
  isMobile: isMobileProp, // Optional prop, falls back to hook
  // New props for apps dropdown
  apps = [],
  onStartDebug,
  onStartEdit,
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp ?? isMobileHook;
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();
  const [message, setMessage] = useState(initialMessage);
  const [showAppsPopover, setShowAppsPopover] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]); // Array of {file, preview, base64}
  const appsPopoverRef = useRef(null);
  const appsButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  // Limit apps to 4 most recent, show "Show All" if more
  const recentApps = useMemo(() => apps.slice(0, 4), [apps]);
  const hasMoreApps = apps.length > 4;

  // Bug #15 fix: Update message when initialMessage prop changes (including to empty)
  useEffect(() => {
    setMessage(initialMessage || '');
  }, [initialMessage]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Apps popover
      if (
        appsPopoverRef.current &&
        !appsPopoverRef.current.contains(event.target) &&
        appsButtonRef.current &&
        !appsButtonRef.current.contains(event.target)
      ) {
        setShowAppsPopover(false);
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
    const hasContent = message.trim() || selectedImages.length > 0;
    if (hasContent && onSend) {
      // Pass both text and images
      const images = selectedImages.map(img => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));
      onSend(message, images.length > 0 ? images : null);
      setMessage('');
      // Clear images and revoke URLs
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // Convert each image to base64 and create preview URL
    const newImages = await Promise.all(
      imageFiles.map(async (file) => {
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        return {
          file,
          preview,
          base64,
          mimeType: file.type,
        };
      })
    );

    setSelectedImages(prev => [...prev, ...newImages]);
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/xxx;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Remove an image from selection
  const handleRemoveImage = (index) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // Editing Indicator - shared component for desktop and mobile
  const EditingIndicator = () => {
    if (!isEditingArtifact || !activeArtifact) return null;

    const isDebugMode = activeArtifact.mode === 'debug';
    const label = isDebugMode ? 'Debugging' : 'Editing';
    const indicatorColor = isDebugMode ? '#8b5cf6' : COLORS.PRO_COMPONENTS_BLUE;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        fontSize: isMobile ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        color: indicatorColor,
        ...(isMobile && { marginTop: `-${theme.spacing.xs}` }),
      }}>
        <span>{label}</span>
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

        {/* Image Preview Row - show when images selected */}
        {selectedImages.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            paddingBottom: theme.spacing.sm,
          }}>
            {selectedImages.map((img, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <img
                  src={img.preview}
                  alt={`Selected ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <CloseIcon size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Controls Row - BOTTOM */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? theme.spacing.xs : theme.spacing.sm,
        }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {/* Plus button for image upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: colors.buttonBg,
              border: `1px solid ${mode === 'dark' ? '#333' : '#ddd'}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: theme.colors.text.secondary,
              borderRadius: '50%',
              transition: `all ${theme.animation.fast}`,
              flexShrink: 0,
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) e.currentTarget.style.background = colors.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.buttonBg;
            }}
            title="Add image"
          >
            <PlusIcon size={18} color={theme.colors.text.secondary} />
          </button>

          {/* Apps Button - only show if there are apps */}
          {apps.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                ref={appsButtonRef}
                type="button"
                onClick={() => setShowAppsPopover(!showAppsPopover)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  background: showAppsPopover ? colors.hoverBg : colors.buttonBg,
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.text.secondary,
                  borderRadius: '12px',
                  transition: `all ${theme.animation.fast}`,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!showAppsPopover) {
                    e.currentTarget.style.background = colors.buttonBg;
                  }
                }}
                title="Your Apps"
              >
                <AppsIcon size={18} color={theme.colors.text.secondary} />
              </button>

              {/* Apps Popover */}
              {showAppsPopover && (
                <div
                  ref={appsPopoverRef}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '8px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '12px',
                    minWidth: '280px',
                    maxWidth: '320px',
                    overflow: 'hidden',
                    zIndex: 100,
                    boxShadow: mode === 'dark'
                      ? '0 8px 32px rgba(0,0,0,0.4)'
                      : '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: theme.colors.text.secondary,
                    fontFamily: theme.typography.fontFamily.sans,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Your Apps
                  </div>

                  {/* Apps List */}
                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}>
                    {recentApps.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          borderBottom: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        {/* App Name */}
                        <div style={{
                          flex: 1,
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.colors.text.primary,
                          fontFamily: theme.typography.fontFamily.sans,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginRight: '12px',
                        }}>
                          {app.title}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            setShowAppsPopover(false);
                            onStartEdit && onStartEdit(app);
                          }}
                          style={{
                            padding: '4px 10px',
                            background: mode === 'dark' ? '#374151' : '#e5e7eb',
                            border: 'none',
                            borderRadius: '6px',
                            color: theme.colors.text.primary,
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: theme.typography.fontFamily.sans,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Show All Button */}
                  {hasMoreApps && (
                    <button
                      onClick={() => {
                        setShowAppsPopover(false);
                        setShowAppsModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderTop: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text.secondary,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: theme.typography.fontFamily.sans,
                        textAlign: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = mode === 'dark' ? '#1a1a1a' : '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Show All ({apps.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editing Indicator (desktop - inline) */}
          {!isMobile && <EditingIndicator />}

          {/* Flex spacer */}
          <div style={{ flex: 1 }} />

          {/* Send Button */}
          {(() => {
            const hasContent = message.trim() || selectedImages.length > 0;
            const canSend = hasContent && !disabled;
            return (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '36px' : '42px',
                  height: isMobile ? '36px' : '42px',
                  background: canSend ? '#C97D63' : theme.colors.bg.tertiary,
                  border: 'none',
                  borderRadius: theme.radius.full,
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  color: canSend ? '#ffffff' : theme.colors.text.tertiary,
                  transition: `all ${theme.animation.fast}`,
                  opacity: canSend ? 1 : 0.5,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (canSend) {
                    e.currentTarget.style.background = '#d89077';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSend) {
                    e.currentTarget.style.background = '#C97D63';
                  }
                }}
              >
                <ArrowUpIcon size={isMobile ? 20 : 24} />
              </button>
            );
          })()}
        </div>

        {/* Editing Indicator (mobile - separate row) */}
        {isMobile && <EditingIndicator />}
      </div>

      {/* Apps Modal */}
      <AppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        apps={apps}
        onStartEdit={onStartEdit}
      />
    </div>
  );
};

Composer.propTypes = {
  placeholder: PropTypes.string,
  onFocus: PropTypes.func,
  onSend: PropTypes.func.isRequired,
  initialMessage: PropTypes.string,
  activeArtifact: PropTypes.object,
  isEditingArtifact: PropTypes.bool,
  disabled: PropTypes.bool,
  centered: PropTypes.bool,
  isMobile: PropTypes.bool,
  apps: PropTypes.array,
  onStartDebug: PropTypes.func,
  onStartEdit: PropTypes.func,
};
