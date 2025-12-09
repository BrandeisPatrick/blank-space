import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { useArtifacts } from "./contexts/ArtifactContext";
import { getTheme } from "./styles/theme";
import { LandingPage, SignInPage, SignUpPage } from "./components/auth";
import { ArtifactSidebar } from "./components/artifact";
import { FloatingChatPanel } from "./components/ui/FloatingChatPanel";
import { FloatingBrowserWindow } from "./components/ui/FloatingBrowserWindow";
import { useIsMobile } from "./hooks/useIsMobile";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { processMessage } from "./services/ToolOrchestrator.js";
import { ROUTES, TIMING, MESSAGES } from "./constants";
import "./styles/App.css";

function App() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user, loading: authLoading } = useAuth();
  const { activeArtifact, updateArtifactFiles, updateChatHistory, createArtifact, activeArtifactId, clearActiveArtifact, updateArtifactIcon, renameArtifact } = useArtifacts();
  const isMobile = useIsMobile();

  // Route state
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LANDING);

  // AI processing state
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Knowledge Base state - enables professional component patterns
  const [useKnowledgeBase, setUseKnowledgeBase] = useLocalStorage('useKnowledgeBase', true);

  // Toggle knowledge base preference
  const toggleKnowledgeBase = useCallback(() => {
    setUseKnowledgeBase(prev => !prev);
  }, [setUseKnowledgeBase]);

  // Model tier state - 'lite' or 'pro'
  const [modelTier, setModelTier] = useLocalStorage('modelTier', 'lite');

  // State management
  const [chatMessages, setChatMessages] = useState([]);
  const [files, setFiles] = useState(activeArtifact?.files || {});
  const [activeFile, setActiveFile] = useState('App.jsx');

  // Error deduplication - track recent errors to prevent spam
  const recentErrors = useRef(new Map());

  // Track current chat messages for saving to artifact
  // Using ref to avoid including chatMessages in handleSendMessage dependencies
  const chatMessagesRef = useRef([]);

  // Track if initial message from URL was already processed
  // Prevents effect from re-running when handleSendMessage changes
  const initialMessageProcessedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Sync files and chat history with active artifact (one-way only)
  useEffect(() => {
    if (activeArtifact) {
      setFiles(activeArtifact.files);
      setChatMessages(activeArtifact.chatHistory || []);

      // Set active file to first available file
      const fileNames = Object.keys(activeArtifact.files);
      if (fileNames.length > 0 && !activeArtifact.files[activeFile]) {
        setActiveFile(fileNames[0]);
      }
    } else {
      // Empty state - no artifacts
      setFiles({});
      setChatMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArtifactId]);
  // Intentionally omitting activeArtifact and activeFile from dependencies:
  // - activeArtifact is derived from activeArtifactId (changes when ID changes)
  // - Including it would cause effect to run on file/chatHistory changes (unwanted)
  // - activeFile is only used for validation check, not meant to trigger re-sync
  // This implements one-way sync: artifact → UI (not UI → artifact)

  // Panel visibility (legacy - keeping for compatibility)
  const [showChat, setShowChat] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(false);

  // Floating window states
  const [floatingChatVisible, setFloatingChatVisible] = useState(false);
  const [browserWindowVisible, setBrowserWindowVisible] = useState(false);
  const [userRequestedBrowserWindow, setUserRequestedBrowserWindow] = useState(false);

  // Show browser window only when: user clicked artifact card OR AI completed work
  useEffect(() => {
    if (activeArtifact && (userRequestedBrowserWindow || !isAIProcessing)) {
      setBrowserWindowVisible(true);
    }
  }, [activeArtifact, userRequestedBrowserWindow, isAIProcessing]);

  // Auto-show/hide chat based on AI working state
  useEffect(() => {
    let timeoutId;
    if (isAIProcessing) {
      setFloatingChatVisible(true);
    } else {
      // Hide chat after 3 seconds
      timeoutId = setTimeout(() => {
        setFloatingChatVisible(false);
      }, 3000);
    }
    // Cleanup: clear pending timeout when effect re-runs or unmounts
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAIProcessing]);

  // Clean up old guest banner localStorage key
  useEffect(() => {
    localStorage.removeItem('guestBannerDismissed');
  }, []);

  // Helper to determine current UI state
  const getUIState = useCallback(() => {
    const hasArtifact = !!activeArtifact;
    const hasMessages = chatMessages.length > 0;
    const hasPendingWork = hasMessages || isAIProcessing;

    if (!hasArtifact && !hasPendingWork) {
      return 'EMPTY'; // No artifacts, no activity
    } else if (!hasArtifact && hasPendingWork) {
      return 'PENDING'; // Working on first artifact
    } else {
      return 'ACTIVE'; // Has artifact
    }
  }, [activeArtifact, chatMessages.length, isAIProcessing]);

  // Helper function to set panel visibility based on device type and UI state
  const setupPanelVisibility = useCallback(() => {
    const uiState = getUIState();

    // In empty state, hide all panels
    if (uiState === 'EMPTY') {
      setShowChat(false);
      setShowCode(false);
      setShowPreview(false);
      return;
    }

    // In pending state (user just sent message from landing), show only chat
    if (uiState === 'PENDING') {
      setShowChat(true);
      setShowCode(false);
      setShowPreview(false);
      return;
    }

    // In active state (has artifact), set based on device type
    if (isMobile) {
      setShowChat(true);
      setShowCode(false);
      setShowPreview(false);
    } else {
      setShowChat(true);
      setShowCode(false);
      setShowPreview(true);
    }
  }, [isMobile, getUIState]);

  // Auto-adjust panel visibility when UI state changes
  useEffect(() => {
    const uiState = getUIState();

    // If transitioning to empty state, hide all panels
    if (uiState === 'EMPTY' && showChat) {
      setShowChat(false);
      setShowCode(false);
      setShowPreview(false);
    }

    // If transitioning from empty to pending (user sent first message)
    // Show only chat panel to display the conversation
    if (uiState === 'PENDING' && !showChat) {
      setShowChat(true);
      setShowCode(false);
      setShowPreview(false);
    }

    // If transitioning from pending to active (artifact created)
    // Setup panels based on device type
    if (uiState === 'ACTIVE' && !showPreview && !isMobile) {
      setupPanelVisibility();
    }
  }, [getUIState, showChat, showPreview, isMobile, setupPanelVisibility]);

  // Navigation handlers
  const handleTryNow = (message) => {
    // Special case: empty string means user clicked artifact card (just open browser window)
    if (message === '') {
      setUserRequestedBrowserWindow(true);
      return;
    }

    // Auto-submit the message if provided from landing page
    if (message?.trim()) {
      // Only clear artifact if starting completely fresh (no existing artifact)
      if (!activeArtifact) {
        clearActiveArtifact();
      }

      // Show floating chat panel and send message
      setFloatingChatVisible(true);
      handleSendMessage(message);
    }
  };

  const handleNavigateToSignIn = () => setCurrentRoute(ROUTES.SIGNIN);
  const handleNavigateToSignUp = () => setCurrentRoute(ROUTES.SIGNUP);
  const handleNavigateToLanding = () => {
    clearActiveArtifact(); // Clear active artifact so landing page always creates new
    setBrowserWindowVisible(false); // Close browser window
    setUserRequestedBrowserWindow(false); // Reset user request flag
    setCurrentRoute(ROUTES.LANDING);
  };

  const handleAuthSuccess = () => {
    // Navigate to studio after successful sign-in/sign-up
    setCurrentRoute(ROUTES.STUDIO);
    setupPanelVisibility();
  };

  // Track rate limit warnings shown
  const [rateLimitWarningsShown, setRateLimitWarningsShown] = useState({
    fifty: false,
    seventyFive: false
  });

  // Helper to add rate limit warning message
  const addRateLimitWarning = (rateLimit) => {
    const percentUsed = (rateLimit.used / rateLimit.limit) * 100;

    // 50% warning
    if (percentUsed >= 50 && percentUsed < 75 && !rateLimitWarningsShown.fifty) {
      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: MESSAGES.RATE_LIMIT_50(rateLimit.used, rateLimit.limit, rateLimit.remaining),
        timestamp: Date.now()
      }]);
      setRateLimitWarningsShown(prev => ({ ...prev, fifty: true }));
    }

    // 75% warning
    if (percentUsed >= 75 && !rateLimitWarningsShown.seventyFive) {
      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: MESSAGES.RATE_LIMIT_75(rateLimit.remaining),
        timestamp: Date.now()
      }]);
      setRateLimitWarningsShown(prev => ({ ...prev, seventyFive: true }));
    }
  };

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

  // Handle preview errors with deduplication
  // Layer 1: useCallback for stable reference (prevents infinite loops)
  // Layer 2: Deduplication logic (prevents spam)
  const handlePreviewError = useCallback((error) => {
    // Create unique signature for this error
    const signature = `${error.file || 'unknown'}:${error.line || 0}:${error.message}`;
    const lastShown = recentErrors.current.get(signature);
    const now = Date.now();

    // Only add if this is a new error OR >DEDUP_WINDOW since last identical error
    if (!lastShown || now - lastShown > TIMING.ERROR_DEDUP_WINDOW_MS) {
      recentErrors.current.set(signature, now);

      const errorMessage = {
        type: 'error',
        error: error,
        timestamp: now
      };
      setChatMessages(prev => [...prev, errorMessage]);

      // Memory cleanup: prevent Map from growing unbounded
      // Keep only the MAX_RECENT_ERRORS most recent errors
      if (recentErrors.current.size > TIMING.MAX_RECENT_ERRORS) {
        const entries = [...recentErrors.current.entries()];
        // Remove oldest ERROR_CLEANUP_COUNT entries
        entries.slice(0, TIMING.ERROR_CLEANUP_COUNT).forEach(([sig]) => recentErrors.current.delete(sig));
      }
    }
  }, []);

  // Handle chat message with AI agents
  const handleSendMessage = useCallback(async (message) => {
    // Add user message
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: Date.now()
    };
    setChatMessages(prev => {
      const newMessages = [...prev, userMessage];
      chatMessagesRef.current = newMessages;
      return newMessages;
    });

    // Set AI processing state
    setIsAIProcessing(true);

    // Add a loading message that will be updated with tool actions
    const loadingMessageId = Date.now();
    setChatMessages(prev => {
      const newMessages = [...prev, {
        id: loadingMessageId,
        type: 'assistant',
        content: '',
        isLoading: true,
        timestamp: loadingMessageId
      }];
      chatMessagesRef.current = newMessages;
      return newMessages;
    });

    // Callback for streaming updates from agent
    const onUpdate = (update) => {
      // Handle tool_action - update the loading message with current action
      if (update.type === 'tool_action') {
        setChatMessages(prev => {
          const newMessages = prev.map(msg =>
            msg.id === loadingMessageId
              ? { ...msg, content: update.action }
              : msg
          );
          chatMessagesRef.current = newMessages;
          return newMessages;
        });
        return; // Don't add new messages for tool actions
      }

      // Handle thinking/intent/plan - just update loading message
      if (update.type === 'thinking' || update.type === 'intent' || update.type === 'plan') {
        return; // Skip these, we show tool actions instead
      }

      setChatMessages(prev => {
        const newMessages = [...prev, { ...update, timestamp: Date.now() }];
        // Sync ref immediately for AI responses too
        chatMessagesRef.current = newMessages;
        return newMessages;
      });
    };

    // Helper to remove the loading message
    const removeLoadingMessage = () => {
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== loadingMessageId);
        chatMessagesRef.current = newMessages;
        return newMessages;
      });
    };

    try {
      // Process message with AI agents
      const result = await processMessage(message, files, onUpdate, { useKnowledgeBase, modelTier });

      if (result.success) {
        // Remove loading message and mark processing complete
        removeLoadingMessage();
        setIsAIProcessing(false);

        // Handle chat intent - no file operations, just conversation
        if (result.intent === 'chat') {
          // Chat response already sent via onUpdate callback
          // No artifact or file changes needed
          return;
        }

        // Handle create intent - generate files and create/update artifact
        if (result.fileOperations && result.fileOperations.length > 0) {
          // Create or update artifact with generated files
          const newFiles = { ...files };

          result.fileOperations.forEach(op => {
            newFiles[op.filename] = op.content;
          });

          // If no active artifact, create a new one
          if (!activeArtifactId) {
            const artifactName = result.plan?.summary?.slice(0, 50) || 'New Project';
            try {
              // Use ref to get current chat messages (includes user message + AI responses)
              // Ref always has the latest state, avoiding duplicate messages
              const newArtifactId = await createArtifact(artifactName, newFiles, chatMessagesRef.current);
              if (!newArtifactId) {
                throw new Error('Failed to create artifact');
              }
            } catch (error) {
              console.error('Error creating artifact:', error);
              // Save files to state even if artifact creation fails
              // User doesn't lose their generated content
              setFiles(newFiles);
              setChatMessages(prev => [...prev, {
                type: 'error',
                content: 'Failed to save your project to the cloud, but files are available locally. You can try creating a new artifact to save your work.',
                timestamp: Date.now()
              }]);
              return;
            }
          } else {
            // Update existing artifact with files and chat history
            setFiles(newFiles);
            updateArtifactFiles(activeArtifactId, newFiles);
            // Explicitly save chat history using ref (includes all messages)
            updateChatHistory(activeArtifactId, chatMessagesRef.current);
          }

          // Switch to the first created/modified file
          setActiveFile(result.fileOperations[0].filename);

          // Ensure panels are visible based on device
          setupPanelVisibility();
        }

        // Check for rate limit info in result and show warnings
        if (result.rateLimit) {
          addRateLimitWarning(result.rateLimit);
        }
      } else {
        // Handle error or incomplete result - remove loading and show error
        removeLoadingMessage();
        setIsAIProcessing(false);
        setChatMessages(prev => [...prev, {
          type: 'error',
          content: 'Failed to generate code. Please try again.',
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      removeLoadingMessage();
      setIsAIProcessing(false);

      // Handle rate limit error specifically
      if (error.isRateLimit && error.rateLimit) {
        setChatMessages(prev => [...prev, {
          type: 'error',
          content: MESSAGES.RATE_LIMIT_EXCEEDED(error.rateLimit.used, error.rateLimit.limit),
          timestamp: Date.now()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          type: 'error',
          content: 'An error occurred while processing your request. Please try again.',
          timestamp: Date.now()
        }]);
      }
    }
  }, [files, activeArtifactId, createArtifact, updateArtifactFiles, updateChatHistory, setupPanelVisibility, addRateLimitWarning, useKnowledgeBase, modelTier]);
  // Note: chatMessages intentionally omitted - using chatMessagesRef instead to avoid recreating function on every message

  // Handle initial message from URL parameter (landing page → studio transition)
  useEffect(() => {
    // Only process if on studio route and haven't processed initial message yet
    if (currentRoute === ROUTES.STUDIO && !initialMessageProcessedRef.current) {
      const params = new URLSearchParams(window.location.search);

      let messageToSend = null;

      // Check for sessionStorage fallback first (for long messages)
      if (params.get('hasPendingMessage') === 'true') {
        messageToSend = sessionStorage.getItem('pendingMessage');
        sessionStorage.removeItem('pendingMessage');
      } else {
        // Check URL parameter for regular messages
        const initialMessage = params.get('initialMessage');
        if (initialMessage) {
          messageToSend = decodeURIComponent(initialMessage);
        }
      }

      if (messageToSend) {
        // Mark as processed to prevent re-running when handleSendMessage changes
        initialMessageProcessedRef.current = true;

        // Clear URL parameter immediately to prevent double-processing
        window.history.replaceState({}, '', window.location.pathname);

        // Send message after a small delay to ensure studio UI is mounted
        const timeoutId = setTimeout(() => {
          handleSendMessage(messageToSend);
        }, 100);

        // Cleanup: clear timeout if component unmounts or route changes
        return () => clearTimeout(timeoutId);
      }
    }

    // Reset flag when leaving studio route
    if (currentRoute !== ROUTES.STUDIO) {
      initialMessageProcessedRef.current = false;
    }
  }, [currentRoute, handleSendMessage]);

  // Handle file changes
  const handleFileChange = (filename, newContent) => {
    const updatedFiles = {
      ...files,
      [filename]: newContent
    };
    setFiles(updatedFiles);
    // Auto-save to artifact (only if there's an active artifact)
    if (activeArtifactId) {
      updateArtifactFiles(activeArtifactId, updatedFiles);
    }
  };

  // Auto-navigate based on auth state
  useEffect(() => {
    if (!authLoading) {
      // If user is authenticated and on landing/signin/signup, go to studio
      if (user && (currentRoute === ROUTES.LANDING || currentRoute === ROUTES.SIGNIN || currentRoute === ROUTES.SIGNUP)) {
        setCurrentRoute(ROUTES.STUDIO);
      }
      // Guest mode: Allow unauthenticated users to access studio
      // (removed redirect that sent guests back to landing)
    }
  }, [user, authLoading, currentRoute]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.bg.primary,
        color: theme.colors.text.primary,
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            marginBottom: theme.spacing.lg,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <svg
              width="64"
              height="80"
              viewBox="0 0 24 30"
              fill="none"
              stroke={theme.colors.text.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <path d="M6.5 7h11" />
              <path d="M6.5 23h11" />
              <path d="M6.5 7l5.5 8l-5.5 8" />
              <path d="M17.5 7l-5.5 8l5.5 8" />
            </svg>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </div>
          <p style={{
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.text.secondary,
          }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show sign in page if route is SIGNIN
  if (currentRoute === ROUTES.SIGNIN) {
    return (
      <SignInPage
        onNavigateToMain={handleNavigateToLanding}
        onNavigateToSignUp={handleNavigateToSignUp}
        onSignInSuccess={handleAuthSuccess}
      />
    );
  }

  // Show sign up page if route is SIGNUP
  if (currentRoute === ROUTES.SIGNUP) {
    return (
      <SignUpPage
        onNavigateToMain={handleNavigateToLanding}
        onNavigateToSignIn={handleNavigateToSignIn}
        onSignUpSuccess={handleAuthSuccess}
      />
    );
  }

  // Show landing page with floating windows (default route)
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Landing Page as Background */}
      <LandingPage
        onTryNow={handleTryNow}
        onSignIn={handleNavigateToSignIn}
        useKnowledgeBase={useKnowledgeBase}
        onToggleKnowledgeBase={toggleKnowledgeBase}
        modelTier={modelTier}
        onChangeModelTier={setModelTier}
      />

      {/* Floating Chat Panel - Only shows when AI is working */}
      <FloatingChatPanel
        visible={floatingChatVisible}
        messages={chatMessages}
        onFixBug={handleSendMessage}
      />

      {/* Floating Browser Window */}
      <FloatingBrowserWindow
        visible={browserWindowVisible}
        artifact={activeArtifact}
        files={files}
        onClose={() => {
          setBrowserWindowVisible(false);
          setUserRequestedBrowserWindow(false); // Reset flag so card can be clicked again
        }}
        onFileChange={handleFileChange}
        onError={handlePreviewError}
        onIconChange={(iconId) => {
          if (activeArtifactId) {
            updateArtifactIcon(activeArtifactId, iconId);
          }
        }}
        onRename={(newName) => {
          if (activeArtifactId) {
            renameArtifact(activeArtifactId, newName);
          }
        }}
      />

      {/* Artifact Sidebar (still available) */}
      <ArtifactSidebar
        isOpen={showArtifacts}
        onClose={() => setShowArtifacts(false)}
      />
    </div>
  );
}

export default App;
