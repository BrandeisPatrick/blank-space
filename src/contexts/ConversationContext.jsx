import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const ConversationContext = createContext();

// Constants
const LOCAL_CONVERSATION_PREFIX = 'conv_';
const DEFAULT_TITLE = 'New conversation';
const FETCH_TIMEOUT_MS = 10000;
const RETRY_INTERVAL_MS = 10000;
const MAX_RETRY_ATTEMPTS = 3;

// Generate unique ID
const generateId = () => `${LOCAL_CONVERSATION_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper: Check if ID is a local (not yet synced) conversation
const isLocalConversationId = (id) => id?.startsWith(LOCAL_CONVERSATION_PREFIX);

// Helper: Extract title from messages (supports variable max length)
const extractTitle = (messages, maxLength = 50) => {
  if (!Array.isArray(messages) || messages.length === 0) return DEFAULT_TITLE;
  const firstUserMsg = messages.find(m => m.type === 'user' || m.role === 'user');
  if (firstUserMsg?.content) {
    return firstUserMsg.content.slice(0, maxLength) +
      (firstUserMsg.content.length > maxLength ? '...' : '');
  }
  return DEFAULT_TITLE;
};

// Helper: Create auth headers
const createAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// Helper: Fetch with timeout
const fetchWithTimeout = async (url, options, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  }
};

// Create initial conversation
const createInitialConversation = () => {
  const id = generateId();
  return { id, messages: [], createdAt: Date.now() };
};

export const ConversationProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const isAuthenticated = !!user;

  // Create initial conversation once
  const [initialConv] = useState(createInitialConversation);

  // All conversations stored as array - always start fresh (no persistence for guests)
  const [conversations, setConversations] = useState(() => [initialConv]);

  // Active conversation ID
  const [activeConversationId, setActiveConversationId] = useState(() => initialConv.id);

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

  // Track previous auth state to detect sign out
  const wasAuthenticatedRef = useRef(isAuthenticated);

  // Fetch conversations when signing in, reset when signing out
  useEffect(() => {
    const wasAuthenticated = wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = isAuthenticated;

    if (isAuthenticated && !isSynced) {
      // User signed in - fetch their conversations
      fetchConversations();
    } else if (wasAuthenticated && !isAuthenticated) {
      // User signed out - reset to fresh state
      console.log('[Auth] User signed out - clearing conversations');
      const newConv = createInitialConversation();
      setConversations([newConv]);
      setActiveConversationId(newConv.id);
      setIsSynced(false);
      // Clear any pending syncs
      failedSyncs.current.clear();
      creatingInFirestore.current.clear();
    }
  }, [isAuthenticated]);

  // Sync active conversation messages to Firestore for authenticated users (debounced)
  // ONLY syncs existing Firestore conversations - createConversation handles new ones
  useEffect(() => {
    if (!isAuthenticated) return;

    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv || !activeConv.messages?.length) return;

    // Skip local IDs - they need to be created via createConversation first
    if (isLocalConversationId(activeConversationId)) return;

    const timeoutId = setTimeout(async () => {
      try {
        const token = await getIdToken();
        console.log('[Sync] Updating conversation:', activeConversationId);
        const response = await fetchWithTimeout('/api/conversations', {
          method: 'PUT',
          headers: createAuthHeaders(token),
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
        console.error('Failed to sync conversation to Firestore:', e.message);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [conversations, activeConversationId, isAuthenticated, getIdToken]);

  // Ref to access conversations in retry effect without causing re-runs
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Bug #3 fix: Retry failed syncs periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const retryInterval = setInterval(async () => {
      if (failedSyncs.current.size === 0) return;

      const entries = Array.from(failedSyncs.current.entries());
      for (const [localId, { messages, retryCount }] of entries) {
        // Only retry up to MAX_RETRY_ATTEMPTS times
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          console.log('[Retry] Max retries reached for:', localId);
          failedSyncs.current.delete(localId);
          continue;
        }

        // Check if conversation still exists locally (use ref to avoid effect restart)
        const conv = conversationsRef.current.find(c => c.id === localId);
        if (!conv) {
          failedSyncs.current.delete(localId);
          continue;
        }

        console.log('[Retry] Retrying sync for:', localId, `(attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);

        // Increment retry count BEFORE attempting (prevents infinite retries on persistent failure)
        failedSyncs.current.set(localId, { messages, retryCount: retryCount + 1 });

        try {
          const token = await getIdToken();
          const title = extractTitle(conv.messages);
          const response = await fetchWithTimeout('/api/conversations', {
            method: 'POST',
            headers: createAuthHeaders(token),
            body: JSON.stringify({ title, messages: conv.messages }),
          });

          if (response.ok) {
            const data = await response.json();
            const firestoreId = data.conversation.id;
            console.log('[Retry] Success! New ID:', firestoreId);

            // Clean up refs for old ID
            failedSyncs.current.delete(localId);
            creatingInFirestore.current.delete(localId);

            // Update local state with Firestore ID
            setConversations(prev => prev.map(c =>
              c.id === localId ? { ...c, id: firestoreId } : c
            ));
            if (activeConversationIdRef.current === localId) {
              setActiveConversationId(firestoreId);
            }
          }
        } catch (e) {
          console.error('[Retry] Failed:', e.message);
        }
      }
    }, RETRY_INTERVAL_MS);

    return () => clearInterval(retryInterval);
  }, [isAuthenticated, getIdToken]);

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
        // Always create a fresh empty conversation for landing page
        const newConv = createInitialConversation();

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
          // Prepend new empty conversation, keep history accessible
          setConversations([newConv, ...convs]);
        } else {
          setConversations([newConv]);
        }
        setActiveConversationId(newConv.id);
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
      const title = extractTitle(messages);

      console.log('[Firestore] Creating conversation for local ID:', localId);
      const response = await fetchWithTimeout('/api/conversations', {
        method: 'POST',
        headers: createAuthHeaders(token),
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

        // Track failed sync for retry (retryCount=0, retry effect will increment)
        failedSyncs.current.set(localId, { messages, retryCount: 0 });

        return null;
      }
    } catch (e) {
      console.error('[Firestore] Error creating conversation:', e.message);

      // Track failed sync for retry (retryCount=0, retry effect will increment)
      failedSyncs.current.set(localId, { messages, retryCount: 0 });

      return null;
    } finally {
      creatingInFirestore.current.delete(localId);
    }
  }, [getIdToken]);

  // Helper to update conversation in Firestore (DRY helper for clearMessages, linkArtifact, etc.)
  const updateInFirestore = useCallback(async (conversationId, updates) => {
    if (!isAuthenticated || isLocalConversationId(conversationId)) return false;

    try {
      const token = await getIdToken();
      const response = await fetchWithTimeout('/api/conversations', {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify({ conversationId, updates }),
      });

      if (!response.ok) {
        console.error('[Update] Failed:', await response.text());
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Update] Error:', e.message);
      return false;
    }
  }, [isAuthenticated, getIdToken]);

  // Add message to current conversation
  const addMessage = useCallback(async (message) => {
    const enrichedMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || Date.now(),
    };

    // Bug #11 fix: Use ref for current conversation ID
    const currentConvId = activeConversationIdRef.current;

    // Bug #1 fix: Check for duplicate creation BEFORE state update
    const shouldCreateInFirestore = isAuthenticated && isLocalConversationId(currentConvId) && !creatingInFirestore.current.has(currentConvId);

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

    // Sync to Firestore
    await updateInFirestore(currentConvId, { messages: [] });
  }, [updateInFirestore]);

  // Set all messages for current conversation (supports functional updates like setState)
  const setMessages = useCallback(async (newMessagesOrFn) => {
    // Bug #11 fix: Use ref for current conversation ID
    const currentConvId = activeConversationIdRef.current;

    // Bug #1 fix: Check for duplicate creation BEFORE state update
    const shouldCreateInFirestore = isAuthenticated && isLocalConversationId(currentConvId) && !creatingInFirestore.current.has(currentConvId);

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

  // Delete a conversation (with rollback on Firestore failure)
  const deleteConversation = useCallback(async (convId) => {
    // Store for potential rollback
    let deletedConv = null;
    let previousActiveId = activeConversationIdRef.current;

    setConversations(prev => {
      deletedConv = prev.find(c => c.id === convId);
      const filtered = prev.filter(c => c.id !== convId);
      if (convId === activeConversationIdRef.current) {
        if (filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else {
          const newConv = createInitialConversation();
          setActiveConversationId(newConv.id);
          return [newConv];
        }
      }
      return filtered;
    });

    // Only sync to Firestore if it's a real Firestore ID
    if (isAuthenticated && !isLocalConversationId(convId)) {
      try {
        const token = await getIdToken();
        const response = await fetchWithTimeout(`/api/conversations?id=${convId}`, {
          method: 'DELETE',
          headers: createAuthHeaders(token),
        });

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.status}`);
        }
      } catch (e) {
        console.error('Failed to delete conversation, rolling back:', e.message);

        // Rollback: restore the deleted conversation
        if (deletedConv) {
          setConversations(prev => {
            // Only rollback if not already restored
            if (!prev.find(c => c.id === convId)) {
              return [deletedConv, ...prev];
            }
            return prev;
          });
          // Restore active ID if it was this conversation
          if (previousActiveId === convId) {
            setActiveConversationId(convId);
          }
        }
      }
    }
  }, [isAuthenticated, getIdToken]);

  // Link conversation to artifact
  const linkArtifact = useCallback(async (artifactId) => {
    const currentConvId = activeConversationIdRef.current;

    setConversations(prev => prev.map(conv =>
      conv.id === currentConvId
        ? { ...conv, artifactId, updatedAt: Date.now() }
        : conv
    ));

    // Sync to Firestore
    await updateInFirestore(currentConvId, { artifactId });
  }, [updateInFirestore]);

  // Get conversation list with titles
  const conversationList = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title || extractTitle(conv.messages, 30),
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

