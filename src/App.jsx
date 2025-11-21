import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { useArtifacts } from "./contexts/ArtifactContext";
import { getTheme } from "./styles/theme";
import { LandingPage, SignInPage, SignUpPage } from "./components/auth";
import { TopBar } from "./components/ui";
import { ChatPanel, ChatInput } from "./components/chat";
import { EditorPanel, FileTabs, FileExplorer } from "./components/editor";
import { PreviewPanel } from "./components/preview";
import { ArtifactSidebar } from "./components/artifact";
import { useThinkingState } from "./hooks/useThinkingState";
import { useIsMobile } from "./hooks/useIsMobile";
import { processMessage } from "./services/ToolOrchestrator.js";
import { ROUTES, TIMING, MESSAGES, LABELS, PANELS, COLORS } from "./constants";
import "./styles/App.css";

function App() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user, loading: authLoading } = useAuth();
  const { activeArtifact, updateArtifactFiles, updateChatHistory, createArtifact, activeArtifactId, clearActiveArtifact } = useArtifacts();
  const isMobile = useIsMobile();

  // Route state
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LANDING);

  // Thinking state for CompactThinkingPanel
  const thinking = useThinkingState({
    autoCollapse: true,
    collapseDelay: TIMING.THINKING_COLLAPSE_DELAY_MS
  });

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

  // Panel visibility
  const [showChat, setShowChat] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(false);

  // Clean up old guest banner localStorage key
  useEffect(() => {
    localStorage.removeItem('guestBannerDismissed');
  }, []);

  // Helper to determine current UI state
  const getUIState = useCallback(() => {
    const hasArtifact = !!activeArtifact;
    const hasMessages = chatMessages.length > 0;
    const hasPendingWork = hasMessages || thinking.isThinking;

    if (!hasArtifact && !hasPendingWork) {
      return 'EMPTY'; // No artifacts, no activity
    } else if (!hasArtifact && hasPendingWork) {
      return 'PENDING'; // Working on first artifact
    } else {
      return 'ACTIVE'; // Has artifact
    }
  }, [activeArtifact, chatMessages.length, thinking.isThinking]);

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
    // Auto-submit the message if provided from landing page
    if (message?.trim()) {
      // Clear active artifact to ensure a new one is created
      clearActiveArtifact();

      // Encode message in URL parameter
      const encodedMessage = encodeURIComponent(message);

      // Check if message is too long for URL (browser limit ~2000 chars)
      if (encodedMessage.length > 2000) {
        // Fallback: Use sessionStorage for long messages
        sessionStorage.setItem('pendingMessage', message);
        window.history.pushState({}, '', '?hasPendingMessage=true');
      } else {
        window.history.pushState({}, '', `?initialMessage=${encodedMessage}`);
      }
    }

    setCurrentRoute(ROUTES.STUDIO);

    // If message provided, show chat immediately for pending state
    // Otherwise call setupPanelVisibility for normal navigation
    if (message?.trim()) {
      setShowChat(true);
      setShowCode(false);
      setShowPreview(false);
    } else {
      setupPanelVisibility();
    }
  };

  const handleNavigateToSignIn = () => setCurrentRoute(ROUTES.SIGNIN);
  const handleNavigateToSignUp = () => setCurrentRoute(ROUTES.SIGNUP);
  const handleNavigateToLanding = () => {
    clearActiveArtifact(); // Clear active artifact so landing page always creates new
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
      // Sync ref immediately to ensure it's available for artifact creation
      chatMessagesRef.current = newMessages;
      return newMessages;
    });

    // Reset thinking state and start
    thinking.reset();
    thinking.startThinking();

    // Track current step for updates
    let currentStepId = null;

    // Callback for streaming updates from agent
    const onUpdate = (update) => {
      // Handle different update types for thinking panel
      if (update.type === 'thinking') {
        // Add or update thinking step
        if (!currentStepId) {
          currentStepId = thinking.addStep(update.content, 'active');
        } else {
          thinking.updateStep(currentStepId, { label: update.content, status: 'active' });
        }
      } else if (update.type === 'intent') {
        // Intent classification step
        currentStepId = thinking.addStep('Understanding your request', 'active');
        thinking.completeStep(currentStepId);
        currentStepId = null;
        return; // Don't add to chat messages
      } else if (update.type === 'plan') {
        // Planning step
        currentStepId = thinking.addStep('Planning solution', 'active');
        thinking.completeStep(currentStepId);
        thinking.startStreaming();
        currentStepId = null;
        return; // Don't add to chat messages
      }

      setChatMessages(prev => {
        const newMessages = [...prev, { ...update, timestamp: Date.now() }];
        // Sync ref immediately for AI responses too
        chatMessagesRef.current = newMessages;
        return newMessages;
      });
    };

    try {
      // Process message with AI agents
      const result = await processMessage(message, files, onUpdate);

      if (result.success && result.fileOperations) {
        // Add generating steps for each file
        result.fileOperations.forEach((op, index) => {
          const stepId = thinking.addStep(`Generating ${op.filename}`, 'active');
          setTimeout(() => thinking.completeStep(stepId), TIMING.FILE_GENERATION_DELAY_MS * (index + 1));
        });

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
            thinking.complete();
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
        if (result.fileOperations.length > 0) {
          setActiveFile(result.fileOperations[0].filename);
        }

        // Ensure panels are visible based on device
        setupPanelVisibility();

        // Complete thinking process
        setTimeout(() => thinking.complete(), TIMING.THINKING_COMPLETION_DELAY_MS);

        // Check for rate limit info in result and show warnings
        if (result.rateLimit) {
          addRateLimitWarning(result.rateLimit);
        }
      } else {
        // Handle error or incomplete result
        thinking.error('Failed to generate code');
      }
    } catch (error) {
      console.error('Error processing message:', error);

      // Handle rate limit error specifically
      if (error.isRateLimit && error.rateLimit) {
        thinking.error('Rate limit reached');
        setChatMessages(prev => [...prev, {
          type: 'error',
          content: MESSAGES.RATE_LIMIT_EXCEEDED(error.rateLimit.used, error.rateLimit.limit),
          timestamp: Date.now()
        }]);
      } else {
        thinking.error('An error occurred while processing your request');
      }
    }
  }, [files, activeArtifactId, thinking, createArtifact, updateArtifactFiles, updateChatHistory, setupPanelVisibility, addRateLimitWarning]);
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

  // Handle file creation
  const handleFileCreate = (filename, content) => {
    const updatedFiles = {
      ...files,
      [filename]: content
    };
    setFiles(updatedFiles);
    setActiveFile(filename);
    // Auto-save to artifact (only if there's an active artifact)
    if (activeArtifactId) {
      updateArtifactFiles(activeArtifactId, updatedFiles);
    }
  };

  // Handle file deletion
  const handleFileDelete = (filename) => {
    const updatedFiles = { ...files };
    delete updatedFiles[filename];
    setFiles(updatedFiles);

    // If deleting the active file, switch to another file
    if (activeFile === filename) {
      const remainingFiles = Object.keys(updatedFiles);
      if (remainingFiles.length > 0) {
        setActiveFile(remainingFiles[0]);
      } else {
        setActiveFile('');
      }
    }

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

  // Calculate panel widths
  const visiblePanels = [showChat, showCode, showPreview].filter(Boolean).length;
  const panelWidth = isMobile ? '100%' : (visiblePanels > 0 ? `${100 / visiblePanels}%` : '100%');

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

  // Show landing page if route is LANDING
  if (currentRoute === ROUTES.LANDING) {
    return (
      <LandingPage
        onTryNow={handleTryNow}
        onSignIn={handleNavigateToSignIn}
      />
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

  // Otherwise show studio view
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.colors.bg.primary,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
      overflow: 'hidden',
    }}>
      {/* Artifact Sidebar */}
      <ArtifactSidebar
        isOpen={showArtifacts}
        onClose={() => setShowArtifacts(false)}
      />

      {/* Top Bar */}
      <TopBar
        showChat={showChat}
        showCode={showCode}
        showPreview={showPreview}
        onTogglePanel={(panel) => {
          if (isMobile) {
            // On mobile, only show one panel at a time
            if (panel === PANELS.CHAT) {
              setShowChat(true);
              setShowCode(false);
              setShowPreview(false);
            } else if (panel === PANELS.CODE) {
              setShowChat(false);
              setShowCode(true);
              setShowPreview(false);
            } else if (panel === PANELS.PREVIEW) {
              setShowChat(false);
              setShowCode(false);
              setShowPreview(true);
            }
          } else {
            // On desktop, toggle panels independently
            if (panel === PANELS.CHAT) setShowChat(!showChat);
            if (panel === PANELS.CODE) setShowCode(!showCode);
            if (panel === PANELS.PREVIEW) setShowPreview(!showPreview);
          }
        }}
        onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
        onNavigateToHome={handleNavigateToLanding}
      />

      {/* Main Content Panels */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        gap: theme.spacing.xs,
        background: theme.colors.gradient.subtle,
        padding: theme.spacing.xs,
      }}>
        {(() => {
          const uiState = getUIState();

          // STATE A: Empty State - No artifacts and no activity
          if (uiState === 'EMPTY') {
            return (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadows.md,
          }}>
            <div style={{
              textAlign: 'center',
              padding: theme.spacing['2xl'],
              maxWidth: '500px',
            }}>
              <div style={{
                fontSize: '80px',
                marginBottom: theme.spacing.xl,
                opacity: 0.6,
              }}>
                📦
              </div>
              <h2 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
                marginBottom: theme.spacing.lg,
              }}>
                No Artifacts Yet
              </h2>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
                lineHeight: '1.6',
              }}>
                Go to the home page to create a new artifact by describing what you want to build.
              </p>
              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={handleNavigateToLanding}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    background: theme.colors.accent.primary,
                    border: `1px solid ${theme.colors.border}`,
                    color: COLORS.WHITE,
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    transition: `background ${theme.animation.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colorVariants.accent.primaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.accent.primary;
                  }}
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
            );
          }

          // STATE B & C: Show panels based on user toggles and artifact state
          return (
            <>
              {/* Chat Panel - Show when toggled AND (has artifact OR has pending work) */}
              {showChat && (
          <div style={{
            width: panelWidth,
            height: '100%',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadows.md,
            overflow: 'hidden',
          }}>
            <ChatPanel messages={chatMessages} thinkingState={thinking} onFixBug={handleSendMessage} />
            <ChatInput onSend={handleSendMessage} />
          </div>
              )}

              {/* Editor Panel - Only show when there's an active artifact */}
              {activeArtifact && showCode && (
          <div style={{
            width: panelWidth,
            height: '100%',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
          }}>
            {/* Editor Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.bg.secondary,
              borderBottom: `1px solid ${theme.colors.bg.border}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: '#808080',
                  fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                }}>
                  <span style={{ opacity: 0.7 }}>&lt;</span>
                  <span style={{ margin: '0 2px', opacity: 0.5 }}>/</span>
                  <span style={{ opacity: 0.7 }}>&gt;</span>
                </div>
                <span>Code Editor</span>
              </div>
            </div>

            {/* Editor Content with File Explorer */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* File Explorer Sidebar - Hidden on mobile */}
              {!isMobile && (
                <div style={{ width: '220px', height: '100%', overflow: 'hidden' }}>
                  <FileExplorer
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={setActiveFile}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                  />
                </div>
              )}

              {/* Editor Area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* File Tabs */}
                <FileTabs
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                />

                {/* Monaco Editor */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <EditorPanel
                    files={files}
                    activeFile={activeFile}
                    onFileChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </div>
              )}

              {/* Preview Panel - Only show when there's an active artifact */}
              {activeArtifact && showPreview && (
                <div style={{
                  width: panelWidth,
                  height: '100%',
                  background: theme.colors.bg.primary,
                  borderRadius: theme.radius.lg,
                  boxShadow: theme.shadows.md,
                  overflow: 'hidden',
                }}>
                  <PreviewPanel files={files} onError={handlePreviewError} />
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default App;
