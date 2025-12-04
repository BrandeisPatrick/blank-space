import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { getIconById, getIconColorById } from './IconPicker';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SIZES } from '../../constants';

export const ArtifactCard = ({ artifact, onSelect }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  // Get the icon component and color based on artifact's icon category
  const IconComponent = getIconById(artifact?.icon || 'app');
  const iconColor = getIconColorById(artifact?.icon || 'app');

  return (
    <div
      onClick={() => onSelect(artifact.id)}
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
        <IconComponent size={isMobile ? SIZES.APP_CARD.ICON.mobile : SIZES.APP_CARD.ICON.desktop} color={iconColor} />
      </div>

      {/* Artifact Name */}
      <div style={{
        fontSize: theme.typography.fontSize[isMobile ? SIZES.APP_CARD.FONT_SIZE.mobile : SIZES.APP_CARD.FONT_SIZE.desktop],
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '-0.01em',
        color: theme.colors.text.primary,
        textAlign: 'center',
        wordBreak: 'break-word',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        lineHeight: theme.typography.lineHeight.tight,
      }}>
        {artifact.name}
      </div>
    </div>
  );
};
