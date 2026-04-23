"use dom";

// Mobile-local Monaco wrapper with touch-friendly defaults.
// The shared src/components/dom/MonacoEditor.jsx is tuned for desktop
// (fontSize 14, thin scrollbars, default autocomplete). On iPhone the
// same settings produce a cramped editor with tap targets that miss.
// This variant bumps the font, widens scrollbars, disables the
// long-press context menu (iOS already offers copy/paste via selection),
// and turns on word wrap so code doesn't require horizontal scroll.

import { Editor } from "@monaco-editor/react";

export default function MonacoEditorNative({
  value,
  onChange,
  language = "javascript",
  mode = "light",
  height = "100%",
  instanceKey,
}) {
  return (
    <Editor
      key={instanceKey}
      height={height}
      defaultLanguage={language}
      language={language}
      value={value}
      onChange={(newValue) => onChange?.(newValue)}
      theme={mode === "dark" ? "vs-dark" : "vs-light"}
      options={{
        fontSize: 16,
        fontFamily: 'Menlo, "SF Mono", Monaco, "Ubuntu Mono", Consolas, monospace',
        lineNumbers: "on",
        lineNumbersMinChars: 2,
        lineDecorationsWidth: 6,
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: "on",
        smoothScrolling: true,
        cursorWidth: 3,
        cursorBlinking: "smooth",
        contextmenu: false,
        hover: { enabled: false },
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        parameterHints: { enabled: false },
        folding: false,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
          verticalScrollbarSize: 14,
          horizontalScrollbarSize: 14,
          verticalHasArrows: false,
          horizontalHasArrows: false,
        },
        padding: { top: 20, bottom: 20 },
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}
