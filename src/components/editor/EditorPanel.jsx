import { Editor } from '@monaco-editor/react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { useState, useEffect } from 'react'
import { DocumentIcon } from '../icons'

export const EditorPanel = ({ files, activeFile: initialActiveFile, onFileChange }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [selectedFile, setSelectedFile] = useState(initialActiveFile)

  const fileNames = Object.keys(files || {})

  // Update selected file when files change
  useEffect(() => {
    if (fileNames.length > 0 && !files[selectedFile]) {
      setSelectedFile(fileNames[0])
    }
  }, [files, selectedFile, fileNames])

  const getLanguage = (filename) => {
    if (!filename) return 'javascript'
    if (filename.endsWith('.html')) return 'html'
    if (filename.endsWith('.css')) return 'css'
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript'
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript'
    if (filename.endsWith('.json')) return 'json'
    return 'plaintext'
  }

  const getFileIcon = (filename) => {
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) return '⚛️'
    if (filename.endsWith('.js') || filename.endsWith('.ts')) return '📜'
    if (filename.endsWith('.css')) return '🎨'
    if (filename.endsWith('.html')) return '🌐'
    if (filename.endsWith('.json')) return '📋'
    return '📄'
  }

  if (!fileNames.length) {
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
          }}>No files</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File Tabs */}
      <div style={{
        display: 'flex',
        gap: '1px',
        background: mode === 'dark' ? '#252526' : '#f3f3f3',
        borderBottom: `1px solid ${mode === 'dark' ? '#3c3c3c' : '#e0e0e0'}`,
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        {fileNames.map((filename) => (
          <button
            key={filename}
            onClick={() => setSelectedFile(filename)}
            style={{
              padding: '6px 12px',
              background: selectedFile === filename
                ? (mode === 'dark' ? '#1e1e1e' : '#ffffff')
                : (mode === 'dark' ? '#2d2d2d' : '#ececec'),
              border: 'none',
              borderBottom: selectedFile === filename
                ? `2px solid ${theme.colors.primary}`
                : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
              color: selectedFile === filename
                ? (mode === 'dark' ? '#ffffff' : '#333333')
                : (mode === 'dark' ? '#969696' : '#666666'),
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '11px' }}>{getFileIcon(filename)}</span>
            {filename}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          key={selectedFile}
          height="100%"
          defaultLanguage={getLanguage(selectedFile)}
          language={getLanguage(selectedFile)}
          value={files[selectedFile] || ''}
          onChange={(value) => onFileChange(selectedFile, value)}
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
    </div>
  )
}
