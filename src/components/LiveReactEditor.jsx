import {
  Sandpack,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack
} from "@codesandbox/sandpack-react";
import { useState, useEffect } from "react";
import SandpackErrorBoundary from "./SandpackErrorBoundary";
import "../styles/LiveReactEditor.css";

// Loading wrapper component
const SandpackLoadingWrapper = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Monitor for loading completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Monitor network errors
    const handleError = (event) => {
      if (event.message?.includes('sandpack') || event.filename?.includes('sandpack')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, [retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  if (hasError && retryCount < 3) {
    // Auto-retry up to 3 times
    setTimeout(handleRetry, 1000);
  }

  return (
    <>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(30, 30, 30, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            Loading Sandpack Editor...
            {retryCount > 0 && ` (Retry ${retryCount}/3)`}
          </p>
        </div>
      )}
      {children}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

const LiveReactEditor = ({
  initialCode,
  initialFiles,
  showConsole = true,
  theme = "dark",
  layout = "horizontal"
}) => {
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedLayout, setSelectedLayout] = useState(layout);
  const [showConsolePanel, setShowConsolePanel] = useState(showConsole);
  const [cdnStatus, setCdnStatus] = useState('checking'); // 'checking', 'online', 'offline'

  // Check CDN connectivity
  useEffect(() => {
    const checkCdnConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://sandpack-bundler.codesandbox.io/', {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors'
        });

        clearTimeout(timeoutId);
        setCdnStatus('online');
      } catch (error) {
        console.warn('Sandpack CDN connectivity issue:', error);
        setCdnStatus('offline');
      }
    };

    checkCdnConnection();
    // Re-check every 30 seconds
    const interval = setInterval(checkCdnConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  // Default code if none provided
  const defaultCode = initialCode || `import { useState } from 'react';

export default function App() {
  return (
    <div className="app">
      <h1>Hello, Live React Editor!</h1>
      <p>Edit this code and see it update live!</p>
      <Counter />
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ margin: '20px 0' }}>
      <button onClick={() => setCount(count + 1)}>
        Clicked {count} times
      </button>
    </div>
  );
}`;

  // Setup files for Sandpack
  const files = initialFiles || {
    "/App.js": {
      code: defaultCode,
    },
    "/styles.css": {
      code: `body {
  font-family: sans-serif;
  padding: 20px;
}

.app {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #0066cc;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0052a3;
}`,
    },
  };

  return (
    <SandpackErrorBoundary>
      <div className="live-editor-container">
        {cdnStatus === 'offline' && (
          <div style={{
            background: '#ff6b6b',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <span>⚠️</span>
            <span>
              <strong>CDN Connectivity Issue:</strong> Sandpack CDN may be unreachable.
              The editor may experience loading issues.
            </span>
          </div>
        )}
        <div className="editor-controls">
          <div className="control-group">
            <label>Theme:</label>
            <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="control-group">
            <label>Layout:</label>
            <select value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showConsolePanel}
                onChange={(e) => setShowConsolePanel(e.target.checked)}
              />
              Show Console
            </label>
          </div>
        </div>

        <div className={`editor-wrapper layout-${selectedLayout}`} style={{ position: 'relative' }}>
          <SandpackLoadingWrapper>
            <SandpackProvider
              template="react"
              theme={selectedTheme}
              files={files}
              options={{
                showNavigator: false,
                showTabs: true,
                showLineNumbers: true,
                showInlineErrors: true,
                wrapContent: true,
                editorHeight: selectedLayout === "vertical" ? 400 : 800,
                bundlerURL: "https://sandpack-bundler.codesandbox.io",
                skipEval: false,
                recompileMode: "delayed",
                recompileDelay: 500,
              }}
            >
              <SandpackLayout className={selectedLayout === "vertical" ? "vertical-layout" : ""}>
                <SandpackCodeEditor
                  showTabs
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  style={{ height: selectedLayout === "vertical" ? 400 : 800, flex: 1 }}
                />
                <SandpackPreview
                  showOpenInCodeSandbox={true}
                  showRefreshButton={true}
                  showRestartButton={true}
                  style={{ height: selectedLayout === "vertical" ? 400 : 800, flex: 1 }}
                />
              </SandpackLayout>
              {showConsolePanel && (
                <SandpackConsole
                  showHeader
                  resetOnPreviewRestart
                  style={{ height: 200 }}
                />
              )}
            </SandpackProvider>
          </SandpackLoadingWrapper>
        </div>
      </div>
    </SandpackErrorBoundary>
  );
};

// Simpler version for quick usage
export const SimpleLiveEditor = ({ code, theme = "dark" }) => {
  return (
    <SandpackErrorBoundary>
      <div style={{ position: 'relative' }}>
        <SandpackLoadingWrapper>
          <Sandpack
            template="react"
            theme={theme}
            files={{
              "/App.js": code || `export default function App() {
  return <h1>Hello World!</h1>
}`
            }}
            options={{
              showNavigator: false,
              showLineNumbers: true,
              editorHeight: 350,
              bundlerURL: "https://sandpack-bundler.codesandbox.io",
              recompileMode: "delayed",
              recompileDelay: 500,
            }}
          />
        </SandpackLoadingWrapper>
      </div>
    </SandpackErrorBoundary>
  );
};

export default LiveReactEditor;
