import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { getTheme } from '../../../styles/theme';
import { COLOR_PALETTES } from '../../../services/stylePresets/colorPalettes';
import { UI_STYLES } from '../../../services/stylePresets/uiStyles';
import { SettingsSection, SettingsSeparator } from '../shared';

const SELECTION_COLOR = '#3B82F6';

const PaletteIcon = ({ size = 20, color = '#6B7280' }) => (
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
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="2" fill={color} />
    <circle cx="8" cy="14" r="2" fill={color} />
    <circle cx="16" cy="14" r="2" fill={color} />
  </svg>
);

export const AIPreferenceTab = () => {
  const { mode } = useTheme();
  const { aiColorPalette, setAIColorPalette, aiUIStyle, setAIUIStyle } = useSettings();
  const theme = getTheme(mode);

  const borderColor = mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      {/* Color Palette Section */}
      <SettingsSection title="Color Palette">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: theme.spacing.sm,
        }}>
          {Object.entries(COLOR_PALETTES).map(([key, palette]) => {
            const isSelected = aiColorPalette === key;
            return (
              <button
                key={key}
                onClick={() => setAIColorPalette(key)}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  border: isSelected ? `2px solid ${SELECTION_COLOR}` : `1px solid ${borderColor}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  transition: `all ${theme.animation.fast}`,
                }}
              >
                {palette.preview ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {palette.preview.map((color, i) => (
                      <div key={i} style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: color,
                        border: `1px solid ${borderColor}`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <PaletteIcon size={20} color={isSelected ? SELECTION_COLOR : theme.colors.text.secondary} />
                )}
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: isSelected ? SELECTION_COLOR : theme.colors.text.primary,
                  whiteSpace: 'nowrap',
                }}>
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSeparator />

      {/* UI Style Section */}
      <SettingsSection title="UI Style">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: theme.spacing.sm,
        }}>
          {Object.entries(UI_STYLES).map(([key, style]) => {
            const isSelected = aiUIStyle === key;
            return (
              <button
                key={key}
                onClick={() => setAIUIStyle(key)}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  border: isSelected ? `2px solid ${SELECTION_COLOR}` : `1px solid ${borderColor}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: `all ${theme.animation.fast}`,
                }}
              >
                <div style={{
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: isSelected ? SELECTION_COLOR : theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                }}>
                  {style.name}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: theme.colors.text.secondary,
                  lineHeight: 1.4,
                }}>
                  {style.description}
                </div>
              </button>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};

export default AIPreferenceTab;
