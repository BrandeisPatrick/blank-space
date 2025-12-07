import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../contexts/AppStoreContext';
import { AppCard } from '../ui/AppCard';
import { AppStoreIcon } from '../icons';
import { useLongPress } from '../../hooks/useLongPress';

export const AppStoreAppCard = ({ isEditMode = false, onEnterEditMode }) => {
  const { mode } = useTheme();
  const { openAppStore } = useAppStore();

  const iconColor = mode === 'dark' ? '#ffffff' : '#6B7280';

  // Long press handler to enter edit mode
  const longPressHandlers = useLongPress(
    () => {
      onEnterEditMode?.();
    },
    {
      delay: 500,
      onClick: () => {
        // Only open app store if not in edit mode
        if (!isEditMode) {
          openAppStore();
        }
      },
    }
  );

  return (
    <AppCard
      icon={AppStoreIcon}
      iconColor={iconColor}
      label="AppStore"
      isEditMode={isEditMode}
      longPressHandlers={longPressHandlers}
    />
  );
};

export default AppStoreAppCard;
