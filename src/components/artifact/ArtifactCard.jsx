import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { AppIcon } from '../icons/icons';

// Helper function to format relative time
const formatDate = (timestamp) => {
  const now = Date.now();
  const date = new Date(timestamp);
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
};

export const ArtifactCard = ({ artifact, onSelect }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);

  const fileCount = Object.keys(artifact.files).length;

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
        padding: theme.spacing.lg,
        background: isHovered ? theme.colors.bg.tertiary : theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.bg.border}`,
        borderRadius: theme.radius.lg,
        cursor: 'pointer',
        transition: `all ${theme.animation.fast}`,
        boxShadow: isHovered ? theme.shadows.glow : theme.shadows.outset,
        width: '100%',
      }}
    >
      {/* App Icon */}
      <div style={{
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.primary,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
      }}>
        <AppIcon size={48} color={theme.colors.text.secondary} />
      </div>

      {/* Artifact Name */}
      <div style={{
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        wordBreak: 'break-word',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {artifact.name}
      </div>

      {/* Meta Info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        width: '100%',
      }}>
        <div>{fileCount} {fileCount === 1 ? 'file' : 'files'}</div>
        <div>{formatDate(artifact.updatedAt)}</div>
      </div>
    </div>
  );
};
