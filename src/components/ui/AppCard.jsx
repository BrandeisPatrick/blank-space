import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SIZES } from '../../constants';

/**
 * Reusable App Card component for the landing page grid
 * Used by ArtifactCard, SettingsAppCard, and ChatAppCard
 */
export const AppCard = ({
  icon: IconComponent,
  iconColor,
  label,
  onClick,
  multiLineLabel = false, // For artifact names that may be longer
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const iconContainerSize = isMobile
    ? SIZES.APP_CARD.ICON_CONTAINER.mobile
    : SIZES.APP_CARD.ICON_CONTAINER.desktop;

  const iconSize = isMobile
    ? SIZES.APP_CARD.ICON.mobile
    : SIZES.APP_CARD.ICON.desktop;

  const fontSize = theme.typography.fontSize[
    isMobile ? SIZES.APP_CARD.FONT_SIZE.mobile : SIZES.APP_CARD.FONT_SIZE.desktop
  ];

  return (
    <div
      onClick={onClick}
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
        width: `${iconContainerSize}px`,
        height: `${iconContainerSize}px`,
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
        <IconComponent size={iconSize} color={iconColor} />
      </div>

      {/* Label */}
      <div style={{
        fontSize,
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '-0.01em',
        color: theme.colors.text.primary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.tight,
        ...(multiLineLabel && {
          wordBreak: 'break-word',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }),
      }}>
        {label}
      </div>
    </div>
  );
};

export default AppCard;
