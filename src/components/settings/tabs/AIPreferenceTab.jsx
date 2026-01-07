import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { getTheme } from '../../../styles/theme';
import { COLOR_PALETTES } from '../../../services/stylePresets/colorPalettes';
import { UI_STYLES } from '../../../services/stylePresets/uiStyles';

// Palette icon for color palette options
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

  return (
    <>
      {/* Color Palette */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          Color Palette
        </label>
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
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.lg,
                  border: isSelected
                    ? '2px solid #3B82F6'
                    : mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  transition: `all ${theme.animation.fast}`,
                  boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                }}
              >
                {/* Color preview */}
                {palette.preview ? (
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {palette.preview.map((color, i) => (
                      <div key={i} style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: color,
                        border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                      }} />
                    ))}
                  </div>
                ) : (
                  <PaletteIcon size={18} color={isSelected ? '#3B82F6' : theme.colors.text.secondary} />
                )}
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: isSelected ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
                  color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                  whiteSpace: 'nowrap',
                }}>
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* UI Style */}
      <div>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          UI Style
        </label>
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
                  border: isSelected
                    ? '2px solid #3B82F6'
                    : mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: `all ${theme.animation.fast}`,
                  boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                }}
              >
                <div style={{
                  fontWeight: theme.typography.fontWeight.medium,
                  color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  marginBottom: '2px',
                }}>
                  {style.name}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  lineHeight: 1.3,
                }}>
                  {style.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AIPreferenceTab;
