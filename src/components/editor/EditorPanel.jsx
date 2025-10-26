import { Editor } from '@monaco-editor/react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { useState, useEffect } from 'react'
import { DocumentIcon } from '../icons'
import { VersionControlToolbar } from '../versionControl/VersionControlToolbar'
import { useArtifacts } from '../../contexts/ArtifactContext'

export const EditorPanel = ({ files, activeFile, onFileChange }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const { undoFileChange, redoFileChange, canUndoFile, canRedoFile } = useArtifacts()

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && activeFile) {
        if (canUndoFile(activeFile)) {
          e.preventDefault()
          const result = undoFileChange(activeFile)
          if (result) {
            console.log(`⌨️ Keyboard undo: ${activeFile} → v${result.version}`)
          }
        }
      }

      // Ctrl+Y or Cmd+Shift+Z for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        if (activeFile && canRedoFile(activeFile)) {
          e.preventDefault()
          const result = redoFileChange(activeFile)
          if (result) {
            console.log(`⌨️ Keyboard redo: ${activeFile} → v${result.version}`)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, undoFileChange, redoFileChange, canUndoFile, canRedoFile])

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Version Control Toolbar */}
      <VersionControlToolbar activeFile={activeFile} />

      {/* Monaco Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
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
    </div>
  )
}
