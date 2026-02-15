import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useConversation } from '../../contexts/ConversationContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { getTheme } from '../../styles/theme';
import { Sidebar } from '../chat/Sidebar';
import { Banner } from '../chat/Banner';
import { Composer } from '../chat/Composer';
import { Messages } from '../chat/Messages';
import { AuthModal } from '../auth/AuthModal';
import { Modal as SettingsModal } from '../settings/Modal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AppsIcon, MenuIcon } from '../icons/icons';
import { MODEL_TIERS } from '../../services/config/modelConfig';

// Chevron down icon for model dropdown
const ChevronDownIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Lock icon for auth-required features
const LockIcon = ({ size = 14, color = "currentColor" }) => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const ChatPage = ({
  // Props passed from App.jsx for chat functionality
  chatMessages = [],
  onSendMessage,
  isAIProcessing = false,
  modelTier = 'lite',
  onChangeModelTier,
}) => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { openAuthModal } = useSettings();
  const { switchConversation, activeConversationId } = useConversation();
  const { projects } = useFileSystem();

  // Get apps from projects (real installed apps with proper names)
  const apps = projects.map(p => ({ id: p.slug, title: p.name }));
  const theme = getTheme(mode);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const isMobile = useIsMobile();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isMobile);
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);
  const [editingApp, setEditingApp] = useState(null); // App being edited/debugged
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef(null);
  const modelButtonRef = useRef(null);

  // Bug #7 fix: Switch to conversation when route parameter changes
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      switchConversation(conversationId);
    }
  }, [conversationId, activeConversationId, switchConversation]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target) &&
        modelButtonRef.current &&
        !modelButtonRef.current.contains(event.target)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if we should show the empty state (greeting + pills) or messages
  const hasMessages = chatMessages.length > 0;

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarVisible(!isSidebarVisible);
    } else {
      setIsSidebarExpanded(!isSidebarExpanded);
    }
  }, [isMobile, isSidebarVisible, isSidebarExpanded]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (isMobile && isSidebarVisible) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-sidebar]')) {
          setIsSidebarVisible(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, isSidebarVisible]);

  // Navigate to apps page
  const handleGoToApps = () => {
    navigate('/apps');
  };

  // Handle start debug session for an app
  const handleStartDebug = (app) => {
    setEditingApp({ ...app, name: app.title, mode: 'debug' });
  };

  // Handle start edit session for an app
  const handleStartEdit = (app) => {
    setEditingApp({ ...app, name: app.title, mode: 'edit' });
  };

  // Clear editing mode
  const handleClearEditing = () => {
    setEditingApp(null);
  };

  // Handle send message
  const handleSend = (message, images = null, mentionedApp = null) => {
    if (onSendMessage) {
      // If an app was mentioned via @, pass it as options for debug mode
      // Note: Files are loaded from FileSystem in useChat, we just pass the project slug
      if (mentionedApp) {
        onSendMessage(message, images, {
          mentionedAppId: mentionedApp.id,
          mentionedAppFiles: {}, // Files are loaded from FileSystem in useChat
          isDebugMode: true
        });
      } else {
        onSendMessage(message, images);
      }
    }
  };

  // Flat design - solid dark background like Grok
  const pageBg = mode === 'dark' ? '#000000' : '#ffffff';

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100dvh',
      minHeight: '100vh',
      background: pageBg,
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar
        expanded={isSidebarExpanded}
        visible={isSidebarVisible}
        onToggle={toggleSidebar}
        onClose={() => setIsSidebarVisible(false)}
        isMobile={isMobile}
      />

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            opacity: isSidebarVisible ? 1 : 0,
            pointerEvents: isSidebarVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Mobile hamburger menu button (top-left) */}
        {isMobile && (
          <div
            data-sidebar
            style={{
              position: 'absolute',
              top: theme.spacing.md,
              left: theme.spacing.md,
              zIndex: 10,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: 'none',
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                transition: `all ${theme.animation.fast}`,
              }}
              title="Menu"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        )}

        {/* Top Left Model Selector */}
        <div style={{
          position: 'absolute',
          top: isMobile ? theme.spacing.md : theme.spacing.lg,
          left: isMobile ? '56px' : theme.spacing.lg,
          zIndex: 10,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              ref={modelButtonRef}
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showModelDropdown ? theme.colors.bg.hover : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.text.primary,
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 500,
                fontFamily: theme.typography.fontFamily.sans,
                padding: '6px 8px',
                borderRadius: '8px',
                transition: `all ${theme.animation.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                if (!showModelDropdown) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{MODEL_TIERS[modelTier]?.name || 'Bina Lite'}</span>
              <ChevronDownIcon size={14} color={theme.colors.text.secondary} />
            </button>

            {/* Model Dropdown Menu */}
            {showModelDropdown && (
              <div
                ref={modelDropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '12px',
                  minWidth: '180px',
                  overflow: 'hidden',
                  zIndex: 100,
                  padding: '6px',
                  boxShadow: mode === 'dark'
                    ? '0 8px 32px rgba(0,0,0,0.4)'
                    : '0 8px 32px rgba(0,0,0,0.15)',
                }}
              >
                {Object.entries(MODEL_TIERS).map(([key, tier]) => {
                  const needsAuth = !user && key === 'pro';
                  const isSelected = modelTier === key && !needsAuth;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        if (needsAuth) {
                          setShowModelDropdown(false);
                          openAuthModal();
                        } else {
                          onChangeModelTier && onChangeModelTier(key);
                          setShowModelDropdown(false);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: isSelected
                          ? (mode === 'dark' ? '#2a2a2a' : '#f0f0f0')
                          : 'transparent',
                        borderRadius: '8px',
                        transition: 'background 0.15s ease',
                        opacity: needsAuth ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = mode === 'dark' ? '#2a2a2a' : '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.colors.text.primary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: theme.typography.fontFamily.sans,
                        }}>
                          {tier.name}
                          {needsAuth && <LockIcon size={12} color={theme.colors.text.tertiary} />}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          marginTop: '2px',
                          fontFamily: theme.typography.fontFamily.sans,
                        }}>
                          {needsAuth ? 'Sign in required' : tier.description}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 500 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {!hasMessages ? (
          // Empty state: Greeting + Input (centered)
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? theme.spacing.lg : theme.spacing['3xl'],
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? theme.spacing.lg : theme.spacing.xl,
              maxWidth: '700px',
              width: '100%',
              padding: `0 ${isMobile ? theme.spacing.sm : theme.spacing.lg}`,
            }}>
              <Banner userName={user?.displayName || user?.email?.split('@')[0]} />
              <Composer
                placeholder="Message..."
                onSend={handleSend}
                disabled={isAIProcessing}
                centered={true}
                isMobile={isMobile}
                apps={apps}
                onStartDebug={handleStartDebug}
                onStartEdit={handleStartEdit}
                activeArtifact={editingApp}
                isEditingArtifact={!!editingApp}
              />
            </div>
          </div>
        ) : (
          // Messages view with input at bottom - both aligned
          <>
            {/* Scrollable messages area */}
            <div
              className="dark-scrollbar"
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
              <div style={{
                width: isMobile ? '95%' : '90%',
                maxWidth: '800px',
                paddingTop: isMobile ? theme.spacing.md : theme.spacing.xl,
                paddingBottom: isMobile ? theme.spacing.md : theme.spacing.xl,
              }}>
                <Messages
                  messages={chatMessages}
                  onDebug={handleSend}
                  isMobile={isMobile}
                />
              </div>
            </div>

            {/* Input at bottom - same alignment as messages */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: isMobile
                ? `${theme.spacing.sm} ${theme.spacing.sm}`
                : `${theme.spacing.md} ${theme.spacing.lg}`,
              paddingBottom: isMobile ? theme.spacing.md : theme.spacing.xl,
            }}>
              <Composer
                placeholder="Message..."
                onSend={handleSend}
                disabled={isAIProcessing}
                centered={true}
                isMobile={isMobile}
                apps={apps}
                onStartDebug={handleStartDebug}
                onStartEdit={handleStartEdit}
                activeArtifact={editingApp}
                isEditingArtifact={!!editingApp}
              />
            </div>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Settings Panel */}
      <SettingsModal />
    </div>
  );
};

export default ChatPage;
