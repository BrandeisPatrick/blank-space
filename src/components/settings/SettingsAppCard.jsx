import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { AppCard } from '../ui/AppCard';
import { SettingsIcon } from '../icons';

export const SettingsAppCard = () => {
  const { mode } = useTheme();
  const { openSettings } = useSettings();

  const iconColor = mode === 'dark' ? '#ffffff' : '#6B7280';

  return (
    <AppCard
      icon={SettingsIcon}
      iconColor={iconColor}
      label="Settings"
      onClick={openSettings}
    />
  );
};

export default SettingsAppCard;
