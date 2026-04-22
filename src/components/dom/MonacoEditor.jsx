"use dom";

import { Editor } from '@monaco-editor/react';

export default function MonacoEditor({
  value,
  onChange,
  language = 'javascript',
  mode = 'light',
  height = '100%',
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
      theme={mode === 'dark' ? 'vs-dark' : 'vs-light'}
      options={{
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
        },
        padding: { top: 16, bottom: 16 },
        bracketPairColorization: { enabled: true },
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
      }}
    />
  );
}
