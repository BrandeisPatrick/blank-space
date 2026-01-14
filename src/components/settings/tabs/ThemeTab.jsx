import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';
import { SettingsSection } from '../shared';

const SunIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Center sun body */}
    <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.2" />
    <circle cx="12" cy="12" r="4" />
    {/* Rays with dots at ends */}
    <line x1="12" y1="1" x2="12" y2="4" />
    <circle cx="12" cy="1" r="1" fill={color} />
    <line x1="12" y1="20" x2="12" y2="23" />
    <circle cx="12" cy="23" r="1" fill={color} />
    <line x1="4" y1="12" x2="1" y2="12" />
    <circle cx="1" cy="12" r="1" fill={color} />
    <line x1="20" y1="12" x2="23" y2="12" />
    <circle cx="23" cy="12" r="1" fill={color} />
    {/* Diagonal rays with dots */}
    <line x1="5.6" y1="5.6" x2="3.5" y2="3.5" />
    <circle cx="3.5" cy="3.5" r="1" fill={color} />
    <line x1="18.4" y1="18.4" x2="20.5" y2="20.5" />
    <circle cx="20.5" cy="20.5" r="1" fill={color} />
    <line x1="5.6" y1="18.4" x2="3.5" y2="20.5" />
    <circle cx="3.5" cy="20.5" r="1" fill={color} />
    <line x1="18.4" y1="5.6" x2="20.5" y2="3.5" />
    <circle cx="20.5" cy="3.5" r="1" fill={color} />
  </svg>
);

const MoonIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Crescent moon */}
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} fillOpacity="0.2" />
    {/* Stars */}
    <circle cx="19" cy="5" r="0.8" fill={color} />
    <circle cx="21" cy="9" r="0.5" fill={color} />
    <circle cx="17" cy="3" r="0.5" fill={color} />
  </svg>
);

export const ThemeTab = () => {
  const { mode, setMode } = useTheme();
  const theme = getTheme(mode);

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon },
    { id: 'dark', name: 'Dark', icon: MoonIcon },
  ];

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
  };

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      <SettingsSection title="Appearance">
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          {themes.map(({ id, name, icon: Icon }) => {
            const isSelected = mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 48px',
                  background: isSelected
                    ? (mode === 'dark' ? '#2a2a2a' : '#e5e5e5')
                    : 'transparent',
                  border: isSelected
                    ? `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                    : `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: `all ${theme.animation.fast}`,
                }}
              >
                <Icon
                  size={20}
                  color={isSelected ? colors.textPrimary : colors.textSecondary}
                />
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
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
