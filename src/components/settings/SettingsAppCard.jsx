import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { AppCard } from '../ui/AppCard';
import { SettingsIcon } from '../icons';
import { useLongPress } from '../../hooks/useLongPress';

export const SettingsAppCard = ({ isEditMode = false, onEnterEditMode }) => {
  const { mode } = useTheme();
  const { openSettings } = useSettings();

  const iconColor = mode === 'dark' ? '#f9f9f9' : '#6B7280';

  // Long press handler to enter edit mode
  const longPressHandlers = useLongPress(
    () => {
      onEnterEditMode?.();
    },
    {
      delay: 500,
      onClick: () => {
        // Only open settings if not in edit mode
        if (!isEditMode) {
          openSettings();
        }
      },
    }
  );

  return (
    <AppCard
      icon={SettingsIcon}
      iconColor={iconColor}
      label="Settings"
      isEditMode={isEditMode}
      longPressHandlers={longPressHandlers}
    />
  );
};

export default SettingsAppCard;
