import { Editor } from '@monaco-editor/react'
import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'
import { useState } from 'react'
import { DocumentIcon } from './icons'

export const EditorPanel = ({ files, activeFile, onFileChange }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const getLanguage = (filename) => {
    if (!filename) return 'javascript'
    if (filename.endsWith('.html')) return 'html'
    if (filename.endsWith('.css')) return 'css'
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript'
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript'
    if (filename.endsWith('.json')) return 'json'
    return 'plaintext'
  }

  if (!activeFile || !files[activeFile]) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        color: mode === 'dark' ? '#cccccc' : '#333333',
      }}>
        <div style={{ textAlign: 'center', marginTop: '-70px' }}>
          <div style={{ marginBottom: theme.spacing.lg, opacity: 0.6, display: 'flex', justifyContent: 'center' }}>
            <DocumentIcon size={48} color={mode === 'dark' ? '#888888' : '#999999'} />
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
          }}>No file selected</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Editor
        key={activeFile}
        height="100%"
        defaultLanguage={getLanguage(activeFile)}
        language={getLanguage(activeFile)}
        value={files[activeFile] || ''}
        onChange={(value) => onFileChange(activeFile, value)}
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
    </div>
  )
}
