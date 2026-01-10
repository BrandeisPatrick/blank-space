import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useConversation } from '../../contexts/ConversationContext';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { getTheme } from '../../styles/theme';
import SearchModal from './SearchModal';
import {
  LogoIcon,
  PanelsIcon,
  SearchIcon,
  ChatIcon,
  HistoryIcon,
  ChevronRightIcon,
  AppsIcon,
  UserIcon,
  SettingsIcon,
  SignOutIcon,
} from '../icons/icons';

// Constants
const CONVERSATION_DISPLAY_LIMIT = 10;
const MS_PER_DAY = 86400000;

// Helper: Group conversations by date (Today, Yesterday, by Year)
const groupConversationsByDate = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - MS_PER_DAY);

  const groups = { today: [], yesterday: [], byYear: {} };

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

// Sidebar navigation item - minimal style with transparent background
const SidebarItem = ({ icon: Icon, label, onClick, active, expanded, colors }) => (
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
      transition: 'background 0.15s ease',
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: colors.fontFamily,
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = colors.hoverBg;
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
    title={!expanded ? label : undefined}
  >
    <Icon size={20} />
    {expanded && <span>{label}</span>}
  </button>
);

SidebarItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  active: PropTypes.bool,
  expanded: PropTypes.bool,
  colors: PropTypes.object.isRequired,
};

// Conversation item - minimal style
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
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!isActive) e.currentTarget.style.background = colors.hoverBg;
    }}
    onMouseLeave={(e) => {
      if (!isActive) e.currentTarget.style.background = 'transparent';
    }}
  >
    {conv.title || 'New conversation'}
  </button>
);

ConversationItem.propTypes = {
  conv: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Search bar component - minimal style
const SearchBar = ({ expanded, colors, onClick, disabled }) => {
  if (!expanded) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: disabled ? 'default' : 'pointer',
          color: colors.textTertiary,
          opacity: disabled ? 0.5 : 1,
          transition: 'color 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.color = colors.textPrimary;
            e.currentTarget.style.background = colors.hoverBg;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.textTertiary;
          e.currentTarget.style.background = 'transparent';
        }}
        title={disabled ? "Sign in to search history" : "Search (Ctrl+K)"}
      >
        <SearchIcon size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: disabled ? 'default' : 'pointer',
        color: colors.textTertiary,
        opacity: disabled ? 0.5 : 1,
        fontSize: '14px',
        fontWeight: 400,
        fontFamily: colors.fontFamily,
        transition: 'border-color 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.textTertiary;
          e.currentTarget.style.color = colors.textSecondary;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.color = colors.textTertiary;
      }}
      title={disabled ? "Sign in to search history" : "Search conversations"}
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

SearchBar.propTypes = {
  expanded: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

// Section header for history groups
const HistorySectionHeader = ({ title, colors, style }) => (
  <div style={{
    fontSize: '12px',
    fontWeight: 500,
    color: colors.textTertiary,
    padding: '8px 12px 4px',
    fontFamily: colors.fontFamily,
    ...style,
  }}>
    {title}
  </div>
);

HistorySectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  colors: PropTypes.object.isRequired,
  style: PropTypes.object,
};

// User menu component - uses modal container styling (visible bg is correct for menus)
const UserMenu = ({ position, colors, theme, onSettings, onSignOut, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItemStyle = {
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
    fontFamily: colors.fontFamily,
    transition: 'background 0.15s ease',
  };

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top - 100,
        left: position.left,
        background: theme.colors.bg.secondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '8px 0',
        minWidth: '180px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
      }}
    >
      <button
        style={menuItemStyle}
        onClick={onSettings}
        onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <SettingsIcon size={18} color={colors.textSecondary} />
        <span>Settings</span>
      </button>
      <div style={{ height: '1px', background: colors.border, margin: '4px 12px' }} />
      <button
        style={menuItemStyle}
        onClick={onSignOut}
        onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <SignOutIcon size={18} color={colors.textSecondary} />
        <span>Sign Out</span>
      </button>
    </div>,
    document.body
  );
};

UserMenu.propTypes = {
  position: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  onSettings: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export const Sidebar = ({
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
  const { clearActiveArtifact } = useArtifacts();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = getTheme(mode);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const userButtonRef = useRef(null);

  // Memoized colors
  const colors = useMemo(() => ({
    bg: theme.colors.bg.primary,
    activeBg: theme.colors.bg.secondary,
    hoverBg: theme.colors.bg.secondary,
    border: theme.colors.border,
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.sans,
  }), [theme]);

  const sidebarWidth = expanded ? '250px' : '60px';

  // Keyboard shortcut for search (Ctrl+K / Cmd+K) - only for authenticated users
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && user) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Filter, sort, and group conversations by date for display
  const { groupedConversations, totalCount } = useMemo(() => {
    const filtered = conversations.filter(
      c => c.messageCount > 0 || c.id === activeConversationId
    );
    const sorted = [...filtered].sort(
      (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
    );
    const limited = sorted.slice(0, CONVERSATION_DISPLAY_LIMIT);

    return {
      groupedConversations: groupConversationsByDate(limited),
      totalCount: sorted.length,
    };
  }, [conversations, activeConversationId]);

  // Check if on specific pages
  const isOnChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const isOnAppsPage = location.pathname === '/apps';

  // Memoized handlers
  const handleChat = useCallback(() => {
    clearActiveArtifact(); // Clear previous app files so new "create" intents work
    createConversation();
    navigate('/');
    if (isMobile) onClose?.();
  }, [clearActiveArtifact, createConversation, navigate, isMobile, onClose]);

  const handleConversationClick = useCallback((convId) => {
    switchConversation(convId);
    navigate('/');
    if (isMobile) onClose?.();
  }, [switchConversation, navigate, isMobile, onClose]);

  const handleSearch = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  const handleApps = useCallback(() => {
    navigate('/apps');
    if (isMobile) onClose?.();
  }, [navigate, isMobile, onClose]);

  const handleUserClick = useCallback(() => {
    if (user) {
      if (!isUserMenuOpen && userButtonRef.current) {
        const rect = userButtonRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.top - 8, left: rect.left });
      }
      setIsUserMenuOpen(prev => !prev);
    } else {
      openAuthModal?.();
      if (isMobile) onClose?.();
    }
  }, [user, isUserMenuOpen, openAuthModal, isMobile, onClose]);

  const handleSettings = useCallback(() => {
    setIsUserMenuOpen(false);
    openSettings?.();
  }, [openSettings]);

  const handleSignOut = useCallback(async () => {
    setIsUserMenuOpen(false);
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  }, [signOut, navigate]);

  const handleSelectConversation = useCallback((convId) => {
    switchConversation(convId);
    navigate('/');
    if (isMobile) onClose?.();
  }, [switchConversation, navigate, isMobile, onClose]);

  const handleCreateNew = useCallback(() => {
    clearActiveArtifact(); // Clear previous app files so new "create" intents work
    createConversation();
    navigate('/');
    if (isMobile) onClose?.();
  }, [clearActiveArtifact, createConversation, navigate, isMobile, onClose]);

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
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Toggle Sidebar"
        >
          {expanded ? <PanelsIcon size={22} /> : <LogoIcon size={22} />}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '8px' }}>
        <SearchBar expanded={expanded} colors={colors} onClick={handleSearch} disabled={!user} />
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <SidebarItem
          icon={ChatIcon}
          label="Chat"
          onClick={handleChat}
          active={isOnChatPage}
          expanded={expanded}
          colors={colors}
        />
        <SidebarItem
          icon={AppsIcon}
          label="Computer"
          onClick={handleApps}
          active={isOnAppsPage}
          expanded={expanded}
          colors={colors}
        />
      </div>

      {/* History Section - only show for authenticated users */}
      {expanded && user && (
        <div className="dark-scrollbar" style={{ flex: 1, overflow: 'auto', marginTop: '4px' }}>
          {/* History Header - Collapsible */}
          <button
            onClick={() => setIsHistoryExpanded(prev => !prev)}
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
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <HistoryIcon size={20} />
            <span style={{ flex: 1, textAlign: 'left' }}>History</span>
            <ChevronRightIcon size={14} expanded={isHistoryExpanded} />
          </button>

          {/* Conversation List */}
          {isHistoryExpanded && (isLoading ? (
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
                  <HistorySectionHeader title="Today" colors={colors} />
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
                  <HistorySectionHeader
                    title="Yesterday"
                    colors={colors}
                    style={{ marginTop: groupedConversations.today.length > 0 ? '8px' : 0 }}
                  />
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
                    <HistorySectionHeader
                      title={year}
                      colors={colors}
                      style={{
                        marginTop: (groupedConversations.today.length > 0 || groupedConversations.yesterday.length > 0) ? '8px' : 0,
                      }}
                    />
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
              <button
                onClick={() => setIsSearchModalOpen(true)}
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
            </div>
          ))}
        </div>
      )}

      {/* Spacer when collapsed or when not logged in */}
      {(!expanded || !user) && <div style={{ flex: 1 }} />}

      {/* User Section */}
      <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
        <div ref={userButtonRef}>
          <SidebarItem
            icon={UserIcon}
            label={user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
            onClick={handleUserClick}
            expanded={expanded}
            colors={colors}
          />
        </div>

        {/* User Menu Popup */}
        {isUserMenuOpen && user && (
          <UserMenu
            position={menuPosition}
            colors={colors}
            theme={theme}
            onSettings={handleSettings}
            onSignOut={handleSignOut}
            onClose={() => setIsUserMenuOpen(false)}
          />
        )}
      </div>

      {/* Search History Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectConversation={handleSelectConversation}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

Sidebar.propTypes = {
  expanded: PropTypes.bool,
  visible: PropTypes.bool,
  onToggle: PropTypes.func,
  onClose: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default Sidebar;
