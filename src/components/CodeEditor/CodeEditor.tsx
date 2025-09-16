import { Editor } from '@monaco-editor/react'
import { useTheme } from '../../pages/ThemeContext'

interface CodeEditorProps {
  content: string
  language: string
  onChange: (value: string | undefined) => void
}

export const CodeEditor = ({ content, language, onChange }: CodeEditorProps) => {
  const { mode } = useTheme()
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={content}
        onChange={onChange}
        theme={mode === 'dark' ? 'vs-dark' : 'vs-light'}
        options={{
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
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
    </div>
  )
}