import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const ChatAppContext = createContext();

export const ChatAppProvider = ({ children }) => {
  // UI state for chat modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Chat messages
  const [messages, setMessages] = useState([]);
  // Selected model
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      isChatOpen,
      openChat,
      closeChat,
      messages,
      addMessage,
      clearMessages,
      selectedModel,
      setSelectedModel,
    }),
    [isChatOpen, openChat, closeChat, messages, addMessage, clearMessages, selectedModel]
  );

  return (
    <ChatAppContext.Provider value={value}>
      {children}
    </ChatAppContext.Provider>
  );
};

export const useChatApp = () => {
  const context = useContext(ChatAppContext);
  if (!context) {
    throw new Error('useChatApp must be used within a ChatAppProvider');
  }
  return context;
};
