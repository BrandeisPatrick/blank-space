import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../styles/theme';

/**
 * SettingsSeparator - A thin separator line between settings sections
 */
export const SettingsSeparator = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div style={{
      height: '1px',
      background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      margin: `${theme.spacing.sm} 0`,
    }} />
  );
};

export default SettingsSeparator;
