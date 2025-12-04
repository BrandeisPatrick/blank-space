import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../contexts/AppStoreContext';
import { AppCard } from '../ui/AppCard';
import { AppStoreIcon } from '../icons';

export const AppStoreAppCard = () => {
  const { mode } = useTheme();
  const { openAppStore } = useAppStore();

  const iconColor = mode === 'dark' ? '#ffffff' : '#6B7280';

  return (
    <AppCard
      icon={AppStoreIcon}
      iconColor={iconColor}
      label="AppStore"
      onClick={openAppStore}
    />
  );
};

export default AppStoreAppCard;
