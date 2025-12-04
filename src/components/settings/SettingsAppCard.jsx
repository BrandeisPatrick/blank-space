import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SIZES } from '../../constants';

// Gear icon component
const GearIcon = ({ size = 48, color = '#6B7280' }) => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const SettingsAppCard = () => {
  const { mode } = useTheme();
  const { openSettings } = useSettings();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      onClick={openSettings}
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
        <GearIcon size={isMobile ? SIZES.APP_CARD.ICON.mobile : SIZES.APP_CARD.ICON.desktop} color={mode === 'dark' ? '#ffffff' : '#6B7280'} />
      </div>

      {/* Settings Label */}
      <div style={{
        fontSize: theme.typography.fontSize[isMobile ? SIZES.APP_CARD.FONT_SIZE.mobile : SIZES.APP_CARD.FONT_SIZE.desktop],
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '-0.01em',
        color: theme.colors.text.primary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.tight,
      }}>
        Settings
      </div>
    </div>
  );
};

export default SettingsAppCard;
