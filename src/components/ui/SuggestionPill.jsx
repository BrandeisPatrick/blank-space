import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const SuggestionPill = ({ text, onClick }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        background: isHovered ? theme.colors.bg.tertiary : theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.bg.border}`,
        borderRadius: theme.radius.xl,
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        cursor: 'pointer',
        transition: `all ${theme.animation.fast}`,
        boxShadow: theme.shadows.outset,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </button>
  );
};
