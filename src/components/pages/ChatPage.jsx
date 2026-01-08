import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConversation } from '../../contexts/ConversationContext';
import { getTheme } from '../../styles/theme';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatGreeting } from '../chat/ChatGreeting';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';
import { ChatPanel } from '../chat/ChatPanel';
import { AuthModal } from '../auth/AuthModal';
import { TabbedSettingsPanel } from '../settings/TabbedSettingsPanel';
import { useIsMobile } from '../../hooks/useIsMobile';

// Apps icon for top-right navigation
const AppsIcon = ({ size = 24, color = "currentColor" }) => (
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
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

// Hamburger menu icon for mobile
const MenuIcon = ({ size = 24, color = "currentColor" }) => (
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
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
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
  const { switchConversation, activeConversationId } = useConversation();
  const theme = getTheme(mode);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const isMobile = useIsMobile();

  const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  // Bug #7 fix: Switch to conversation when route parameter changes
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      switchConversation(conversationId);
    }
  }, [conversationId, activeConversationId, switchConversation]);

  // Determine if we should show the empty state (greeting + pills) or messages
  const hasMessages = chatMessages.length > 0;

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  }, [isMobile, sidebarVisible, sidebarExpanded]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-sidebar]')) {
          setSidebarVisible(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, sidebarVisible]);

  // Navigate to apps page
  const handleGoToApps = () => {
    navigate('/apps');
  };

  // Handle send message
  const handleSend = (message) => {
    if (onSendMessage) {
      onSendMessage(message);
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
      <ChatSidebar
        expanded={sidebarExpanded}
        visible={sidebarVisible}
        onToggle={toggleSidebar}
        onClose={() => setSidebarVisible(false)}
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
            opacity: sidebarVisible ? 1 : 0,
            pointerEvents: sidebarVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => setSidebarVisible(false)}
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

        {/* Top Right Computer Button */}
        <div style={{
          position: 'absolute',
          top: isMobile ? theme.spacing.md : theme.spacing.lg,
          right: isMobile ? theme.spacing.md : theme.spacing.lg,
          zIndex: 10,
        }}>
          <button
            onClick={handleGoToApps}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.lg,
              cursor: 'pointer',
              color: theme.colors.text.secondary,
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover;
              e.currentTarget.style.color = theme.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.colors.text.secondary;
            }}
            title="Computer"
          >
            <AppsIcon size={isMobile ? 20 : 22} />
          </button>
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
              <ChatGreeting userName={user?.displayName || user?.email?.split('@')[0]} />
              <EnhancedChatInput
                placeholder="Message..."
                onSend={handleSend}
                modelTier={modelTier}
                onChangeModelTier={onChangeModelTier}
                disabled={isAIProcessing}
                centered={true}
                isMobile={isMobile}
              />
            </div>
          </div>
        ) : (
          // Messages view with input at bottom - both aligned
          <>
            {/* Scrollable messages area */}
            <div style={{
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
                <ChatPanel
                  messages={chatMessages}
                  onFixBug={handleSend}
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
              <EnhancedChatInput
                placeholder="Message..."
                onSend={handleSend}
                modelTier={modelTier}
                onChangeModelTier={onChangeModelTier}
                disabled={isAIProcessing}
                centered={true}
                isMobile={isMobile}
              />
            </div>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Settings Panel */}
      <TabbedSettingsPanel />
    </div>
  );
};

export default ChatPage;
