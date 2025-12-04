import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChatApp } from '../../contexts/ChatAppContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SIZES } from '../../constants';

// Chat bubble icon component
const ChatIcon = ({ size = 48, color = '#6B7280' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChatAppCard = () => {
  const { mode } = useTheme();
  const { openChat } = useChatApp();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      onClick={openChat}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: isMobile ? theme.spacing.sm : theme.spacing.md,
        cursor: 'pointer',
        transition: `transform ${theme.animation.fast}`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* App Icon - Liquid Glass Style */}
      <div style={{
        width: `${isMobile ? SIZES.APP_CARD.ICON_CONTAINER.mobile : SIZES.APP_CARD.ICON_CONTAINER.desktop}px`,
        height: `${isMobile ? SIZES.APP_CARD.ICON_CONTAINER.mobile : SIZES.APP_CARD.ICON_CONTAINER.desktop}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...createGlassEffect(theme),
        background: mode === 'dark'
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(255, 255, 255, 0.65)',
        borderRadius: theme.radius['2.5xl'],
        boxShadow: isHovered
          ? '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        transition: `all ${theme.animation.fast}`,
      }}>
        <ChatIcon size={isMobile ? SIZES.APP_CARD.ICON.mobile : SIZES.APP_CARD.ICON.desktop} color={mode === 'dark' ? '#ffffff' : '#6B7280'} />
      </div>

      {/* Chat Label */}
      <div style={{
        fontSize: theme.typography.fontSize[isMobile ? SIZES.APP_CARD.FONT_SIZE.mobile : SIZES.APP_CARD.FONT_SIZE.desktop],
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '-0.01em',
        color: theme.colors.text.primary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.tight,
      }}>
        Chat
      </div>
    </div>
  );
};

export default ChatAppCard;
