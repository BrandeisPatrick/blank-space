import { useTheme } from '../../contexts/ThemeContext';
import { useChatApp } from '../../contexts/ChatAppContext';
import { AppCard } from '../ui/AppCard';
import { MessageCircleIcon } from '../icons';

export const ChatAppCard = () => {
  const { mode } = useTheme();
  const { openChat } = useChatApp();

  const iconColor = mode === 'dark' ? '#ffffff' : '#6B7280';

  return (
    <AppCard
      icon={MessageCircleIcon}
      iconColor={iconColor}
      label="Chat"
      onClick={openChat}
    />
  );
};

export default ChatAppCard;
