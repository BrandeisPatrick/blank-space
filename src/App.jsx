import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { useArtifacts } from "./contexts/ArtifactContext";
import { useConversation } from "./contexts/ConversationContext";
import { getTheme } from "./styles/theme";
import { ChatPage, AppsPage } from "./components/pages";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAIChat } from "./hooks/useAIChat";
import { TIMING } from "./constants";
import "./styles/App.css";

function App() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { loading: authLoading } = useAuth();
  const {
    activeArtifact,
    updateArtifactFiles,
    updateChatHistory,
    createArtifact,
    activeArtifactId,
    updateArtifactIcon,
    renameArtifact
  } = useArtifacts();
  const { messages } = useConversation();

  // Model tier state
  const [modelTier, setModelTier] = useLocalStorage('modelTier', 'lite');

  // Migrate old tier values
  useEffect(() => {
    if (modelTier !== 'lite' && modelTier !== 'pro') {
      setModelTier('lite');
    }
  }, [modelTier, setModelTier]);

  // Files state for code editing
  const [files, setFiles] = useState(activeArtifact?.files || {});
  const [activeFile, setActiveFile] = useState('App.jsx');

  // Error deduplication
  const recentErrors = useRef(new Map());

  // Track artifact switches
  const previousArtifactIdRef = useRef(null);

  // Use AI chat hook for message processing
  const {
    sendMessage,
    debug,
    isProcessing,
    isDebugging,
    setMessages: setChatMessages
  } = useAIChat({
    files,
    setFiles,
    modelTier,
    activeArtifactId,
    createArtifact,
    updateArtifactFiles,
    updateChatHistory,
  });

  // Sync files when switching artifacts
  useEffect(() => {
    if (activeArtifact) {
      const isSwitchingArtifacts = previousArtifactIdRef.current !== null &&
                                    previousArtifactIdRef.current !== activeArtifactId;
      const stateIsEmpty = Object.keys(files).length === 0;

      if (isSwitchingArtifacts || stateIsEmpty) {
        setFiles(activeArtifact.files);
        setChatMessages(activeArtifact.chatHistory || []);

        const fileNames = Object.keys(activeArtifact.files);
        if (fileNames.length > 0 && !activeArtifact.files[activeFile]) {
          setActiveFile(fileNames[0]);
        }
      }
    } else {
      setFiles({});
    }
    previousArtifactIdRef.current = activeArtifactId;
  }, [activeArtifactId]);

  // Handle preview errors with deduplication
  const handlePreviewError = useCallback((error) => {
    const signature = `${error.file || 'unknown'}:${error.line || 0}:${error.message}`;
    const lastShown = recentErrors.current.get(signature);
    const now = Date.now();

    if (!lastShown || now - lastShown > TIMING.ERROR_DEDUP_WINDOW_MS) {
      recentErrors.current.set(signature, now);

      setChatMessages(prev => [...prev, {
        type: 'error',
        error: error,
        timestamp: now
      }]);

      if (recentErrors.current.size > TIMING.MAX_RECENT_ERRORS) {
        const entries = [...recentErrors.current.entries()];
        entries.slice(0, TIMING.ERROR_CLEANUP_COUNT).forEach(([sig]) => recentErrors.current.delete(sig));
      }
    }
  }, [setChatMessages]);

  // Handle file changes
  const handleFileChange = useCallback((filename, newContent) => {
    const updatedFiles = { ...files, [filename]: newContent };
    setFiles(updatedFiles);
    if (activeArtifactId) {
      updateArtifactFiles(activeArtifactId, updatedFiles);
    }
  }, [files, activeArtifactId, updateArtifactFiles]);

  // Clean up old storage key
  useEffect(() => {
    sessionStorage.removeItem('guestBannerDismissed');
  }, []);

  // Auth loading screen
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: theme.spacing.lg, display: 'flex', justifyContent: 'center' }}>
            <svg
              width="64"
              height="80"
              viewBox="0 0 24 30"
              fill="none"
              stroke={theme.colors.text.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
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
          <p style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.text.secondary }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', minHeight: '100vh', overflow: 'hidden' }}>
        <Routes>
          <Route
            path="/"
            element={
              <ChatPage
                chatMessages={messages}
                onSendMessage={sendMessage}
                isAIProcessing={isProcessing}
                modelTier={modelTier}
                onChangeModelTier={setModelTier}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <ChatPage
                chatMessages={messages}
                onSendMessage={sendMessage}
                isAIProcessing={isProcessing}
                modelTier={modelTier}
                onChangeModelTier={setModelTier}
              />
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ChatPage
                chatMessages={messages}
                onSendMessage={sendMessage}
                isAIProcessing={isProcessing}
                modelTier={modelTier}
                onChangeModelTier={setModelTier}
              />
            }
          />
          <Route
            path="/apps"
            element={
              <AppsPage
                files={files}
                onFileChange={handleFileChange}
                onError={handlePreviewError}
                onDebug={(errors) => debug({ errors })}
                isDebugging={isDebugging}
                onIconChange={(artifactId, iconId) => updateArtifactIcon(artifactId, iconId)}
                onRename={(artifactId, newName) => renameArtifact(artifactId, newName)}
              />
            }
          />
        </Routes>
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

export default App;
