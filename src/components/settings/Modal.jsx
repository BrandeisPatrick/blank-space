import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { Z_INDEX } from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AccountTab } from './tabs/AccountTab';
import { ThemeTab } from './tabs/ThemeTab';
import { AboutTab } from './tabs/AboutTab';
import { SubscriptionTab } from './tabs/SubscriptionTab';
import { CloseIcon } from '../icons/icons';

// Tab icons
const AccountIcon = ({ size = 20, color = '#7e7e7e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AppearanceIcon = ({ size = 20, color = '#7e7e7e' }) => (
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

const SubscriptionIcon = ({ size = 20, color = '#7e7e7e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const UsIcon = ({ size = 20, color = '#7e7e7e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TABS = [
  { id: 'account', label: 'Account', icon: AccountIcon },
  { id: 'appearance', label: 'Appearance', icon: AppearanceIcon },
  { id: 'subscription', label: 'Subscription', icon: SubscriptionIcon },
  { id: 'us', label: 'Us', icon: UsIcon },
];

export const Modal = () => {
  const { mode } = useTheme();
  const { isSettingsOpen, closeSettings } = useSettings();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('account');

  if (!isSettingsOpen) return null;

  // Use theme colors for consistency
  const colors = {
    bg: theme.colors.bg.secondary,
    sidebarBg: theme.colors.bg.secondary,
    cardBg: theme.colors.bg.tertiary,
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    activeTabBg: mode === 'dark' ? '#1d4a73' : '#e5e5e5', // Keep custom active tab color
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab />;
      case 'appearance':
        return <ThemeTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'us':
        return <AboutTab />;
      default:
        return <AccountTab />;
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
          background: 'rgba(0, 0, 0, 0.5)',
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
          width: isMobile ? '95%' : '700px',
          maxWidth: '95vw',
          height: isMobile ? '90vh' : '500px',
          maxHeight: '90vh',
          background: colors.bg,
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          zIndex: Z_INDEX.MODALS,
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={closeSettings}
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            right: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: 'transparent',
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            color: colors.textSecondary,
            transition: 'all 0.15s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.cardBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <CloseIcon size={18} color={colors.textSecondary} />
        </button>

        {/* Left Sidebar with Tabs */}
        <div style={{
          width: isMobile ? '100%' : '200px',
          minWidth: isMobile ? 'auto' : '200px',
          background: colors.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? theme.spacing.sm : theme.spacing.md,
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? theme.spacing.sm : theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.medium,
              color: colors.textPrimary,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              Settings
            </h2>
          </div>

          {/* Tab Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: theme.spacing.xs,
            overflowX: isMobile ? 'auto' : 'visible',
            flex: isMobile ? 'none' : 1,
          }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    background: isActive ? colors.activeTabBg : 'transparent',
                    border: 'none',
                    borderRadius: theme.radius.lg,
                    cursor: 'pointer',
                    color: colors.textPrimary,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.normal,
                    fontFamily: theme.typography.fontFamily.sans,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = colors.cardBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={18} color={colors.textPrimary} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div
          className="settings-content"
          style={{
            flex: 1,
            padding: `${theme.spacing['3xl']} ${theme.spacing.xl} ${theme.spacing.xl}`,
            overflowY: 'auto',
            background: colors.bg,
          }}
        >
          {renderTabContent()}
        </div>

        {/* Animations & Scrollbar */}
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
            .settings-content::-webkit-scrollbar {
              width: 6px;
            }
            .settings-content::-webkit-scrollbar-track {
              background: transparent;
            }
            .settings-content::-webkit-scrollbar-thumb {
              background: #333333;
              border-radius: 3px;
            }
            .settings-content::-webkit-scrollbar-thumb:hover {
              background: #444444;
            }
          `}
        </style>
      </div>
    </>
  );
};

export default Modal;
