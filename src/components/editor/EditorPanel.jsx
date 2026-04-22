import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { useState, useEffect } from 'react'
import { DocumentIcon } from '../icons'
import MonacoEditor from '../dom/MonacoEditor'

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
        background: theme.colors.bg.primary,
        color: theme.colors.text.primary,
      }}>
        <div style={{ textAlign: 'center', marginTop: '-70px' }}>
          <div style={{ marginBottom: theme.spacing.lg, opacity: 0.6, display: 'flex', justifyContent: 'center' }}>
            <DocumentIcon size={48} color={theme.colors.text.tertiary} />
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
                ? theme.colors.text.primary
                : theme.colors.text.secondary,
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
        <MonacoEditor
          instanceKey={selectedFile}
          language={getLanguage(selectedFile)}
          value={files[selectedFile] || ''}
          onChange={(value) => onFileChange(selectedFile, value)}
          mode={mode}
        />
      </div>
    </div>
  )
}
