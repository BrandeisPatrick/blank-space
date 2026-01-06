import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ConversationContext = createContext();

// SessionStorage key for guest users
const STORAGE_KEY = 'conversations_guest';

// Generate unique ID
const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get title from conversation (first user message or default)
const getConversationTitle = (messages) => {
  if (!Array.isArray(messages)) return 'New conversation';
  const firstUserMsg = messages.find(m => m.type === 'user' || m.role === 'user');
  if (firstUserMsg) {
    return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  }
  return 'New conversation';
};

export const ConversationProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const isAuthenticated = !!user;

  // All conversations stored as array
  const [conversations, setConversations] = useState(() => {
    if (typeof window === 'undefined') return [{ id: generateId(), messages: [], createdAt: Date.now() }];

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
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
    if (typeof window === 'undefined') return null;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return conversations[0]?.id;
  });

  // Loading state for Firestore operations
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Fetch conversations from Firestore when authenticated
  useEffect(() => {
    if (isAuthenticated && !isSynced) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  // Persist to sessionStorage for guests (debounced)
  useEffect(() => {
    if (!isAuthenticated) {
      const timeoutId = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        } catch (e) {
          console.error('Failed to save conversations:', e);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [conversations, isAuthenticated]);

  // Sync active conversation to Firestore for authenticated users (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;

    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv || !activeConv.messages?.length) return;

    const isLocalId = activeConversationId?.startsWith('conv_');

    const timeoutId = setTimeout(async () => {
      try {
        const token = await getIdToken();
        let convIdToSync = activeConversationId;

        // If local ID, create conversation in Firestore first
        if (isLocalId) {
          console.log('[Sync] Creating conversation in Firestore first...');
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: activeConv.messages[0]?.content?.slice(0, 50) || 'New conversation',
              messages: activeConv.messages,
            }),
          });

          if (createResponse.ok) {
            const data = await createResponse.json();
            convIdToSync = data.conversation.id;
            console.log('[Sync] Created conversation with ID:', convIdToSync);

            // Update local state with Firestore ID
            setConversations(prev => prev.map(c =>
              c.id === activeConversationId ? { ...c, id: convIdToSync } : c
            ));
            setActiveConversationId(convIdToSync);
          } else {
            console.error('[Sync] Failed to create:', await createResponse.text());
            return;
          }
        } else {
          // Existing Firestore conversation, just update messages
          console.log('[Sync] Updating conversation:', convIdToSync);
          const response = await fetch('/api/conversations', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              conversationId: convIdToSync,
              updates: { messages: activeConv.messages },
            }),
          });
          if (response.ok) {
            console.log('[Sync] Successfully synced to Firestore');
          } else {
            console.error('[Sync] Failed:', await response.text());
          }
        }
      } catch (e) {
        console.error('Failed to sync conversation to Firestore:', e);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [conversations, activeConversationId, isAuthenticated, getIdToken]);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          // Convert API format to internal format
          const convs = data.conversations.map(c => ({
            id: c.id,
            title: c.title,
            messages: [], // Messages loaded on demand
            messageCount: c.messageCount,
            artifactId: c.artifactId,
            createdAt: new Date(c.createdAt).getTime(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : null,
          }));
          setConversations(convs);
          setActiveConversationId(convs[0].id);
        } else {
          // No conversations, create a new one
          const newConv = { id: generateId(), messages: [], createdAt: Date.now() };
          setConversations([newConv]);
          setActiveConversationId(newConv.id);
        }
        setIsSynced(true);
      }
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getIdToken]);

  // Get current conversation's messages
  const messages = useMemo(() => {
    const conv = conversations.find(c => c.id === activeConversationId);
    return conv?.messages || [];
  }, [conversations, activeConversationId]);

  // Add message to current conversation
  const addMessage = useCallback((message) => {
    const enrichedMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || Date.now(),
    };

    // Update local state immediately
    // Firestore sync is handled by the debounced effect above
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [...conv.messages, enrichedMessage], updatedAt: Date.now() }
        : conv
    ));
  }, [activeConversationId]);

  // Clear messages in current conversation
  const clearMessages = useCallback(async () => {
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [], updatedAt: Date.now() }
        : conv
    ));

    // Only sync to Firestore if it's a real Firestore ID (not local)
    const isLocalId = activeConversationId?.startsWith('conv_');
    if (isAuthenticated && !isLocalId) {
      try {
        const token = await getIdToken();
        await fetch('/api/conversations', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            updates: { messages: [] },
          }),
        });
      } catch (e) {
        console.error('Failed to clear messages:', e);
      }
    }
  }, [activeConversationId, isAuthenticated, getIdToken]);

  // Set all messages for current conversation (supports functional updates like setState)
  const setMessages = useCallback((newMessagesOrFn) => {
    setConversations(prev => {
      const conv = prev.find(c => c.id === activeConversationId);
      const currentMessages = conv?.messages || [];

      // Support both direct value and functional update
      const newMessages = typeof newMessagesOrFn === 'function'
        ? newMessagesOrFn(currentMessages)
        : newMessagesOrFn;

      return prev.map(c =>
        c.id === activeConversationId
          ? { ...c, messages: newMessages, updatedAt: Date.now() }
          : c
      );
    });
    // Note: Firestore sync is debounced via the sessionStorage effect
    // For real-time sync, we'd need to track and sync here
  }, [activeConversationId]);

  // Get full conversation object by ID
  const getConversation = useCallback((convId) => {
    return conversations.find(c => c.id === convId);
  }, [conversations]);

  // Create a new conversation
  const createConversation = useCallback(async () => {
    const localId = generateId();
    const newConv = { id: localId, messages: [], createdAt: Date.now() };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(localId);

    if (isAuthenticated) {
      try {
        console.log('[Create] Creating conversation in Firestore...');
        const token = await getIdToken();
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: 'New conversation' }),
        });

        if (response.ok) {
          const data = await response.json();
          const firestoreId = data.conversation.id;
          console.log('[Create] Got Firestore ID:', firestoreId);
          // Update with server-generated ID
          setConversations(prev => prev.map(c =>
            c.id === localId ? { ...c, id: firestoreId } : c
          ));
          setActiveConversationId(firestoreId);
          return firestoreId;
        }
      } catch (e) {
        console.error('Failed to create conversation:', e);
      }
    }

    return localId;
  }, [isAuthenticated, getIdToken]);

  // Switch to a different conversation
  const switchConversation = useCallback((convId) => {
    setActiveConversationId(convId);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (convId) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== convId);
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

    if (isAuthenticated) {
      try {
        const token = await getIdToken();
        await fetch(`/api/conversations?id=${convId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error('Failed to delete conversation:', e);
      }
    }
  }, [activeConversationId, isAuthenticated, getIdToken]);

  // Link conversation to artifact
  const linkArtifact = useCallback(async (artifactId) => {
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, artifactId, updatedAt: Date.now() }
        : conv
    ));

    if (isAuthenticated) {
      try {
        const token = await getIdToken();
        await fetch('/api/conversations', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            updates: { artifactId },
          }),
        });
      } catch (e) {
        console.error('Failed to link artifact:', e);
      }
    }
  }, [activeConversationId, isAuthenticated, getIdToken]);

  // Get conversation list with titles
  const conversationList = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title || getConversationTitle(conv.messages),
      messageCount: conv.messages?.length ?? 0,
      artifactId: conv.artifactId || null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }, [conversations]);

  const value = useMemo(
    () => ({
      // Messages for current conversation
      messages,
      addMessage,
      clearMessages,
      setMessages,
      // Conversation management
      conversations: conversationList,
      activeConversationId,
      createConversation,
      switchConversation,
      deleteConversation,
      getConversation,
      linkArtifact,
      // Loading state
      isLoading,
      isSynced,
      // Refresh
      refresh: fetchConversations,
    }),
    [messages, addMessage, clearMessages, setMessages, conversationList, activeConversationId, createConversation, switchConversation, deleteConversation, getConversation, linkArtifact, isLoading, isSynced, fetchConversations]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

