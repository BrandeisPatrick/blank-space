import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
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
        padding: theme.spacing.md,
        cursor: 'pointer',
        transition: `transform ${theme.animation.fast}`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        width: '100%',
      }}
    >
      {/* App Icon - Mobile App Style */}
      <div style={{
        width: `${isMobile ? SIZES.APP_CARD.ICON_CONTAINER.mobile : SIZES.APP_CARD.ICON_CONTAINER.desktop}px`,
        height: `${isMobile ? SIZES.APP_CARD.ICON_CONTAINER.mobile : SIZES.APP_CARD.ICON_CONTAINER.desktop}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F9F8F5 0%, #E8E4F3 100%)',
        borderRadius: theme.radius['2.5xl'],
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: isHovered
          ? '0 8px 16px rgba(0, 0, 0, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.08)',
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
