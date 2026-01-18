import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { useConversation } from "./contexts/ConversationContext";
import { getTheme } from "./styles/theme";
import { ChatPage, ComputerPage, FilesPage } from "./components/pages";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useChat } from "./hooks/useChat";
import { useFileSystem } from "./contexts/FileSystemContext";
import { TIMING } from "./constants";
import "./styles/App.css";

function App() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { loading: authLoading } = useAuth();
  const {
    projects,
    activeProject,
    activeProjectSlug,
    updateProjectMeta,
    deleteProject,
    loadProject,
    getFilesByProjectSlug
  } = useFileSystem();
  const { messages } = useConversation();

  // Model tier state
  const [modelTier, setModelTier] = useLocalStorage('modelTier', 'lite');

  // Migrate old tier values
  useEffect(() => {
    if (modelTier !== 'lite' && modelTier !== 'pro') {
      setModelTier('lite');
    }
  }, [modelTier, setModelTier]);

  // Files state for code editing (loaded from FileSystem)
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState('App.jsx');
  const [filesLoading, setFilesLoading] = useState(false);

  // Error deduplication
  const recentErrors = useRef(new Map());

  // Track project switches
  const previousProjectSlugRef = useRef(null);

  // Use AI chat hook for message processing
  const {
    sendMessage,
    debug,
    isProcessing,
    isDebugging,
    setMessages: setChatMessages
  } = useChat({
    files,
    setFiles,
    modelTier,
  });

  // Load files from FileSystem when project changes
  useEffect(() => {
    const loadFilesFromFileSystem = async () => {
      if (!activeProjectSlug) {
        setFiles({});
        return;
      }

      setFilesLoading(true);
      try {
        const loadedFiles = await getFilesByProjectSlug(activeProjectSlug);
        setFiles(loadedFiles);

        // Set active file to first available file
        const fileNames = Object.keys(loadedFiles);
        if (fileNames.length > 0 && !loadedFiles[activeFile]) {
          // Prefer App.jsx, then any .jsx file, then first file
          const preferredFile = fileNames.find(f => f === 'App.jsx')
            || fileNames.find(f => f.endsWith('.jsx'))
            || fileNames[0];
          setActiveFile(preferredFile);
        }
      } catch (err) {
        console.error('[App] Failed to load files from FileSystem:', err);
        setFiles({});
      } finally {
        setFilesLoading(false);
      }
    };

    const isSwitchingProjects = previousProjectSlugRef.current !== null &&
                                  previousProjectSlugRef.current !== activeProjectSlug;

    // Load files when switching projects or when project is first selected
    if (isSwitchingProjects || (activeProjectSlug && Object.keys(files).length === 0)) {
      loadFilesFromFileSystem();
    }

    previousProjectSlugRef.current = activeProjectSlug;
  }, [activeProjectSlug, getFilesByProjectSlug]);

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

  // Handle file changes - updates local state only, FileSystem sync happens on save
  const handleFileChange = useCallback((filename, newContent) => {
    const updatedFiles = { ...files, [filename]: newContent };
    setFiles(updatedFiles);
    // Files are synced to FileSystem via syncChangesFromAI, not stored in artifact
  }, [files]);

  // Handle debug from preview window - starts new chat with auto-send
  const handleDebugNewChat = useCallback(({ appId, appName, errors }) => {
    // Build debug message with full error details (including source file and line)
    const errorText = errors.slice(0, 3).map(e => {
      let errorLine = e.message;
      if (e.source || e.line) {
        const location = [e.source, e.line].filter(Boolean).join(':');
        errorLine += ` (${location})`;
      }
      return errorLine;
    }).join('\n');
    const debugMessage = `@${appName}\n\n${errorText}\n\nFix the bug`;

    // Send with mentionedApp options - files are loaded from FileSystem in useChat
    sendMessage(debugMessage, null, {
      mentionedAppId: appId,
      mentionedAppFiles: files, // Use current files state (from FileSystem)
      isDebugMode: true
    });
  }, [sendMessage, files]);

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
              <ComputerPage
                files={files}
                filesLoading={filesLoading}
                onFileChange={handleFileChange}
                onError={handlePreviewError}
                onDebug={(errors) => debug({ errors })}
                onDebugNewChat={handleDebugNewChat}
                isDebugging={isDebugging}
                onIconChange={(projectSlug, iconId) => updateProjectMeta(projectSlug, { icon: iconId })}
                onRename={(projectSlug, newName) => updateProjectMeta(projectSlug, { name: newName })}
              />
            }
          />
          <Route
            path="/files"
            element={<FilesPage />}
          />
        </Routes>
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

export default App;
