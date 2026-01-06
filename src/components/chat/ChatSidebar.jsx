import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useConversation } from '../../contexts/ConversationContext';

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

const SettingsIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SignOutIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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
  const { user, signOut } = useAuth();
  const { openAuthModal, openSettingsModal } = useSettings();
  const { conversations, activeConversationId, createConversation, switchConversation } = useConversation();
  const navigate = useNavigate();
  const location = useLocation();

  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const colors = mode === 'dark' ? GROK_COLORS.dark : GROK_COLORS.light;
  const sidebarWidth = expanded ? '250px' : '60px';

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  // Check if on chat page (root)
  const isOnChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const isOnAppsPage = location.pathname === '/apps';

  // Navigation handlers - Create new conversation when clicking Chat
  const handleChat = () => {
    createConversation();
    navigate('/');
    if (isMobile) onClose?.();
  };

  // Switch to an existing conversation
  const handleConversationClick = (convId) => {
    switchConversation(convId);
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
      setShowUserMenu(!showUserMenu);
    } else {
      openAuthModal?.();
      if (isMobile) onClose?.();
    }
  };

  return (
    <div
      data-sidebar
      style={{
        width: isMobile ? '280px' : sidebarWidth,
        minWidth: isMobile ? '280px' : sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '4px',
        background: colors.bg,
        borderRight: `1px solid ${colors.border}`,
        transition: isMobile
          ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'width 0.2s ease, min-width 0.2s ease',
        ...(isMobile && {
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
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

        {/* Computer */}
        <SidebarItem
          icon={AppsIcon}
          label="Computer"
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

          {/* Conversation List */}
          {conversations.filter(c => c.messageCount > 0).length === 0 ? (
            <div style={{
              fontSize: '13px',
              color: colors.textTertiary,
              padding: '8px 12px',
            }}>
              No recent conversations
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {conversations
                .filter(c => c.messageCount > 0)
                .slice(0, 10)
                .map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationClick(conv.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: conv.id === activeConversationId ? colors.activeBg : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: conv.id === activeConversationId ? colors.textPrimary : colors.textSecondary,
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (conv.id !== activeConversationId) {
                        e.currentTarget.style.background = colors.hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (conv.id !== activeConversationId) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {conv.title}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Spacer when collapsed */}
      {!expanded && <div style={{ flex: 1 }} />}

      {/* User Section */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '8px',
        position: 'relative',
      }} ref={userMenuRef}>
        <SidebarItem
          icon={UserIcon}
          label={user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
          onClick={handleUserClick}
          expanded={expanded}
          colors={colors}
        />

        {/* User Menu Popup */}
        {showUserMenu && user && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: expanded ? '8px' : '50%',
            transform: expanded ? 'none' : 'translateX(-50%)',
            marginBottom: '8px',
            background: colors.activeBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '8px 0',
            minWidth: '180px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 100,
          }}>
            {/* Settings */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                openSettingsModal?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: colors.textPrimary,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <SettingsIcon size={18} color={colors.textSecondary} />
              <span>Settings</span>
            </button>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: colors.border,
              margin: '4px 12px',
            }} />

            {/* Sign Out */}
            <button
              onClick={async () => {
                setShowUserMenu(false);
                try {
                  await signOut();
                  navigate('/');
                } catch (e) {
                  console.error('Sign out failed:', e);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: colors.textPrimary,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <SignOutIcon size={18} color={colors.textSecondary} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
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
