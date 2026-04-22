"use dom";

// Mobile-local Sandpack DOM component.
// The shared src/components/dom/SandpackPreview.jsx hardcodes the SOL
// bundler URL (sandpack-bundler.codesandbox.io), which currently times
// out inside WKWebView. This variant leaves bundlerURL at the sandpack
// default (versioned codesandbox.io host) and drops the console + split
// editor layout in favor of a preview-only layout to minimize what has
// to handshake across the iframe boundary.

import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPanel,
} from "@codesandbox/sandpack-react";

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
    </SandpackProvider>
  );
}
