import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme, themes as themeConfigs } from '../../../styles/theme';
import { SettingsSection, SettingsSeparator } from '../shared';

const SELECTION_COLOR = '#3B82F6';

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

const MoonIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const ThemeTab = () => {
  const { mode, setMode } = useTheme();
  const theme = getTheme(mode);

  const lightTheme = themeConfigs.light;
  const darkTheme = themeConfigs.dark;

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon, bg: lightTheme.bg.primary, border: lightTheme.border, textColor: lightTheme.text.primary },
    { id: 'dark', name: 'Dark', icon: MoonIcon, bg: darkTheme.bg.primary, border: darkTheme.border, textColor: darkTheme.text.primary },
  ];

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      <SettingsSection title="Appearance">
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
        }}>
          {themes.map(({ id, name, icon: Icon, bg, border, textColor }) => {
            const isSelected = mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.lg,
                  background: 'transparent',
                  border: isSelected
                    ? `2px solid ${SELECTION_COLOR}`
                    : `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: theme.radius.lg,
                  cursor: 'pointer',
                  transition: `all ${theme.animation.fast}`,
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={24} color={isSelected ? SELECTION_COLOR : theme.colors.text.secondary} />
                </div>
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: isSelected ? SELECTION_COLOR : theme.colors.text.primary,
                }}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};

export default ThemeTab;
