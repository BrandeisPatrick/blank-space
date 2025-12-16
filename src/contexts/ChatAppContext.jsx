import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

const ChatAppContext = createContext();

// LocalStorage key for persisting conversations
const STORAGE_KEY = 'chatapp_conversations';

// Generate unique ID
const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get title from conversation (first user message or default)
const getConversationTitle = (messages) => {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  }
  return 'New conversation';
};

export const ChatAppProvider = ({ children }) => {
  // UI state for chat modal
  const [isChatOpen, setIsChatOpen] = useState(false);

  // All conversations stored as array
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : [{ id: generateId(), messages: [], createdAt: Date.now() }];
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
    return [{ id: generateId(), messages: [], createdAt: Date.now() }];
  });

  // Active conversation ID
  const [activeConversationId, setActiveConversationId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return conversations[0]?.id;
  });

  // Selected model
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini');

  // Persist conversations to localStorage (debounced to prevent excessive writes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      } catch (e) {
        console.error('Failed to save conversations:', e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [conversations]);

  // Get current conversation's messages
  const messages = useMemo(() => {
    const conv = conversations.find(c => c.id === activeConversationId);
    return conv?.messages || [];
  }, [conversations, activeConversationId]);

  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);

  const addMessage = useCallback((message) => {
    // Ensure every message has a unique ID and timestamp
    const enrichedMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || Date.now(),
    };

    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [...conv.messages, enrichedMessage], updatedAt: Date.now() }
        : conv
    ));
  }, [activeConversationId]);

  const clearMessages = useCallback(() => {
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [], updatedAt: Date.now() }
        : conv
    ));
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = useCallback(() => {
    const newConv = { id: generateId(), messages: [], createdAt: Date.now() };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, []);

  // Switch to a different conversation
  const switchConversation = useCallback((convId) => {
    setActiveConversationId(convId);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((convId) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== convId);
      // If we deleted the active conversation, switch to another or create new
      if (convId === activeConversationId) {
        if (filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else {
          const newConv = { id: generateId(), messages: [], createdAt: Date.now() };
          setActiveConversationId(newConv.id);
          return [newConv];
        }
      }
      return filtered;
    });
  }, [activeConversationId]);

  // Get conversation list with titles
  const conversationList = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: getConversationTitle(conv.messages),
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }, [conversations]);

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
      // Conversation management
      conversations: conversationList,
      activeConversationId,
      createConversation,
      switchConversation,
      deleteConversation,
    }),
    [isChatOpen, openChat, closeChat, messages, addMessage, clearMessages, selectedModel, conversationList, activeConversationId, createConversation, switchConversation, deleteConversation]
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
