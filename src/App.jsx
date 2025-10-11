import { useState, useEffect } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useArtifacts } from "./contexts/ArtifactContext";
import { getTheme } from "./styles/theme";
import { LandingPage } from "./components/LandingPage";
import { SignInPage } from "./components/SignInPage";
import { TopBar } from "./components/TopBar";
import { ChatPanel } from "./components/ChatPanel";
import { ChatInput } from "./components/ChatInput";
import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { FileTabs } from "./components/FileTabs";
import { FileExplorer } from "./components/FileExplorer";
import { ArtifactSidebar } from "./components/ArtifactSidebar";
import { useThinkingState } from "./hooks/useThinkingState";
import { useIsMobile } from "./hooks/useIsMobile";
import { processMessage } from "./services/agentOrchestrator";
import { reactExamples } from "./templates";
import "./styles/App.css";

function App() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { activeArtifact, updateArtifactFiles, createArtifact, activeArtifactId } = useArtifacts();
  const isMobile = useIsMobile();

  // Route state: 'landing' or 'studio'
  const [currentRoute, setCurrentRoute] = useState('landing');

  // Thinking state for CompactThinkingPanel
  const thinking = useThinkingState({
    autoCollapse: true,
    collapseDelay: 3000
  });

  // State management
  const [chatMessages, setChatMessages] = useState([]);
  const [files, setFiles] = useState(activeArtifact?.files || {});
  const [activeFile, setActiveFile] = useState('App.jsx');

  // Sync files with active artifact
  useEffect(() => {
    if (activeArtifact) {
      setFiles(activeArtifact.files);
      // Set active file to first available file
      const fileNames = Object.keys(activeArtifact.files);
      if (fileNames.length > 0 && !activeArtifact.files[activeFile]) {
        setActiveFile(fileNames[0]);
      }
    } else {
      // Empty state - no artifacts
      setFiles({});
    }
  }, [activeArtifactId]);

  // Panel visibility
  const [showChat, setShowChat] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(false);

  // Navigation handlers
  const handleTryNow = () => {
    setCurrentRoute('studio');
    if (isMobile) {
      // On mobile, only show preview by default
      setShowChat(false);
      setShowCode(false);
      setShowPreview(true);
    } else {
      setShowChat(true);
      setShowCode(false);  // Hide code panel
      setShowPreview(true);
    }
  };

  const handleNavigateToSignIn = () => setCurrentRoute('signin');
  const handleNavigateToLanding = () => setCurrentRoute('landing');

  const handleSignIn = async (email, password) => {
    // For now, simulate authentication
    console.log('Signing in with:', email);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Navigate to studio after successful sign-in
    setCurrentRoute('studio');
    if (isMobile) {
      // On mobile, only show preview by default
      setShowChat(false);
      setShowCode(false);
      setShowPreview(true);
    } else {
      setShowChat(true);
      setShowCode(false);  // Hide code panel
      setShowPreview(true);
    }
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
        content: `ℹ️ You've used ${rateLimit.used} of your ${rateLimit.limit} daily requests.\n${rateLimit.remaining} requests remaining today.`,
        timestamp: Date.now()
      }]);
      setRateLimitWarningsShown(prev => ({ ...prev, fifty: true }));
    }

    // 75% warning
    if (percentUsed >= 75 && !rateLimitWarningsShown.seventyFive) {
      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: `⚠️ Warning: You've used 75% of your daily quota.\nOnly ${rateLimit.remaining} requests remaining. Resets at midnight UTC.`,
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

    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handle chat message with AI agents
  const handleSendMessage = async (message) => {
    // Add user message
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMessage]);

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
        // Intent classification step - log to console instead of showing in chat
        console.log('🎯 Intent Classification:', update.content);
        currentStepId = thinking.addStep('Understanding your request', 'active');
        thinking.completeStep(currentStepId);
        currentStepId = null;
        return; // Don't add to chat messages
      } else if (update.type === 'plan') {
        // Planning step - log to console instead of showing in chat
        console.log('📋 Plan:', update.content);
        currentStepId = thinking.addStep('Planning solution', 'active');
        thinking.completeStep(currentStepId);
        thinking.startStreaming();
        currentStepId = null;
        return; // Don't add to chat messages
      }

      setChatMessages(prev => [...prev, { ...update, timestamp: Date.now() }]);
    };

    try {
      // Process message with AI agents
      const result = await processMessage(message, files, onUpdate);

      if (result.success && result.fileOperations) {
        // Add generating steps for each file
        result.fileOperations.forEach((op, index) => {
          const stepId = thinking.addStep(`Generating ${op.filename}`, 'active');
          setTimeout(() => thinking.completeStep(stepId), 100 * (index + 1));
        });

        // Create or update artifact with generated files
        const newFiles = { ...files };

        result.fileOperations.forEach(op => {
          newFiles[op.filename] = op.content;
        });

        // If no active artifact, create a new one
        if (!activeArtifactId) {
          const artifactName = result.plan?.summary?.slice(0, 50) || 'New Project';
          createArtifact(artifactName, newFiles);
        } else {
          // Update existing artifact
          setFiles(newFiles);
          updateArtifactFiles(activeArtifactId, newFiles);
        }

        // Switch to the first created/modified file
        if (result.fileOperations.length > 0) {
          setActiveFile(result.fileOperations[0].filename);
        }

        // Ensure code and preview panels are visible
        setShowCode(true);
        setShowPreview(true);

        // Complete thinking process
        setTimeout(() => thinking.complete(), 500);

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
          content: `❌ Daily limit reached (${error.rateLimit.used}/${error.rateLimit.limit} requests used).\nYour quota will reset at midnight UTC.\nPlease try again later.`,
          timestamp: Date.now()
        }]);
      } else {
        thinking.error('An error occurred while processing your request');
      }
    }
  };

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

  // Calculate panel widths
  const visiblePanels = [showChat, showCode, showPreview].filter(Boolean).length;
  const panelWidth = isMobile ? '100%' : (visiblePanels > 0 ? `${100 / visiblePanels}%` : '100%');

  // Show landing page if route is 'landing'
  if (currentRoute === 'landing') {
    return (
      <LandingPage
        onTryNow={handleTryNow}
        onSignIn={handleNavigateToSignIn}
      />
    );
  }

  // Show sign in page if route is 'signin'
  if (currentRoute === 'signin') {
    return (
      <SignInPage
        onNavigateToMain={handleNavigateToLanding}
        onSignIn={handleSignIn}
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
            if (panel === 'chat') {
              setShowChat(true);
              setShowCode(false);
              setShowPreview(false);
            } else if (panel === 'code') {
              setShowChat(false);
              setShowCode(true);
              setShowPreview(false);
            } else if (panel === 'preview') {
              setShowChat(false);
              setShowCode(false);
              setShowPreview(true);
            }
          } else {
            // On desktop, toggle panels independently
            if (panel === 'chat') setShowChat(!showChat);
            if (panel === 'code') setShowCode(!showCode);
            if (panel === 'preview') setShowPreview(!showPreview);
          }
        }}
        onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
        onLoadExample={(exampleId) => {
          const selectedExample = reactExamples[exampleId];
          if (selectedExample) {
            // Create new artifact for the example
            createArtifact(selectedExample.name, selectedExample.files);
            // Show only preview panel for both mobile and desktop
            setShowChat(false);
            setShowCode(false);
            setShowPreview(true);
          }
        }}
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
        {/* Empty State - No Artifacts */}
        {!activeArtifact && (
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
                Create a new artifact to start building your React application, or load an example from the templates.
              </p>
              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => {
                    createArtifact('My Project');
                    setShowCode(true);
                    setShowPreview(true);
                  }}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.bg.border}`,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    transition: `opacity ${theme.animation.fast}`,
                    opacity: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>+</span>
                  Create New Artifact
                </button>
                <button
                  onClick={() => setShowArtifacts(true)}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.bg.border}`,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                    transition: `opacity ${theme.animation.fast}`,
                    opacity: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Browse Examples
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regular Panels - Only show when there's an active artifact */}
        {activeArtifact && (
          <>
        {/* Chat Panel */}
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
            <ChatPanel messages={chatMessages} thinkingState={thinking} />
            <ChatInput onSend={handleSendMessage} />
          </div>
        )}

        {/* Editor Panel */}
        {showCode && (
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

        {/* Preview Panel */}
        {showPreview && (
          <div style={{
            width: panelWidth,
            height: '100%',
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadows.md,
            overflow: 'hidden',
          }}>
            <PreviewPanel files={files} />
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default App;
