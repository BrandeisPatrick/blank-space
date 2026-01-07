import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const ConversationContext = createContext();

// Generate unique ID
const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get title from conversation (first user message or default)
const getConversationTitle = (messages) => {
  if (!Array.isArray(messages)) return 'New conversation';
  const firstUserMsg = messages.find(m => m.type === 'user' || m.role === 'user');
  if (firstUserMsg && firstUserMsg.content) {
    return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  }
  return 'New conversation';
};

export const ConversationProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const isAuthenticated = !!user;

  // Create initial state with matching IDs
  const initialState = useRef(() => {
    const id = generateId();
    return { id, conv: { id, messages: [], createdAt: Date.now() } };
  });
  const getInitial = () => {
    if (typeof initialState.current === 'function') {
      initialState.current = initialState.current();
    }
    return initialState.current;
  };

  // All conversations stored as array - always start fresh (no persistence for guests)
  const [conversations, setConversations] = useState(() => [getInitial().conv]);

  // Active conversation ID
  const [activeConversationId, setActiveConversationId] = useState(() => getInitial().id);

  // Ref to track activeConversationId for closures (Bug #11 fix)
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Loading state for Firestore operations
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Track local IDs that are currently being created in Firestore (to prevent duplicates)
  const creatingInFirestore = useRef(new Set());

  // Track failed syncs for retry (Bug #3 fix)
  const failedSyncs = useRef(new Map()); // Map<localId, { messages, retryCount }>

  // Fetch conversations from Firestore when authenticated
  useEffect(() => {
    if (isAuthenticated && !isSynced) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  // Sync active conversation messages to Firestore for authenticated users (debounced)
  // ONLY syncs existing Firestore conversations - createConversation handles new ones
  useEffect(() => {
    if (!isAuthenticated) return;

    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv || !activeConv.messages?.length) return;

    // Skip local IDs - they need to be created via createConversation first
    const isLocalId = activeConversationId?.startsWith('conv_');
    if (isLocalId) return;

    const timeoutId = setTimeout(async () => {
      try {
        const token = await getIdToken();
        console.log('[Sync] Updating conversation:', activeConversationId);
        const response = await fetch('/api/conversations', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            updates: { messages: activeConv.messages },
          }),
        });
        if (response.ok) {
          console.log('[Sync] Successfully synced to Firestore');
        } else {
          console.error('[Sync] Failed:', await response.text());
        }
      } catch (e) {
        console.error('Failed to sync conversation to Firestore:', e);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [conversations, activeConversationId, isAuthenticated, getIdToken]);

  // Bug #3 fix: Retry failed syncs periodically
  useEffect(() => {
    if (!isAuthenticated || failedSyncs.current.size === 0) return;

    const retryInterval = setInterval(async () => {
      const entries = Array.from(failedSyncs.current.entries());
      for (const [localId, { messages, retryCount }] of entries) {
        // Only retry up to 3 times
        if (retryCount >= 3) {
          console.log('[Retry] Max retries reached for:', localId);
          failedSyncs.current.delete(localId);
          continue;
        }

        // Check if conversation still exists locally
        const conv = conversations.find(c => c.id === localId);
        if (!conv) {
          failedSyncs.current.delete(localId);
          continue;
        }

        console.log('[Retry] Retrying sync for:', localId, `(attempt ${retryCount + 1})`);

        try {
          const token = await getIdToken();
          const title = messages[0]?.content?.slice(0, 50) || 'New conversation';
          const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, messages: conv.messages }),
          });

          if (response.ok) {
            const data = await response.json();
            const firestoreId = data.conversation.id;
            console.log('[Retry] Success! New ID:', firestoreId);
            failedSyncs.current.delete(localId);

            // Update local state with Firestore ID
            setConversations(prev => prev.map(c =>
              c.id === localId ? { ...c, id: firestoreId } : c
            ));
            if (activeConversationIdRef.current === localId) {
              setActiveConversationId(firestoreId);
            }
          }
        } catch (e) {
          console.error('[Retry] Failed:', e);
        }
      }
    }, 10000); // Retry every 10 seconds

    return () => clearInterval(retryInterval);
  }, [isAuthenticated, getIdToken, conversations]);

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
            messages: c.messages || [],
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

  // Helper to create conversation in Firestore (used by addMessage and setMessages)
  const createInFirestore = useCallback(async (localId, messages) => {
    // Bug #1 fix: Check BEFORE any state updates
    if (creatingInFirestore.current.has(localId)) {
      console.log('[Firestore] Skipping - conversation already being created:', localId);
      return null;
    }

    // Mark as creating immediately (synchronous lock)
    creatingInFirestore.current.add(localId);

    try {
      const token = await getIdToken();
      const title = messages[0]?.content?.slice(0, 50) || 'New conversation';

      console.log('[Firestore] Creating conversation for local ID:', localId);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, messages }),
      });

      if (response.ok) {
        const data = await response.json();
        const firestoreId = data.conversation.id;
        console.log('[Firestore] Created with ID:', firestoreId);

        // Bug #3 fix: Clear from failed syncs on success
        failedSyncs.current.delete(localId);

        return firestoreId;
      } else {
        const errorText = await response.text();
        console.error('[Firestore] Failed to create:', errorText);

        // Bug #3 fix: Track failed sync for retry
        const existing = failedSyncs.current.get(localId) || { retryCount: 0 };
        failedSyncs.current.set(localId, {
          messages,
          retryCount: existing.retryCount + 1,
        });

        return null;
      }
    } catch (e) {
      console.error('[Firestore] Error creating conversation:', e);

      // Bug #3 fix: Track failed sync for retry
      const existing = failedSyncs.current.get(localId) || { retryCount: 0 };
      failedSyncs.current.set(localId, {
        messages,
        retryCount: existing.retryCount + 1,
      });

      return null;
    } finally {
      creatingInFirestore.current.delete(localId);
    }
  }, [getIdToken]);

  // Add message to current conversation
  const addMessage = useCallback(async (message) => {
    const enrichedMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || Date.now(),
    };

    // Bug #11 fix: Use ref for current conversation ID
    const currentConvId = activeConversationIdRef.current;
    const isLocalId = currentConvId?.startsWith('conv_');

    // Bug #1 fix: Check for duplicate creation BEFORE state update
    const shouldCreateInFirestore = isAuthenticated && isLocalId && !creatingInFirestore.current.has(currentConvId);

    // Update local state immediately
    let allMessages = [];
    setConversations(prev => {
      const conv = prev.find(c => c.id === currentConvId);
      allMessages = [...(conv?.messages || []), enrichedMessage];
      return prev.map(c =>
        c.id === currentConvId
          ? { ...c, messages: allMessages, updatedAt: Date.now() }
          : c
      );
    });

    // Create in Firestore if needed
    if (shouldCreateInFirestore) {
      const firestoreId = await createInFirestore(currentConvId, allMessages);

      if (firestoreId) {
        // Bug #2 fix: Atomic update - batch ID replacement in single state update
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === currentConvId ? { ...c, id: firestoreId } : c
          );
          // Also update activeConversationId if it still matches
          if (activeConversationIdRef.current === currentConvId) {
            setActiveConversationId(firestoreId);
          }
          return updated;
        });
      }
    }
  }, [isAuthenticated, createInFirestore]);

  // Clear messages in current conversation
  const clearMessages = useCallback(async () => {
    const currentConvId = activeConversationIdRef.current;

    setConversations(prev => prev.map(conv =>
      conv.id === currentConvId
        ? { ...conv, messages: [], updatedAt: Date.now() }
        : conv
    ));

    // Only sync to Firestore if it's a real Firestore ID (not local)
    const isLocalId = currentConvId?.startsWith('conv_');
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
            conversationId: currentConvId,
            updates: { messages: [] },
          }),
        });
      } catch (e) {
        console.error('Failed to clear messages:', e);
      }
    }
  }, [isAuthenticated, getIdToken]);

  // Set all messages for current conversation (supports functional updates like setState)
  const setMessages = useCallback(async (newMessagesOrFn) => {
    // Bug #11 fix: Use ref for current conversation ID
    const currentConvId = activeConversationIdRef.current;
    const isLocalId = currentConvId?.startsWith('conv_');

    // Bug #1 fix: Check for duplicate creation BEFORE state update
    const shouldCreateInFirestore = isAuthenticated && isLocalId && !creatingInFirestore.current.has(currentConvId);

    let newMessages;
    setConversations(prev => {
      const conv = prev.find(c => c.id === currentConvId);
      const currentMessages = conv?.messages || [];

      // Support both direct value and functional update
      newMessages = typeof newMessagesOrFn === 'function'
        ? newMessagesOrFn(currentMessages)
        : newMessagesOrFn;

      return prev.map(c =>
        c.id === currentConvId
          ? { ...c, messages: newMessages, updatedAt: Date.now() }
          : c
      );
    });

    // Create in Firestore if needed
    if (shouldCreateInFirestore && newMessages?.length > 0) {
      const firestoreId = await createInFirestore(currentConvId, newMessages);

      if (firestoreId) {
        // Bug #2 fix: Atomic update - batch ID replacement
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === currentConvId ? { ...c, id: firestoreId } : c
          );
          if (activeConversationIdRef.current === currentConvId) {
            setActiveConversationId(firestoreId);
          }
          return updated;
        });
      }
    }
  }, [isAuthenticated, createInFirestore]);

  // Get full conversation object by ID
  const getConversation = useCallback((convId) => {
    return conversations.find(c => c.id === convId);
  }, [conversations]);

  // Create a new conversation (local only - Firestore creation happens when first message is added)
  const createConversation = useCallback(() => {
    const localId = generateId();
    const newConv = { id: localId, messages: [], createdAt: Date.now() };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(localId);
    console.log('[Create] Created local conversation:', localId);
    return localId;
  }, []);

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

