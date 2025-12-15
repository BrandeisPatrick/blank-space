import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { Z_INDEX } from '../../constants';
import { COLOR_PALETTES } from '../../services/stylePresets/colorPalettes';
import { UI_STYLES } from '../../services/stylePresets/uiStyles';

const TABS = [
  { id: 'theme', label: 'Theme' },
  { id: 'ai', label: 'AI Preference' },
  { id: 'us', label: 'Us' },
];

// Close icon component
const CloseIcon = ({ size = 24, color = '#6B7280' }) => (
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

// Palette icon for "Match Wallpaper" option
const PaletteIcon = ({ size = 20, color = '#6B7280' }) => (
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
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="2" fill={color} />
    <circle cx="8" cy="14" r="2" fill={color} />
    <circle cx="16" cy="14" r="2" fill={color} />
  </svg>
);

// Social icons
const LinkedInIcon = ({ size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = ({ size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const SettingsPanel = () => {
  const { mode, theme: selectedTheme, setTheme, themePresets } = useTheme();
  const { isSettingsOpen, closeSettings, aiColorPalette, setAIColorPalette, aiUIStyle, setAIUIStyle } = useSettings();
  const theme = getTheme(mode);
  const [activeTab, setActiveTab] = useState('theme');

  if (!isSettingsOpen) return null;

  const presetEntries = Object.entries(themePresets);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSettings}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '85vh',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.75)'
            : 'rgba(255, 255, 255, 0.75)',
          borderRadius: theme.radius['2xl'],
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
          zIndex: Z_INDEX.MODALS,
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.lg,
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.text.primary,
          }}>
            Settings
          </h2>
          <button
            onClick={closeSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: 'pointer',
              transition: `background ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CloseIcon size={20} color={theme.colors.text.secondary} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          padding: `0 ${theme.spacing.md}`,
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? '#3B82F6' : theme.colors.text.secondary,
                  fontWeight: isActive
                    ? theme.typography.fontWeight.semibold
                    : theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamily.sans,
                  transition: `all ${theme.animation.fast}`,
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = theme.colors.text.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: theme.spacing.lg, overflowY: 'auto', flex: 1 }}>
          {/* Theme Tab */}
          {activeTab === 'theme' && (
          <div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: theme.spacing.md,
            }}>
              {presetEntries.map(([key, preset]) => {
                const isSelected = selectedTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      padding: theme.spacing.sm,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: theme.radius.lg,
                      cursor: 'pointer',
                      transition: `all ${theme.animation.fast}`,
                    }}
                  >
                    {/* Wallpaper preview */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      borderRadius: theme.radius.md,
                      background: preset.gradient || preset.backgroundColor,
                      border: isSelected
                        ? '2px solid #3B82F6'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: `all ${theme.animation.fast}`,
                      boxShadow: isSelected
                        ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                        : 'none',
                    }}>
                      {preset.variant === 'stars' ? (
                        /* Star preview */
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          viewBox="0 0 100 70"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          {/* 4-point stars - use theme's starColors */}
                          <path d="M20,15 L21,18 L24,18 L21.5,20 L22.5,23 L20,21 L17.5,23 L18.5,20 L16,18 L19,18 Z" fill={preset.starColors?.[0] || '#4ADE80'} />
                          <path d="M75,45 L76,48 L79,48 L76.5,50 L77.5,53 L75,51 L72.5,53 L73.5,50 L71,48 L74,48 Z" fill={preset.starColors?.[2] || '#60A5FA'} />
                          <path d="M50,25 L51.5,29 L56,29 L52.5,32 L54,36 L50,33 L46,36 L47.5,32 L44,29 L48.5,29 Z" fill={preset.starColors?.[3] || '#F9A8D4'} />
                          {/* Small dots */}
                          <circle cx="85" cy="12" r="2" fill={preset.starColors?.[4] || '#A78BFA'} />
                          <circle cx="15" cy="55" r="2" fill={preset.starColors?.[5] || '#FCD34D'} />
                          <circle cx="60" cy="58" r="2" fill={preset.starColors?.[1] || '#67E8F9'} />
                          {/* Tiny sparkle */}
                          <path d="M35,45 L35.5,47 L37.5,47 L36,48.5 L36.5,50.5 L35,49 L33.5,50.5 L34,48.5 L32.5,47 L34.5,47 Z" fill={preset.starColors?.[3] || '#FBBF24'} />
                        </svg>
                      ) : (
                        /* Wave preview */
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          viewBox="0 0 100 70"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          <path
                            d="M-10,60 Q20,45 40,55 T80,45 T120,50"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[0]})`}
                            strokeWidth="8"
                          />
                          <path
                            d="M-10,45 Q25,30 50,40 T90,30 T120,35"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[1]})`}
                            strokeWidth="8"
                          />
                          <path
                            d="M-10,30 Q30,15 55,25 T95,15 T120,20"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[2]})`}
                            strokeWidth="8"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Name only */}
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                      fontFamily: theme.typography.fontFamily.sans,
                      color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                    }}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* AI Preference Tab */}
          {activeTab === 'ai' && (
          <div>
            <h3 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              AI Generation Style
            </h3>

            {/* Color Palette */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                Color Palette
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: theme.spacing.sm,
              }}>
                {Object.entries(COLOR_PALETTES).map(([key, palette]) => {
                  const isSelected = aiColorPalette === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAIColorPalette(key)}
                      style={{
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.lg,
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.1)',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        transition: `all ${theme.animation.fast}`,
                        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                      }}
                    >
                      {/* Color preview */}
                      {palette.preview ? (
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {palette.preview.map((color, i) => (
                            <div key={i} style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: color,
                              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                            }} />
                          ))}
                        </div>
                      ) : (
                        <PaletteIcon size={18} color={isSelected ? '#3B82F6' : theme.colors.text.secondary} />
                      )}
                      <span style={{
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                        color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                        whiteSpace: 'nowrap',
                      }}>
                        {palette.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UI Style */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                UI Style
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: theme.spacing.sm,
              }}>
                {Object.entries(UI_STYLES).map(([key, style]) => {
                  const isSelected = aiUIStyle === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAIUIStyle(key)}
                      style={{
                        padding: theme.spacing.md,
                        borderRadius: theme.radius.lg,
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.1)',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `all ${theme.animation.fast}`,
                        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                      }}
                    >
                      <div style={{
                        fontWeight: theme.typography.fontWeight.medium,
                        color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: '2px',
                      }}>
                        {style.name}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.tertiary,
                        lineHeight: 1.3,
                      }}>
                        {style.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* Us Tab */}
          {activeTab === 'us' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
          }}>
            <div style={{
              textAlign: 'center',
            }}>
              <h3 style={{
                margin: `0 0 ${theme.spacing.sm} 0`,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: theme.typography.fontFamily.sans,
                color: theme.colors.text.primary,
              }}>
                Blank Space
              </h3>
              <p style={{
                margin: 0,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.sans,
              }}>
                Open source AI app builder
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: theme.spacing.xl,
            }}>
              <a
                href="https://www.linkedin.com/in/patrick-pinyuan-li/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  textDecoration: 'none',
                  color: theme.colors.text.secondary,
                  transition: `color ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0A66C2'}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
              >
                <LinkedInIcon size={28} color="currentColor" />
                <span style={{ fontSize: theme.typography.fontSize.xs }}>LinkedIn</span>
              </a>

              <a
                href="https://x.com/BrandeisPatrick"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  textDecoration: 'none',
                  color: theme.colors.text.secondary,
                  transition: `color ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
              >
                <XIcon size={28} color="currentColor" />
                <span style={{ fontSize: theme.typography.fontSize.xs }}>X</span>
              </a>

              <a
                href="https://www.instagram.com/blankspace_build/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  textDecoration: 'none',
                  color: theme.colors.text.secondary,
                  transition: `color ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E4405F'}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
              >
                <InstagramIcon size={28} color="currentColor" />
                <span style={{ fontSize: theme.typography.fontSize.xs }}>Instagram</span>
              </a>
            </div>
          </div>
          )}
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default SettingsPanel;
