import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const ThemeToggle = () => {
  const { mode, toggleTheme } = useTheme();
  const theme = getTheme(mode);

  const buttonStyle = {
    background: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.border}`,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.sans,
    transition: `opacity ${theme.animation.fast}`,
    opacity: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  return (
    <button
      onClick={toggleTheme}
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
