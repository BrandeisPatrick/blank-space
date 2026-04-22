"use dom";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview as SandpackPreviewPanel,
  SandpackConsole,
  useSandpackConsole,
} from "@codesandbox/sandpack-react";
import { useEffect } from "react";

const ErrorListener = ({ onError }) => {
  const { logs } = useSandpackConsole({ resetOnPreviewRestart: true });

  useEffect(() => {
    const errors = logs.filter((log) => log.level === "error");
    if (errors.length === 0) return;

    const latest = errors[errors.length - 1];
    const errorData = {
      message: latest.data?.[0] || "Unknown error",
      file: null,
      line: null,
      column: null,
    };

    const match = latest.data?.[0]?.match(/([^/]+\.(jsx?|tsx?)):(\d+):(\d+)/);
    if (match) {
      errorData.file = match[1];
      errorData.line = parseInt(match[3]);
      errorData.column = parseInt(match[4]);
    }

    onError?.(errorData);
  }, [logs, onError]);

  return null;
};

export default function SandpackPreview({
  files,
  theme = "dark",
  layout = "horizontal",
  showConsole = true,
  editorHeight,
  onError,
}) {
  const height = editorHeight ?? (layout === "vertical" ? 400 : 800);

  return (
    <SandpackProvider
      template="react"
      theme={theme}
      files={files}
      options={{
        showNavigator: false,
        showTabs: true,
        showLineNumbers: true,
        showInlineErrors: true,
        wrapContent: true,
        editorHeight: height,
        bundlerURL: "https://sandpack-bundler.codesandbox.io",
        skipEval: false,
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
    >
      <SandpackLayout className={layout === "vertical" ? "vertical-layout" : ""}>
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          showInlineErrors
          wrapContent
          style={{ height, flex: 1 }}
        />
        <SandpackPreviewPanel
          showOpenInCodeSandbox={true}
          showRefreshButton={true}
          showRestartButton={true}
          style={{ height, flex: 1 }}
        />
      </SandpackLayout>
      {showConsole && (
        <SandpackConsole
          showHeader
          resetOnPreviewRestart
          style={{ height: 200 }}
        />
      )}
      <ErrorListener onError={onError} />
    </SandpackProvider>
  );
}
