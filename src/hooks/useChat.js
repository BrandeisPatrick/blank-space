import { useState, useCallback, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useConversation } from '../contexts/ConversationContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../config/firebase';
import { processMessage } from '../services/ToolOrchestrator.js';
import { TIMING, MESSAGES } from '../constants';

/**
 * Upload an image to Firebase Storage and return the download URL
 */
async function uploadChatImage(userId, image) {
  const { base64, mimeType, filename } = image;
  const ext = mimeType.split('/')[1] || 'png';
  const storagePath = `users/${userId}/chat-images/${Date.now()}-${filename || 'image'}.${ext}`;
  const storageRef = ref(storage, storagePath);

  // Convert base64 to blob
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  return { url, mimeType };
}

/**
 * Custom hook for AI chat processing
 * Handles message sending, debugging, and agentic loops
 */
export const useChat = ({
  files,
  setFiles,
  modelTier,
  activeArtifactId,
  createArtifact,
  updateArtifactFiles,
  updateChatHistory,
}) => {
  const { mode } = useTheme();
  const { aiColorPalette, aiUIStyle } = useSettings();
  const { incrementUsage } = useSubscription();
  const { messages, setMessages, linkArtifact, activeConversationId } = useConversation();
  const { user } = useAuth();

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);

  // Track conversation intent - only classified once at conversation start
  const [conversationIntent, setConversationIntent] = useState(null);

  // Reset intent when conversation changes
  useEffect(() => {
    setConversationIntent(null);
  }, [activeConversationId]);

  // Track messages in ref to avoid stale closures
  const messagesRef = useRef(messages);

  // Track thinking steps for collapsed thinking UI
  const thinkingStepsRef = useRef([]);
  const thinkingStartTimeRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Rate limit warning tracking
  const [rateLimitWarningsShown, setRateLimitWarningsShown] = useState({
    fifty: false,
    seventyFive: false
  });

  // Reset warnings at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        setRateLimitWarningsShown({ fifty: false, seventyFive: false });
      }
    };
    const interval = setInterval(checkMidnight, TIMING.MIDNIGHT_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Add rate limit warning message
  const addRateLimitWarning = useCallback((rateLimit) => {
    const percentUsed = (rateLimit.used / rateLimit.limit) * 100;

    if (percentUsed >= 50 && percentUsed < 75 && !rateLimitWarningsShown.fifty) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: MESSAGES.RATE_LIMIT_50(rateLimit.used, rateLimit.limit, rateLimit.remaining),
        timestamp: Date.now()
      }]);
      setRateLimitWarningsShown(prev => ({ ...prev, fifty: true }));
    }

    if (percentUsed >= 75 && !rateLimitWarningsShown.seventyFive) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: MESSAGES.RATE_LIMIT_75(rateLimit.remaining),
        timestamp: Date.now()
      }]);
      setRateLimitWarningsShown(prev => ({ ...prev, seventyFive: true }));
    }
  }, [rateLimitWarningsShown, setMessages]);

  /**
   * Send a message and process with AI
   * Handles the full agentic loop (up to 15 iterations)
   * @param {string} message - The text message
   * @param {Array|null} images - Array of {base64, mimeType, filename} objects
   * @param {Object|null} options - Optional config: { mentionedAppId, mentionedAppFiles, isDebugMode }
   */
  const sendMessage = useCallback(async (message, images = null, options = null) => {
    // Extract options for @app mention support
    const { mentionedAppId, mentionedAppFiles, isDebugMode } = options || {};
    // Use mentioned app's files if provided, otherwise use current files
    const filesToProcess = mentionedAppFiles || files;
    // Upload images to Firebase Storage and get URLs for persistence
    // Keep base64 for LLM API (transient, not stored)
    let imageUrlsForStorage = null;
    const imageBase64ForLLM = images; // Original base64 for API calls

    if (images && images.length > 0 && user?.uid && storage) {
      try {
        imageUrlsForStorage = await Promise.all(
          images.map(img => uploadChatImage(user.uid, img))
        );
      } catch (err) {
        console.error('[useChat] Image upload failed:', err);
        // Fall back to base64 if upload fails (will cause Firestore issues with large images)
        imageUrlsForStorage = images.map(img => ({ url: null, mimeType: img.mimeType, base64: img.base64 }));
      }
    } else if (images && images.length > 0) {
      // Guest user or no storage - use base64 (ephemeral, may fail to persist)
      imageUrlsForStorage = images.map(img => ({ mimeType: img.mimeType, base64: img.base64 }));
    }

    // Add user message with URLs for persistence (not base64)
    const userMessage = {
      type: 'user',
      content: message,
      images: imageUrlsForStorage, // URLs for display and persistence
      timestamp: Date.now()
    };
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      messagesRef.current = newMessages;
      return newMessages;
    });

    setIsProcessing(true);

    // Reset thinking state for new message
    thinkingStepsRef.current = [];
    thinkingStartTimeRef.current = Date.now();

    // Add loading message
    const loadingMessageId = Date.now();
    setMessages(prev => {
      const newMessages = [...prev, {
        id: loadingMessageId,
        type: 'assistant',
        content: '',
        isLoading: true,
        thinking: [],
        timestamp: loadingMessageId
      }];
      messagesRef.current = newMessages;
      return newMessages;
    });

    // Streaming update callback
    const onUpdate = (update) => {
      // Collect thinking steps for collapsed thinking UI
      if (update.type === 'thinking' || update.type === 'intent' || update.type === 'plan') {
        if (update.content) {
          thinkingStepsRef.current = [...thinkingStepsRef.current, update.content];
          // Update loading message with thinking steps
          setMessages(prev => {
            const newMessages = prev.map(msg =>
              msg.id === loadingMessageId
                ? { ...msg, thinking: [...thinkingStepsRef.current] }
                : msg
            );
            messagesRef.current = newMessages;
            return newMessages;
          });
        }
        return;
      }

      if (update.type === 'tool_action') {
        // Add tool action to thinking steps
        if (update.action) {
          thinkingStepsRef.current = [...thinkingStepsRef.current, update.action];
        }
        setMessages(prev => {
          const newMessages = prev.map(msg =>
            msg.id === loadingMessageId
              ? { ...msg, content: update.action, thinking: [...thinkingStepsRef.current] }
              : msg
          );
          messagesRef.current = newMessages;
          return newMessages;
        });
        return;
      }

      // For assistant messages (chat responses), attach thinking data
      const thinkingDuration = thinkingStartTimeRef.current
        ? Date.now() - thinkingStartTimeRef.current
        : null;
      const messageWithThinking = {
        ...update,
        thinking: thinkingStepsRef.current.length > 0 ? [...thinkingStepsRef.current] : null,
        thinkingDuration,
        timestamp: Date.now()
      };

      setMessages(prev => {
        // Replace loading message with final response
        const filtered = prev.filter(msg => msg.id !== loadingMessageId);
        const newMessages = [...filtered, messageWithThinking];
        messagesRef.current = newMessages;
        return newMessages;
      });
    };

    const removeLoadingMessage = () => {
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== loadingMessageId);
        messagesRef.current = newMessages;
        return newMessages;
      });
    };

    try {
      // Get conversation history for context (exclude loading messages)
      const conversationHistory = messagesRef.current
        .filter(msg => !msg.isLoading && (msg.type === 'user' || msg.type === 'assistant'))
        .map(msg => ({ role: msg.type, content: msg.content }));

      const result = await processMessage(message, filesToProcess, onUpdate, {
        modelTier,
        aiColorPalette,
        aiUIStyle,
        isDarkTheme: mode === 'dark',
        conversationHistory,
        conversationIntent: isDebugMode ? 'debug' : conversationIntent,  // Force debug if @app mentioned
        images: imageBase64ForLLM,  // Pass base64 images for LLM API (not the stored URLs)
        mentionedAppId,  // Pass mentioned app ID for context
      });

      // Store intent from first message for subsequent messages
      if (result.intent && !conversationIntent) {
        setConversationIntent(result.intent);
      }

      if (result.success) {
        removeLoadingMessage();
        setIsProcessing(false);
        incrementUsage(modelTier);

        // Chat intent - no file operations
        if (result.intent === 'chat') {
          return { success: true, intent: 'chat' };
        }

        // Create/debug intent - handle file operations
        if (result.fileOperations && result.fileOperations.length > 0) {
          // Use mentioned app files as base, or current files
          const baseFiles = mentionedAppFiles || files;
          const newFiles = { ...baseFiles };
          result.fileOperations.forEach(op => {
            newFiles[op.filename] = op.content;
          });

          const appName = result.plan?.summary || 'Your app';
          const isDebugging = isDebugMode || mentionedAppId;

          // Success message with thinking data
          const fileCount = result.fileOperations.length;
          const thinkingDuration = thinkingStartTimeRef.current
            ? Date.now() - thinkingStartTimeRef.current
            : null;
          const successMessage = {
            type: 'assistant',
            content: isDebugging
              ? `Fixed ${fileCount} file${fileCount > 1 ? 's' : ''}. Your app should work now!`
              : `${appName} has been created with ${fileCount} file${fileCount > 1 ? 's' : ''}. Click the preview to interact with your app!`,
            thinking: thinkingStepsRef.current.length > 0 ? [...thinkingStepsRef.current] : null,
            thinkingDuration,
            timestamp: Date.now()
          };

          setFiles(newFiles);
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.isLoading);
            const newMessages = [...filtered, successMessage];
            messagesRef.current = newMessages;
            return newMessages;
          });

          // Persist to artifact - use mentionedAppId if editing via @mention
          const targetArtifactId = mentionedAppId || activeArtifactId;
          if (!targetArtifactId) {
            const artifactName = result.plan?.summary?.slice(0, 50) || 'New Project';
            try {
              const newArtifactId = await createArtifact(artifactName, newFiles, messagesRef.current);
              if (newArtifactId) {
                linkArtifact(newArtifactId);
              }
            } catch (error) {
              console.error('Error creating artifact:', error);
              setMessages(prev => [...prev, {
                type: 'error',
                content: 'Failed to save your project to the cloud, but files are available locally.',
                timestamp: Date.now()
              }]);
            }
          } else {
            updateArtifactFiles(targetArtifactId, newFiles);
            updateChatHistory(targetArtifactId, messagesRef.current);
          }

          return {
            success: true,
            intent: result.intent,
            fileOperations: result.fileOperations,
            firstFile: result.fileOperations[0].filename
          };
        }

        if (result.rateLimit) {
          addRateLimitWarning(result.rateLimit);
        }

        return { success: true };
      } else {
        removeLoadingMessage();
        setIsProcessing(false);
        setMessages(prev => [...prev, {
          type: 'error',
          content: 'Failed to generate code. Please try again.',
          timestamp: Date.now()
        }]);
        return { success: false };
      }
    } catch (error) {
      console.error('Error processing message:', error);
      removeLoadingMessage();
      setIsProcessing(false);

      if (error.isQuotaExceeded && error.quota) {
        const { limitType, resetAt } = error.quota;
        const resetDate = new Date(resetAt).toLocaleString();
        setMessages(prev => [...prev, {
          type: 'error',
          content: MESSAGES.QUOTA_EXCEEDED(limitType, resetDate),
          timestamp: Date.now()
        }]);
      } else if (error.isRateLimit && error.rateLimit) {
        setMessages(prev => [...prev, {
          type: 'error',
          content: MESSAGES.RATE_LIMIT_EXCEEDED(error.rateLimit.used, error.rateLimit.limit),
          timestamp: Date.now()
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          content: 'An error occurred while processing your request. Please try again.',
          timestamp: Date.now()
        }]);
      }
      return { success: false, error };
    }
  }, [files, setFiles, modelTier, aiColorPalette, aiUIStyle, mode, activeArtifactId, createArtifact, updateArtifactFiles, updateChatHistory, setMessages, incrementUsage, addRateLimitWarning, linkArtifact, conversationIntent, user]);

  /**
   * Debug handler for errors and user-reported issues
   */
  const debug = useCallback(async ({ errors = [], userDescription = '' }) => {
    if ((!errors.length && !userDescription) || isDebugging) return { success: false };

    setIsDebugging(true);
    setIsProcessing(true);

    const loadingMessageId = Date.now();
    const loadingContent = userDescription ? 'Diagnosing issue...' : 'Analyzing errors...';
    setMessages(prev => {
      const newMessages = [...prev, {
        id: loadingMessageId,
        type: 'assistant',
        content: loadingContent,
        isLoading: true,
        timestamp: loadingMessageId
      }];
      messagesRef.current = newMessages;
      return newMessages;
    });

    // Build debug message
    let debugMessage;
    if (userDescription && errors.length > 0) {
      const errorSummary = errors.map((err, i) =>
        `${i + 1}. ${err.message}${err.source ? ` (${err.source}${err.line ? `:${err.line}` : ''})` : ''}`
      ).join('\n');
      debugMessage = `User reports: "${userDescription}"\n\nAlso seeing these errors:\n${errorSummary}`;
    } else if (userDescription) {
      debugMessage = `Fix this issue: ${userDescription}`;
    } else {
      const errorSummary = errors.map((err, i) =>
        `${i + 1}. ${err.message}${err.source ? ` (${err.source}${err.line ? `:${err.line}` : ''})` : ''}`
      ).join('\n');
      debugMessage = `Fix the following errors in my code:\n${errorSummary}`;
    }

    const onUpdate = (update) => {
      if (update.type === 'tool_action') {
        setMessages(prev => {
          const newMessages = prev.map(msg =>
            msg.id === loadingMessageId
              ? { ...msg, content: update.action }
              : msg
          );
          messagesRef.current = newMessages;
          return newMessages;
        });
      }
    };

    const removeLoadingMessage = () => {
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== loadingMessageId);
        messagesRef.current = newMessages;
        return newMessages;
      });
    };

    try {
      const result = await processMessage(debugMessage, files, onUpdate, {
        modelTier,
        aiColorPalette,
        aiUIStyle,
        isDarkTheme: mode === 'dark',
        isDebugMode: true,
        debugContext: { errors, userDescription },
      });

      if (result.success && result.fileOperations?.length > 0) {
        const fixedFiles = { ...files };
        result.fileOperations.forEach(op => {
          fixedFiles[op.filename] = op.content;
        });

        setFiles(fixedFiles);
        removeLoadingMessage();
        incrementUsage(modelTier);

        const fixedCount = result.fileOperations.length;
        setMessages(prev => {
          const newMessages = [...prev, {
            type: 'assistant',
            content: `Fixed ${fixedCount} file${fixedCount > 1 ? 's' : ''}. The errors should be resolved now.`,
            timestamp: Date.now()
          }];
          messagesRef.current = newMessages;
          return newMessages;
        });

        if (activeArtifactId) {
          updateArtifactFiles(activeArtifactId, fixedFiles);
          updateChatHistory(activeArtifactId, messagesRef.current);
        }

        return { success: true, fixedCount };
      } else {
        removeLoadingMessage();
        setMessages(prev => {
          const newMessages = [...prev, {
            type: 'assistant',
            content: result.response || 'I was unable to automatically fix the errors. Please check the code manually or describe the issue in more detail.',
            timestamp: Date.now()
          }];
          messagesRef.current = newMessages;
          return newMessages;
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Debug error:', error);
      removeLoadingMessage();
      setMessages(prev => {
        const newMessages = [...prev, {
          type: 'error',
          content: 'An error occurred while trying to fix the code. Please try again.',
          timestamp: Date.now()
        }];
        messagesRef.current = newMessages;
        return newMessages;
      });
      return { success: false, error };
    } finally {
      setIsDebugging(false);
      setIsProcessing(false);
    }
  }, [files, setFiles, isDebugging, modelTier, aiColorPalette, aiUIStyle, mode, activeArtifactId, updateArtifactFiles, updateChatHistory, setMessages, incrementUsage]);

  return {
    // Message handling
    sendMessage,
    debug,
    // State
    messages,
    isProcessing,
    isDebugging,
    // Direct access to setMessages for external sync
    setMessages,
  };
};

export default useChat;
