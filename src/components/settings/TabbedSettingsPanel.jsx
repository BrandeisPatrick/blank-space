import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { Z_INDEX } from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ThemeTab } from './tabs/ThemeTab';
import { AIPreferenceTab } from './tabs/AIPreferenceTab';
import { UsTab } from './tabs/UsTab';
import { SubscriptionTab } from './tabs/SubscriptionTab';
import { CloseIcon } from '../icons/icons';

// Tab icons (specific to settings panel)
const ThemeIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const AIIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const UsIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SubscriptionIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const TABS = [
  { id: 'theme', label: 'Theme', icon: ThemeIcon },
  { id: 'ai', label: 'AI Preference', icon: AIIcon },
  { id: 'subscription', label: 'Subscription', icon: SubscriptionIcon },
  { id: 'us', label: 'Us', icon: UsIcon },
];

export const TabbedSettingsPanel = () => {
  const { mode } = useTheme();
  const { isSettingsOpen, closeSettings } = useSettings();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('theme');

  if (!isSettingsOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theme':
        return <ThemeTab />;
      case 'ai':
        return <AIPreferenceTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'us':
        return <UsTab />;
      default:
        return <ThemeTab />;
    }
  };

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
          width: isMobile ? '100%' : '95%',
          maxWidth: isMobile ? '100%' : '900px',
          maxHeight: '85vh',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.85)'
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
            className={`hover-glass-${mode} hover-transition`}
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
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${!isActive ? `tab-inactive-${mode}` : ''} hover-transition`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
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
                    marginBottom: '-1px',
                  }}
                >
                  <Icon size={18} color={isActive ? '#3B82F6' : 'currentColor'} />
                  {tab.label}
                </button>
              );
            })}
        </div>

        {/* Content - Scrollable */}
        <div style={{
          padding: theme.spacing.lg,
          overflowY: 'auto',
          flex: 1,
        }}>
          {renderTabContent()}
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

export default TabbedSettingsPanel;
