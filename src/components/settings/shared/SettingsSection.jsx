import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';

/**
 * SettingsSection - A section header for grouping related settings
 *
 * @param {string} title - Section title
 * @param {React.ReactNode} children - Section content
 */
export const SettingsSection = ({ title, children }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div style={{ marginBottom: theme.spacing.xl }}>
      {title && (
        <h3 style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily.sans,
          margin: 0,
          marginBottom: theme.spacing.md,
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default SettingsSection;
