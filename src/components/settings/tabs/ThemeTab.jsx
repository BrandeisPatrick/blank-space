import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme, themes as themeConfigs } from '../../../styles/theme';

// Selection accent color (consistent across themes)
const SELECTION_COLOR = '#3B82F6';

// Sun icon for light mode
const SunIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const ThemeTab = () => {
  const { mode, setMode } = useTheme();
  const theme = getTheme(mode);

  // Get actual theme colors for accurate preview
  const lightTheme = themeConfigs.light;
  const darkTheme = themeConfigs.dark;

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon, bg: lightTheme.bg.primary, border: lightTheme.border, textColor: lightTheme.text.primary },
    { id: 'dark', name: 'Dark', icon: MoonIcon, bg: darkTheme.bg.primary, border: darkTheme.border, textColor: darkTheme.text.primary },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: theme.spacing.md,
      }}>
        {themes.map(({ id, name, icon: Icon, bg, border, textColor }) => {
          const isSelected = mode === id;
          return (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
                background: 'transparent',
                border: 'none',
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
                transition: `all ${theme.animation.fast}`,
              }}
            >
              {/* Theme preview */}
              <div style={{
                width: '100%',
                aspectRatio: '16 / 10',
                borderRadius: theme.radius.md,
                background: bg,
                border: isSelected
                  ? `2px solid ${SELECTION_COLOR}`
                  : `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${theme.animation.fast}`,
                boxShadow: isSelected
                  ? `0 0 0 2px ${SELECTION_COLOR}33`
                  : 'none',
              }}>
                <Icon size={32} color={textColor} />
              </div>

              {/* Name */}
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                color: isSelected ? SELECTION_COLOR : theme.colors.text.primary,
              }}>
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeTab;
