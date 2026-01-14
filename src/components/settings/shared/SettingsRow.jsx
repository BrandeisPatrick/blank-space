import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';

/**
 * SettingsRow - A reusable row component for settings items
 *
 * @param {string} title - The main title/label
 * @param {string} description - Optional description text below title
 * @param {React.ReactNode} action - Action element (button, toggle, etc.) on the right
 * @param {React.ReactNode} icon - Optional icon on the left
 */
export const SettingsRow = ({ title, description, action, icon }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${theme.spacing.lg} 0`,
      gap: theme.spacing.lg,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
        minWidth: 0,
      }}>
        {icon && (
          <div style={{
            flexShrink: 0,
            color: theme.colors.text.secondary,
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            {title}
          </div>
          {description && (
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fontFamily.sans,
              marginTop: theme.spacing.xs,
              lineHeight: 1.4,
            }}>
              {description}
            </div>
          )}
        </div>
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default SettingsRow;
