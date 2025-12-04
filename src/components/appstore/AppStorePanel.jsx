import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../contexts/AppStoreContext';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { PREBUILD_ARTIFACTS } from '../../data/prebuildArtifacts';
import { getIconById, getIconColorById } from '../artifact/IconPicker';
import { Z_INDEX } from '../../constants';

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

const CATEGORIES = [
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'games', label: 'Games', icon: GamesIcon },
  { id: 'apps', label: 'Apps', icon: AppsIcon },
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

// Download icon
const DownloadIcon = ({ size = 16, color = 'currentColor' }) => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const AppStorePanel = () => {
  const { mode } = useTheme();
  const { isAppStoreOpen, closeAppStore } = useAppStore();
  const { createArtifact } = useArtifacts();
  const theme = getTheme(mode);
  const [selectedCategory, setSelectedCategory] = useState('today');

  if (!isAppStoreOpen) return null;

  const handleInstall = (prebuild) => {
    // Create a new artifact from the prebuild template
    createArtifact(prebuild.name, prebuild.files, [], prebuild.icon);
    closeAppStore();
  };

  // Filter apps based on selected category
  const filteredApps = selectedCategory === 'today'
    ? PREBUILD_ARTIFACTS
    : PREBUILD_ARTIFACTS.filter(app => app.category === selectedCategory);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeAppStore}
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
          maxWidth: '650px',
          maxHeight: '80vh',
          minHeight: '400px',
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

        {/* Main Content with Sidebar */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* Category Sidebar */}
          <div style={{
            width: '140px',
            padding: theme.spacing.md,
            borderRight: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
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
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    background: isSelected
                      ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                      : 'transparent',
                    border: 'none',
                    borderRadius: theme.radius.lg,
                    cursor: 'pointer',
                    transition: `all ${theme.animation.fast}`,
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <CategoryIcon
                    size={18}
                    color={isSelected ? '#3B82F6' : theme.colors.text.secondary}
                  />
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.sans,
                    color: isSelected ? theme.colors.text.primary : theme.colors.text.secondary,
                  }}>
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* App List Content */}
          <div style={{
            flex: 1,
            padding: theme.spacing.lg,
            overflowY: 'auto',
          }}>
            {/* Section Title */}
            <h3 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.primary,
            }}>
              {CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h3>

            {/* App List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.md,
            }}>
              {filteredApps.map((prebuild) => {
                const IconComponent = getIconById(prebuild.icon);
                const iconColor = getIconColorById(prebuild.icon);

                return (
                  <div
                    key={prebuild.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      background: mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: theme.radius.lg,
                      border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {/* App Icon */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: theme.radius.lg,
                      background: `${iconColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComponent size={28} color={iconColor} />
                    </div>

                    {/* App Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold,
                        fontFamily: theme.typography.fontFamily.sans,
                        color: theme.colors.text.primary,
                        marginBottom: '4px',
                      }}>
                        {prebuild.name}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontFamily: theme.typography.fontFamily.sans,
                        color: theme.colors.text.secondary,
                        lineHeight: 1.4,
                      }}>
                        {prebuild.description}
                      </div>
                    </div>

                    {/* Install Button */}
                    <button
                      onClick={() => handleInstall(prebuild)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: theme.radius.lg,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        fontFamily: theme.typography.fontFamily.sans,
                        cursor: 'pointer',
                        transition: `all ${theme.animation.fast}`,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563EB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3B82F6';
                      }}
                    >
                      <DownloadIcon size={16} />
                      Get
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

export default AppStorePanel;
