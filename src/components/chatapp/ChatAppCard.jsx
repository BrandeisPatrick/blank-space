import { useTheme } from '../../contexts/ThemeContext';
import { useChatApp } from '../../contexts/ChatAppContext';
import { AppCard } from '../ui/AppCard';
import { MessageCircleIcon } from '../icons';
import { useLongPress } from '../../hooks/useLongPress';

export const ChatAppCard = ({ isEditMode = false, onEnterEditMode }) => {
  const { mode } = useTheme();
  const { openChat } = useChatApp();

  const iconColor = mode === 'dark' ? '#ffffff' : '#6B7280';

  // Long press handler to enter edit mode
  const longPressHandlers = useLongPress(
    () => {
      onEnterEditMode?.();
    },
    {
      delay: 500,
      onClick: () => {
        // Only open chat if not in edit mode
        if (!isEditMode) {
          openChat();
        }
      },
    }
  );

  return (
    <AppCard
      icon={MessageCircleIcon}
      iconColor={iconColor}
      label="Chat"
      isEditMode={isEditMode}
      longPressHandlers={longPressHandlers}
    />
  );
};

export default ChatAppCard;
