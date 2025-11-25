import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import { PreviewPanel } from '../preview/PreviewPanel'
import { EditorPanel } from '../editor/EditorPanel'
import { XIcon, EyeIcon, CodeIcon } from '../icons'

export const FloatingBrowserWindow = ({
  visible = false,
  artifact = null,
  files = {},
  onClose,
  onFileChange,
  onError
}) => {
  const [view, setView] = useState('preview') // 'preview' or 'code'
  const [activeFile, setActiveFile] = useState('App.jsx')
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Update active file when files change
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      const fileNames = Object.keys(files)
      if (!files[activeFile]) {
        setActiveFile(fileNames[0])
      }
    }
  }, [files, activeFile])

  // Center window initially
  const initialX = (window.innerWidth - 800) / 2
  const initialY = (window.innerHeight - 600) / 2

  const { position, isDragging, handleMouseDown: handleDrag, style: dragStyle } = useDraggable(
    { x: initialX, y: initialY },
    '.window-titlebar' // Only allow dragging from titlebar
  )

  const { size, style: resizeStyle, ResizeHandles } = useResizable(
    { width: 800, height: 600 },
    { width: 400, height: 300 }
  )

  if (!visible || !artifact) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        ...dragStyle,
        ...resizeStyle,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: theme.radius['2xl'],
        ...createGlassEffect(theme),
        boxShadow: theme.shadows.xl,
        overflow: 'hidden',
      }}
    >
      {/* Window Chrome - Safari Style */}
      <div
        className="window-titlebar"
        onMouseDown={handleDrag}
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.bg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Left: Close Button */}
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ff5f57',
              border: 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff3b30'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ff5f57'
            }}
          />
        </div>

        {/* Center: Title */}
        <div style={{
          flex: 1,
          textAlign: 'center',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          marginLeft: theme.spacing.lg,
        }}>
          {artifact?.name || 'Untitled'}
        </div>

        {/* Right: View Toggle */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          background: theme.colors.bg.primary,
          borderRadius: theme.radius.md,
          padding: theme.spacing.xs,
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('preview')
            }}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              background: view === 'preview' ? theme.colors.bg.tertiary : 'transparent',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              transition: `all ${theme.animation.fast}`,
            }}
          >
            <EyeIcon size={16} color={view === 'preview' ? theme.colors.text.primary : theme.colors.text.tertiary} />
            <span style={{
              fontSize: theme.typography.fontSize.xs,
              color: view === 'preview' ? theme.colors.text.primary : theme.colors.text.tertiary,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              Preview
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('code')
            }}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              background: view === 'code' ? theme.colors.bg.tertiary : 'transparent',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              transition: `all ${theme.animation.fast}`,
            }}
          >
            <CodeIcon size={16} color={view === 'code' ? theme.colors.text.primary : theme.colors.text.tertiary} />
            <span style={{
              fontSize: theme.typography.fontSize.xs,
              color: view === 'code' ? theme.colors.text.primary : theme.colors.text.tertiary,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              Code
            </span>
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        background: theme.colors.bg.primary,
      }}>
        {view === 'preview' ? (
          <PreviewPanel files={files} onError={onError} />
        ) : (
          <EditorPanel
            files={files}
            activeFile={activeFile}
            onFileChange={onFileChange}
          />
        )}
      </div>

      {/* Resize Handles */}
      <ResizeHandles />
    </div>
  )
}
