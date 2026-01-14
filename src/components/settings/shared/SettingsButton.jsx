import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';

/**
 * SettingsButton - A consistent outline button for settings actions
 *
 * @param {string} children - Button text
 * @param {function} onClick - Click handler
 * @param {string} variant - 'default' | 'danger' for different styles
 */
export const SettingsButton = ({ children, onClick, variant = 'default' }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);

  const isDanger = variant === 'danger';

  const borderColor = isDanger
    ? '#ef4444'
    : mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

  const hoverBg = isDanger
    ? 'rgba(239, 68, 68, 0.1)'
    : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  const textColor = isDanger
    ? '#ef4444'
    : theme.colors.text.primary;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        color: textColor,
        background: isHovered ? hoverBg : 'transparent',
        border: `1px solid ${borderColor}`,
        borderRadius: theme.radius.lg,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

export default SettingsButton;
