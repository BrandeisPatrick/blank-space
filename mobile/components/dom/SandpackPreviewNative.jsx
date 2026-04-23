"use dom";

// Mobile-local Sandpack DOM component.
// The shared src/components/dom/SandpackPreview.jsx hardcodes the SOL
// bundler URL (sandpack-bundler.codesandbox.io), which currently times
// out inside WKWebView. This variant leaves bundlerURL at the sandpack
// default (versioned codesandbox.io host) and drops the console + split
// editor layout in favor of a preview-only layout to minimize what has
// to handshake across the iframe boundary.

import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPanel,
  useSandpackConsole,
} from "@codesandbox/sandpack-react";

const ErrorListener = ({ onError }) => {
  const { logs } = useSandpackConsole({ resetOnPreviewRestart: true });

  useEffect(() => {
    if (!onError) return;
    const errors = logs.filter((log) => log.level === "error");
    if (errors.length === 0) return;

    const latest = errors[errors.length - 1];
    const message = latest.data?.[0] || "Unknown error";
    const errorData = { message, file: null, line: null, column: null };

    const match = typeof message === "string" && message.match(/([^/]+\.(jsx?|tsx?)):(\d+):(\d+)/);
    if (match) {
      errorData.file = match[1];
      errorData.line = parseInt(match[3], 10);
      errorData.column = parseInt(match[4], 10);
    }

    onError(errorData);
  }, [logs, onError]);

  return null;
};

export default function SandpackPreviewNative({
  files,
  theme = "dark",
  height = 600,
  onError,
}) {
  return (
    <SandpackProvider
      template="react"
      theme={theme}
      files={files}
      options={{
        recompileMode: "delayed",
        recompileDelay: 500,
        showLoadingScreen: true,
        showErrorScreen: true,
      }}
    >
      <div
        style={{
          width: "100vw",
          height,
          display: "flex",
          background: theme === "dark" ? "#1e1e1e" : "#fff",
        }}
      >
        <SandpackPreviewPanel
          showOpenInCodeSandbox={false}
          showRefreshButton
          showRestartButton
          style={{
            height,
            width: "100%",
            flex: 1,
            border: "none",
            background: "#fff",
          }}
        />
      </div>
      <ErrorListener onError={onError} />
    </SandpackProvider>
  );
}
