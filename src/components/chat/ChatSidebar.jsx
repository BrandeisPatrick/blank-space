import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';

// Grok-style colors
const GROK_COLORS = {
  dark: {
    bg: '#000000',
    activeBg: '#1a1a1a',
    hoverBg: '#1a1a1a',
    border: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    textTertiary: '#666666',
  },
  light: {
    bg: '#ffffff',
    activeBg: '#f0f0f0',
    hoverBg: '#f5f5f5',
    border: '#e0e0e0',
    textPrimary: '#000000',
    textSecondary: '#666666',
    textTertiary: '#888888',
  },
};

// Icons
const LogoIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const PanelsIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const SearchIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChatIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const HistoryIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AppsIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const UserIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Sidebar navigation item with Grok-style pill
const SidebarItem = ({ icon: Icon, label, onClick, active, expanded, colors }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: expanded ? '12px' : 0,
        width: expanded ? '100%' : '40px',
        height: '40px',
        padding: expanded ? '0 12px' : 0,
        justifyContent: expanded ? 'flex-start' : 'center',
        background: active
          ? colors.activeBg
          : isHovered
            ? colors.hoverBg
            : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: active || isHovered ? colors.textPrimary : colors.textSecondary,
        transition: 'all 0.15s ease',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      title={!expanded ? label : undefined}
    >
      <Icon size={20} />
      {expanded && <span>{label}</span>}
    </button>
  );
};

// Search bar component (Grok-style)
const SearchBar = ({ expanded, colors, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: isHovered ? colors.hoverBg : 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: isHovered ? colors.textPrimary : colors.textSecondary,
          transition: 'all 0.15s ease',
        }}
        title="Search"
      >
        <SearchIcon size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 12px',
        background: isHovered ? colors.hoverBg : 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        color: colors.textSecondary,
        transition: 'all 0.15s ease',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <SearchIcon size={18} />
      <span>Search</span>
      <span style={{
        marginLeft: 'auto',
        fontSize: '12px',
        color: colors.textTertiary,
        background: colors.activeBg,
        padding: '2px 6px',
        borderRadius: '4px',
      }}>
        Ctrl+K
      </span>
    </button>
  );
};

export const ChatSidebar = ({
  expanded = false,
  visible = true,
  onToggle,
  onClose,
  isMobile = false,
}) => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { openAuthModal, openSettingsModal } = useSettings();
  const theme = getTheme(mode);
  const navigate = useNavigate();
  const location = useLocation();

  const colors = mode === 'dark' ? GROK_COLORS.dark : GROK_COLORS.light;
  const sidebarWidth = expanded ? '250px' : '60px';

  // Check if on chat page (root)
  const isOnChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const isOnAppsPage = location.pathname === '/apps';

  // Navigation handlers
  const handleChat = () => {
    navigate('/');
    if (isMobile) onClose?.();
  };

  const handleSearch = () => {
    // TODO: Open search modal
    console.log('Search clicked');
  };

  const handleApps = () => {
    navigate('/apps');
    if (isMobile) onClose?.();
  };

  const handleUserClick = () => {
    if (user) {
      openSettingsModal?.();
    } else {
      openAuthModal?.();
    }
    if (isMobile) onClose?.();
  };

  if (!visible && isMobile) return null;

  return (
    <div
      data-sidebar
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '4px',
        background: colors.bg,
        borderRight: `1px solid ${colors.border}`,
        transition: 'width 0.2s ease, min-width 0.2s ease',
        ...(isMobile && {
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
        }),
      }}
    >
      {/* Logo / Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        height: '48px',
        marginBottom: '8px',
        paddingLeft: expanded ? '8px' : 0,
      }}>
        <button
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: colors.textPrimary,
            transition: 'all 0.15s ease',
          }}
          title="Toggle Sidebar"
        >
          {expanded ? <PanelsIcon size={22} /> : <LogoIcon size={22} />}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '8px' }}>
        <SearchBar expanded={expanded} colors={colors} onClick={handleSearch} />
      </div>

      {/* Navigation Items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {/* Chat */}
        <SidebarItem
          icon={ChatIcon}
          label="Chat"
          onClick={handleChat}
          active={isOnChatPage}
          expanded={expanded}
          colors={colors}
        />

        {/* Apps */}
        <SidebarItem
          icon={AppsIcon}
          label="Apps"
          onClick={handleApps}
          active={isOnAppsPage}
          expanded={expanded}
          colors={colors}
        />
      </div>

      {/* History Section */}
      {expanded && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          marginTop: '16px',
        }}>
          {/* History Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            color: colors.textSecondary,
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <HistoryIcon size={18} />
            <span>History</span>
          </div>

          {/* Date Group - Today */}
          <div style={{
            fontSize: '12px',
            color: colors.textTertiary,
            padding: '12px 12px 4px 12px',
            fontWeight: 500,
          }}>
            Today
          </div>

          {/* Placeholder for conversations */}
          <div style={{
            fontSize: '13px',
            color: colors.textTertiary,
            padding: '8px 12px',
          }}>
            No recent conversations
          </div>

          {/* See all link */}
          <button
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: colors.textTertiary,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            See all
          </button>
        </div>
      )}

      {/* Spacer when collapsed */}
      {!expanded && <div style={{ flex: 1 }} />}

      {/* User Section */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '8px',
      }}>
        <SidebarItem
          icon={UserIcon}
          label={user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
          onClick={handleUserClick}
          expanded={expanded}
          colors={colors}
        />
      </div>
    </div>
  );
};

ChatSidebar.propTypes = {
  expanded: PropTypes.bool,
  visible: PropTypes.bool,
  onToggle: PropTypes.func,
  onClose: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default ChatSidebar;
