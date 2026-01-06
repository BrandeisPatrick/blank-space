import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';
import { ChatSidebar } from '../chat/ChatSidebar';
import { ChatGreeting } from '../chat/ChatGreeting';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';
import { ChatPanel } from '../chat/ChatPanel';
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
  const theme = getTheme(mode);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const isMobile = useIsMobile();

  const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

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
      {isMobile && sidebarVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
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
        {/* Top Right Apps Button */}
        <div style={{
          position: 'absolute',
          top: theme.spacing.lg,
          right: theme.spacing.lg,
          zIndex: 10,
        }}>
          <button
            onClick={handleGoToApps}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
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
            title="Apps"
          >
            <AppsIcon size={22} />
          </button>
        </div>

        {/* Chat Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: hasMessages ? 'flex-start' : 'center',
          padding: hasMessages ? 0 : theme.spacing['3xl'],
          paddingBottom: hasMessages ? '140px' : 0, // Space for fixed input only when messages exist
          overflow: 'auto',
        }}>
          {!hasMessages ? (
            // Empty state: Greeting + Category Pills + Input (all centered)
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: theme.spacing.xl,
              maxWidth: '700px',
              width: '100%',
              padding: `0 ${theme.spacing.lg}`,
            }}>
              <ChatGreeting userName={user?.displayName || user?.email?.split('@')[0]} />
              <EnhancedChatInput
                placeholder="Message..."
                onSend={handleSend}
                modelTier={modelTier}
                onChangeModelTier={onChangeModelTier}
                disabled={isAIProcessing}
                centered={true}
              />
            </div>
          ) : (
            // Messages view
            <div style={{
              width: '100%',
              maxWidth: '800px',
              padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
            }}>
              <ChatPanel
                messages={chatMessages}
                onFixBug={handleSend}
              />
            </div>
          )}
        </div>

        {/* Chat Input - Fixed at bottom only when there are messages */}
        {hasMessages && (
          <EnhancedChatInput
            placeholder="Message..."
            onSend={handleSend}
            modelTier={modelTier}
            onChangeModelTier={onChangeModelTier}
            disabled={isAIProcessing}
            centered={false}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
