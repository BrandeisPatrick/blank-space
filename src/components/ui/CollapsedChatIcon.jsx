import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { Z_INDEX } from '../../constants';

// Chevron left icon (pointing left to indicate "pull out")
const ChevronLeftIcon = ({ size = 20, color = '#6B7280' }) => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const CollapsedChatIcon = ({ visible = false, onClick }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  if (!visible) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '100px',
        right: 0,
        width: '24px',
        height: '160px',
        borderRadius: `${theme.radius.lg} 0 0 ${theme.radius.lg}`,
        ...createGlassEffect(theme),
        border: 'none',
        borderRight: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: Z_INDEX.AI_RESPONSE_PANEL,
        transition: `all ${theme.animation.normal}`,
        boxShadow: mode === 'dark'
          ? '-2px 0 12px rgba(0, 0, 0, 0.3)'
          : '-2px 0 12px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.width = '32px';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.width = '24px';
      }}
    >
      <ChevronLeftIcon size={18} color={theme.colors.text.secondary} />
    </button>
  );
};

export default CollapsedChatIcon;
