import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../contexts/AppStoreContext';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { ARTIFACT_METADATA, loadArtifactById } from '../../data/artifactMetadata';
import { getIconById, getIconColorById } from '../artifact/IconPicker';
import { PreviewPanel } from '../preview/PreviewPanel';
import { Z_INDEX } from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';

// Category icons
const TodayIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GamesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3L20 12L6 21V3Z" fill={color} stroke="none" />
  </svg>
);

const AppsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TemplatesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const PrototypeIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// Back arrow icon
const ChevronLeftIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Star icon for ratings
const StarIcon = ({ size = 12, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// User icon for developer
const UserIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CATEGORIES = [
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'games', label: 'Games', icon: GamesIcon },
  { id: 'apps', label: 'Apps', icon: AppsIcon },
  { id: 'templates', label: 'Templates', icon: TemplatesIcon },
  { id: 'prototype', label: 'Prototype', icon: PrototypeIcon },
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

// Get category label for display
const getCategoryLabel = (category) => {
  const labels = {
    'games': 'Games',
    'apps': 'Productivity',
    'demos': 'Demo',
    'templates': 'Templates',
    'prototype': 'Prototype',
  };
  return labels[category] || 'App';
};

// App Detail View Component
const AppDetailView = ({ app, loadedArtifact, isLoading, onBack, onInstall, theme, mode }) => {
  const IconComponent = getIconById(app.icon);
  const iconColor = getIconColorById(app.icon);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with Back Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.08)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: theme.colors.accent.ios,
            fontSize: '17px',
            fontWeight: 400,
            fontFamily: theme.typography.fontFamily.sans,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <ChevronLeftIcon size={22} color={theme.colors.accent.ios} />
          <span>Back</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* App Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '20px',
        }}>
          {/* Large App Icon */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '22px',
            background: `linear-gradient(135deg, ${iconColor}30 0%, ${iconColor}50 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            <IconComponent size={52} color={iconColor} />
          </div>

          {/* App Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              margin: '0 0 4px 0',
              fontSize: '22px',
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
            }}>
              {app.name}
            </h1>
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '15px',
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
            }}>
              {getCategoryLabel(app.category)}
            </p>

            {/* GET Button */}
            <button
              onClick={() => onInstall(app)}
              disabled={isLoading}
              style={{
                padding: '8px 24px',
                background: isLoading ? theme.colors.text.tertiary : theme.colors.accent.ios,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: theme.typography.fontFamily.sans,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = theme.colors.accent.iosHover;
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = theme.colors.accent.ios;
              }}
            >
              {isLoading ? 'Loading...' : 'GET'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          padding: '12px 0',
          marginBottom: '20px',
        }}>
          {/* Rating */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px',
            }}>
              DEMO
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: theme.colors.text.secondary,
            }}>
              <span style={{ fontSize: '18px', fontWeight: 600 }}>5.0</span>
              <StarIcon size={14} />
            </div>
          </div>

          {/* Tech */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px',
            }}>
              TECH
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.secondary,
            }}>
              React
            </div>
          </div>

          {/* Type */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px',
            }}>
              CHART
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.secondary,
            }}>
              #1
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
            }}>
              Demo
            </div>
          </div>

          {/* Developer */}
          <div style={{
            flex: 1,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px',
            }}>
              DEVELOPER
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: theme.colors.text.secondary,
            }}>
              <UserIcon size={16} color={theme.colors.text.tertiary} />
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.tertiary,
              marginTop: '2px',
            }}>
              Blank Space
            </div>
          </div>
        </div>

        {/* Preview Screenshot */}
        <div style={{
          marginBottom: '20px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
          height: '280px',
          pointerEvents: 'none',
          position: 'relative',
        }}>
          {loadedArtifact?.files ? (
            <PreviewPanel
              files={loadedArtifact.files}
              zoom={65}
              hideHeader={true}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.text.tertiary,
              fontSize: '14px',
            }}>
              {isLoading ? 'Loading preview...' : 'Preview unavailable'}
            </div>
          )}
          {/* Overlay to block interaction */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }} />
        </div>

        {/* Description */}
        <div style={{
          padding: '16px 0',
          borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          marginBottom: '16px',
        }}>
          <p style={{
            margin: 0,
            fontSize: '15px',
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.text.secondary,
            lineHeight: 1.5,
          }}>
            {app.description}
          </p>
        </div>

      </div>
    </div>
  );
};

export const AppStorePanel = () => {
  const { mode } = useTheme();
  const { isAppStoreOpen, closeAppStore } = useAppStore();
  const { createArtifact } = useArtifacts();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState('today');
  const [selectedApp, setSelectedApp] = useState(null);
  const [loadedArtifact, setLoadedArtifact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAppStoreOpen) return null;

  // Load full artifact when user clicks to view details
  const handleSelectApp = async (appMetadata) => {
    setIsLoading(true);
    setSelectedApp(appMetadata); // Show detail view immediately with metadata
    try {
      const fullArtifact = await loadArtifactById(appMetadata.id);
      setLoadedArtifact(fullArtifact);
    } catch (error) {
      console.error('Failed to load artifact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedApp(null);
    setLoadedArtifact(null);
  };

  const handleInstall = async (appMetadata) => {
    // Use already loaded artifact if available, otherwise lazy load
    setIsLoading(true);
    try {
      const fullArtifact = loadedArtifact || await loadArtifactById(appMetadata.id);
      createArtifact(fullArtifact.name, fullArtifact.files, [], fullArtifact.icon);
      closeAppStore();
    } catch (error) {
      console.error('Failed to load artifact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter apps based on selected category (uses lightweight metadata)
  const filteredApps = selectedCategory === 'today'
    ? ARTIFACT_METADATA.slice(0, 3)  // Show only 3 featured apps in Today
    : selectedCategory === 'templates'
    ? ARTIFACT_METADATA.filter(app => app.category === 'demos' || app.category === 'templates')
    : selectedCategory === 'prototype'
    ? ARTIFACT_METADATA.filter(app => app.category === 'prototype')
    : ARTIFACT_METADATA.filter(app => app.category === selectedCategory);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          if (selectedApp) {
            setSelectedApp(null);
          } else {
            closeAppStore();
          }
        }}
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
          width: isMobile ? '100%' : '95%',
          maxWidth: isMobile ? '100%' : '900px',
          maxHeight: '85vh',
          minHeight: '400px',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.75)'
            : 'rgba(255, 255, 255, 0.35)',
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
        {selectedApp ? (
          <AppDetailView
            app={selectedApp}
            loadedArtifact={loadedArtifact}
            isLoading={isLoading}
            onBack={handleBack}
            onInstall={handleInstall}
            theme={theme}
            mode={mode}
          />
        ) : (
          <>
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
                App Store
              </h2>
              <button
                onClick={closeAppStore}
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

            {/* App List Content */}
            <div style={{
              flex: 1,
              padding: theme.spacing.lg,
              overflowY: 'auto',
            }}>
              {/* Large Category Title */}
              <h3 style={{
                margin: `0 0 ${theme.spacing.sm} 0`,
                fontSize: '32px',
                fontWeight: 700,
                fontFamily: theme.typography.fontFamily.sans,
                color: theme.colors.text.primary,
                letterSpacing: '-0.02em',
              }}>
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h3>

              {/* Section Header */}
              <div style={{
                marginBottom: theme.spacing.lg,
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: theme.colors.accent.ios,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {selectedCategory === 'today' ? 'Featured' : selectedCategory === 'games' ? 'What We\'re Playing' : selectedCategory === 'templates' ? 'Start Building' : selectedCategory === 'prototype' ? 'Work in Progress' : 'Top Apps'}
                </span>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  fontFamily: theme.typography.fontFamily.sans,
                  color: theme.colors.text.tertiary,
                }}>
                  {selectedCategory === 'today' ? 'The best apps and games' : selectedCategory === 'games' ? 'These favorites are always a great choice' : selectedCategory === 'templates' ? 'Pre-built components and demos' : selectedCategory === 'prototype' ? 'Experimental features being developed' : 'Essential apps for everyone'}
                </p>
              </div>

              {/* App List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                background: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderRadius: theme.radius.lg,
                overflow: 'hidden',
              }}>
                {filteredApps.map((prebuild, index) => {
                  const IconComponent = getIconById(prebuild.icon);
                  const iconColor = getIconColorById(prebuild.icon);

                  return (
                    <div
                      key={prebuild.id}
                      onClick={() => handleSelectApp(prebuild)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        padding: '14px 16px',
                        background: mode === 'dark'
                          ? 'rgba(40, 45, 65, 0.5)'
                          : 'rgba(253, 251, 247, 0.65)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = mode === 'dark'
                          ? 'rgba(50, 55, 80, 0.65)'
                          : 'rgba(253, 251, 247, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = mode === 'dark'
                          ? 'rgba(40, 45, 65, 0.5)'
                          : 'rgba(253, 251, 247, 0.65)';
                      }}
                    >
                      {/* App Icon - iOS style rounded square */}
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${iconColor}25 0%, ${iconColor}45 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      }}>
                        <IconComponent size={32} color={iconColor} />
                      </div>

                      {/* App Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: 500,
                          fontFamily: theme.typography.fontFamily.sans,
                          color: theme.colors.text.primary,
                          marginBottom: '3px',
                          letterSpacing: '-0.01em',
                        }}>
                          {prebuild.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontFamily: theme.typography.fontFamily.sans,
                          color: theme.colors.text.tertiary,
                        }}>
                          {getCategoryLabel(prebuild.category)}
                        </div>
                      </div>

                      {/* Get Button - iOS pill style */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstall(prebuild);
                        }}
                        style={{
                          padding: '6px 20px',
                          background: theme.colors.accent.iosLight,
                          color: theme.colors.accent.ios,
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '15px',
                          fontWeight: 600,
                          fontFamily: theme.typography.fontFamily.sans,
                          cursor: 'pointer',
                          transition: `all ${theme.animation.fast}`,
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = mode === 'dark'
                            ? 'rgba(10, 132, 255, 0.35)'
                            : 'rgba(0, 122, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.colors.accent.iosLight;
                        }}
                      >
                        GET
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              {filteredApps.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing['2xl'],
                  color: theme.colors.text.tertiary,
                }}>
                  <p>No apps in this category yet.</p>
                </div>
              )}
            </div>

            {/* Floating Bottom Tab Bar - Liquid Glass Effect */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: theme.spacing.md,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px',
                background: mode === 'dark'
                  ? 'rgba(60, 60, 65, 0.7)'
                  : 'rgba(200, 200, 200, 0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '50px',
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              }}>
                {CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const isSelected = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        padding: '8px 16px',
                        background: isSelected
                          ? (mode === 'dark' ? 'rgba(80, 80, 85, 0.8)' : 'rgba(255, 255, 255, 0.7)')
                          : 'transparent',
                        border: 'none',
                        borderRadius: '40px',
                        cursor: 'pointer',
                        transition: `all ${theme.animation.fast}`,
                        minWidth: '60px',
                      }}
                    >
                      <CategoryIcon
                        size={22}
                        color={isSelected ? theme.colors.accent.ios : (mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)')}
                      />
                      <span style={{
                        fontSize: '10px',
                        fontWeight: theme.typography.fontWeight.medium,
                        fontFamily: theme.typography.fontFamily.sans,
                        color: isSelected ? theme.colors.accent.ios : (mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
                      }}>
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

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

export default AppStorePanel;
