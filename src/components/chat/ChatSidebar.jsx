import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useConversation } from '../../contexts/ConversationContext';
import { getTheme } from '../../styles/theme';

// Constants
const CONVERSATION_DISPLAY_LIMIT = 10;

// Helper: Group conversations by date (Today, Yesterday, by Year)
const groupConversationsByDate = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups = {
    today: [],
    yesterday: [],
    byYear: {},
  };

  conversations.forEach(conv => {
    const timestamp = conv.updatedAt || conv.createdAt;
    const date = new Date(timestamp);

    if (date >= today) {
      groups.today.push(conv);
    } else if (date >= yesterday) {
      groups.yesterday.push(conv);
    } else {
      const year = date.getFullYear().toString();
      if (!groups.byYear[year]) groups.byYear[year] = [];
      groups.byYear[year].push(conv);
    }
  });

  return groups;
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

const ChevronIcon = ({ size = 16, color = "currentColor", expanded = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s ease',
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
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

// Sidebar navigation item - cleaner minimal style
const SidebarItem = ({ icon: Icon, label, onClick, active, expanded, colors }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: expanded ? '12px' : 0,
        width: expanded ? '100%' : '40px',
        height: '40px',
        padding: expanded ? '0 12px' : 0,
        justifyContent: expanded ? 'flex-start' : 'center',
        background: active ? colors.activeBg : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: colors.textPrimary,
        transition: 'color 0.15s ease, background 0.15s ease',
        fontSize: '14px',
        fontWeight: 400,
        fontFamily: colors.fontFamily,
      }}
      title={!expanded ? label : undefined}
    >
      <Icon size={20} />
      {expanded && <span>{label}</span>}
    </button>
  );
};

// Conversation item - cleaner minimal style
const ConversationItem = ({ conv, isActive, colors, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '8px 12px',
      background: isActive ? colors.activeBg : 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: colors.textPrimary,
      fontSize: '14px',
      fontWeight: 400,
      cursor: 'pointer',
      fontFamily: colors.fontFamily,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'background 0.15s ease, color 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = colors.hoverBg;
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    {conv.title || 'New conversation'}
  </button>
);

// Search bar component (Grok-style) - disabled until search is implemented
const SearchBar = ({ expanded, colors }) => {
  if (!expanded) {
    return (
      <button
        disabled
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'not-allowed',
          color: colors.textTertiary,
          opacity: 0.5,
        }}
        title="Search (coming soon)"
      >
        <SearchIcon size={20} />
      </button>
    );
  }

  return (
    <button
      disabled
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'not-allowed',
        color: colors.textTertiary,
        opacity: 0.5,
        fontSize: '14px',
        fontWeight: 400,
        fontFamily: colors.fontFamily,
      }}
      title="Coming soon"
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
  const { openAuthModal, openSettings } = useSettings();
  const { conversations, activeConversationId, createConversation, switchConversation, isLoading } = useConversation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = getTheme(mode);

  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const portalMenuRef = useRef(null);

  // Use theme colors for consistency
  const colors = {
    bg: theme.colors.bg.primary,
    activeBg: theme.colors.bg.secondary,
    hoverBg: theme.colors.bg.secondary,
    border: theme.colors.border,
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.sans,
  };
  const sidebarWidth = expanded ? '250px' : '60px';

  // Filter, sort, and group conversations by date for display
  const { groupedConversations, totalCount, hasMore } = useMemo(() => {
    const filtered = conversations.filter(
      c => c.messageCount > 0 || c.id === activeConversationId
    );
    const sorted = [...filtered].sort(
      (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
    );

    // Limit to display count
    const limited = sorted.slice(0, CONVERSATION_DISPLAY_LIMIT);
    const groups = groupConversationsByDate(limited);

    return {
      groupedConversations: groups,
      totalCount: sorted.length,
      hasMore: sorted.length > CONVERSATION_DISPLAY_LIMIT,
    };
  }, [conversations, activeConversationId]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInUserMenu = userMenuRef.current && userMenuRef.current.contains(e.target);
      const clickedInPortalMenu = portalMenuRef.current && portalMenuRef.current.contains(e.target);
      if (!clickedInUserMenu && !clickedInPortalMenu) {
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
    // Search not yet implemented - show tooltip hint instead
  };

  const handleApps = () => {
    navigate('/apps');
    if (isMobile) onClose?.();
  };

  const handleUserClick = () => {
    if (user) {
      if (!showUserMenu && userButtonRef.current) {
        const rect = userButtonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.top - 8, // Position above the button with 8px gap
          left: rect.left,
        });
      }
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
          marginTop: '4px',
        }}>
          {/* History Header - Collapsible */}
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 12px',
              width: '100%',
              height: '40px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: colors.textPrimary,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: colors.fontFamily,
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
          >
            <HistoryIcon size={20} color="currentColor" />
            <span style={{ flex: 1, textAlign: 'left' }}>History</span>
            <ChevronIcon size={14} color="currentColor" expanded={historyExpanded} />
          </button>

          {/* Conversation List - Only show when expanded */}
          {historyExpanded && (isLoading ? (
            <div style={{
              fontSize: '14px',
              color: colors.textTertiary,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: colors.fontFamily,
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                border: `2px solid ${colors.textTertiary}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Loading...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : totalCount === 0 ? (
            <div style={{
              fontSize: '14px',
              color: colors.textTertiary,
              padding: '8px 12px',
              fontFamily: colors.fontFamily,
            }}>
              No recent conversations
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Today */}
              {groupedConversations.today.length > 0 && (
                <>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: colors.textTertiary,
                    padding: '8px 12px 4px',
                    fontFamily: theme.typography.fontFamily.sans,
                  }}>
                    Today
                  </div>
                  {groupedConversations.today.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConversationId}
                      colors={colors}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </>
              )}

              {/* Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: colors.textTertiary,
                    padding: '8px 12px 4px',
                    marginTop: groupedConversations.today.length > 0 ? '8px' : 0,
                    fontFamily: theme.typography.fontFamily.sans,
                  }}>
                    Yesterday
                  </div>
                  {groupedConversations.yesterday.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConversationId}
                      colors={colors}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </>
              )}

              {/* By Year */}
              {Object.keys(groupedConversations.byYear)
                .sort((a, b) => Number(b) - Number(a))
                .map(year => (
                  <div key={year}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: colors.textTertiary,
                      padding: '8px 12px 4px',
                      marginTop: (groupedConversations.today.length > 0 || groupedConversations.yesterday.length > 0) ? '8px' : 0,
                      fontFamily: theme.typography.fontFamily.sans,
                    }}>
                      {year}
                    </div>
                    {groupedConversations.byYear[year].map(conv => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeConversationId}
                        colors={colors}
                        onClick={() => handleConversationClick(conv.id)}
                      />
                    ))}
                  </div>
                ))}

              {/* See all link */}
              {hasMore && (
                <button
                  onClick={() => {
                    // TODO: Navigate to full history view or expand list
                    console.log('See all clicked - expand history');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    marginTop: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.textTertiary,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: colors.fontFamily,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.textSecondary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
                >
                  See all →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spacer when collapsed */}
      {!expanded && <div style={{ flex: 1 }} />}

      {/* User Section */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '8px',
      }} ref={userMenuRef}>
        <div ref={userButtonRef}>
          <SidebarItem
            icon={UserIcon}
            label={user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
            onClick={handleUserClick}
            expanded={expanded}
            colors={colors}
          />
        </div>

        {/* User Menu Popup - Portal to document.body */}
        {showUserMenu && user && createPortal(
          <div
            ref={portalMenuRef}
            style={{
              position: 'fixed',
              top: menuPosition.top - 100, // Position menu above the button (menu height ~100px)
              left: menuPosition.left,
              background: theme.colors.bg.secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '8px 0',
              minWidth: '180px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
            }}>
            {/* Settings */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                openSettings?.();
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
                fontWeight: 400,
                cursor: 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
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
                fontWeight: 400,
                cursor: 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <SignOutIcon size={18} color={colors.textSecondary} />
              <span>Sign Out</span>
            </button>
          </div>,
          document.body
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
