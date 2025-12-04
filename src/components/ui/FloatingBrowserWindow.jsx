import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import { useIsMobile } from '../../hooks/useIsMobile'
import { PreviewPanel } from '../preview/PreviewPanel'
import { EditorPanel } from '../editor/EditorPanel'
import { XIcon, EyeIcon, CodeIcon, TrashIcon } from '../icons'
import { IconPicker, getIconById, getIconColorById } from '../artifact/IconPicker'

export const FloatingBrowserWindow = ({
  visible = false,
  artifact = null,
  files = {},
  onClose,
  onDelete,
  onFileChange,
  onError,
  onIconChange,
  onRename
}) => {
  const [view, setView] = useState('preview') // 'preview' or 'code'
  const [activeFile, setActiveFile] = useState('App.jsx')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconButtonRect, setIconButtonRect] = useState(null)
  const iconButtonRef = useRef(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [zoom, setZoom] = useState(100)
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const isMobile = useIsMobile()

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleZoomReset = () => setZoom(100)

  // Get the current icon component and color
  const CurrentIcon = getIconById(artifact?.icon || 'app')
  const currentIconColor = getIconColorById(artifact?.icon || 'app')

  // Update active file when files change
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      const fileNames = Object.keys(files)
      if (!files[activeFile]) {
        setActiveFile(fileNames[0])
      }
    }
  }, [files, activeFile])

  // Responsive window sizing
  const windowWidth = isMobile ? Math.floor(window.innerWidth * 0.85) : 800
  const windowHeight = isMobile ? Math.floor(window.innerHeight * 0.6) : 600
  const initialX = (window.innerWidth - windowWidth) / 2
  const initialY = isMobile ? 80 : (window.innerHeight - windowHeight) / 2

  const { position, isDragging, handleMouseDown: handleDrag, handleTouchStart, style: dragStyle } = useDraggable(
    { x: initialX, y: initialY },
    '.window-titlebar' // Only allow dragging from titlebar
  )

  const { size, style: resizeStyle, ResizeHandles } = useResizable(
    { width: windowWidth, height: windowHeight },
    { width: isMobile ? 280 : 400, height: 300 }
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
        background: mode === 'dark' ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Window Chrome - Liquid Glass Style */}
      <div
        className="window-titlebar"
        onMouseDown={handleDrag}
        onTouchStart={handleTouchStart}
        style={{
          padding: `2px ${theme.spacing.sm}`,
          background: mode === 'dark'
            ? 'linear-gradient(135deg, rgba(50, 50, 60, 0.3) 0%, rgba(40, 45, 55, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(200, 190, 220, 0.2) 0%, rgba(180, 200, 220, 0.15) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Left: Close & Delete Buttons */}
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          {/* Close Button */}
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
            title="Close window"
          />

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this app? This cannot be undone.')) {
                onDelete?.();
              }
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: theme.radius.md,
              background: 'transparent',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';
            }}
            title="Delete app"
          >
            <TrashIcon size={14} color={theme.colors.text.secondary} />
          </button>
        </div>

        {/* Center: Title (Editable) */}
        <div style={{
          flex: 1,
          textAlign: 'center',
          marginLeft: theme.spacing.lg,
        }}>
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => {
                if (editedName.trim() && editedName !== artifact?.name) {
                  onRename?.(editedName.trim());
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editedName.trim() && editedName !== artifact?.name) {
                    onRename?.(editedName.trim());
                  }
                  setIsEditingName(false);
                } else if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              autoFocus
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '-0.01em',
                color: theme.colors.text.primary,
                background: theme.colors.bg.primary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                textAlign: 'center',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEditedName(artifact?.name || 'Untitled');
                setIsEditingName(true);
              }}
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '-0.01em',
                color: theme.colors.text.primary,
                cursor: 'text',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.radius.md,
                transition: `all ${theme.animation.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title="Click to rename"
            >
              {artifact?.name || 'Untitled'}
            </span>
          )}
        </div>

        {/* Right: Zoom + Icon Picker + View Toggle */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
        }}>
          {/* Zoom Controls - Only show in preview mode */}
          {view === 'preview' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              background: 'transparent',
              borderRadius: theme.radius.md,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
                style={{
                  padding: `0 ${theme.spacing.xs}`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  minWidth: '40px',
                }}
              >
                {zoom}%
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                +
              </button>
            </div>
          )}

          {/* Category Icon Button */}
          <button
            ref={iconButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              // Get button position for portal
              if (iconButtonRef.current) {
                const rect = iconButtonRef.current.getBoundingClientRect();
                setIconButtonRect(rect);
              }
              setShowIconPicker(!showIconPicker);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Change icon"
          >
            <CurrentIcon size={18} color={currentIconColor} />
          </button>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.xs,
            background: 'transparent',
            borderRadius: theme.radius.md,
            padding: theme.spacing.xs,
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.3)',
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setView('preview')
              }}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                background: view === 'preview'
                  ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)')
                  : 'transparent',
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
                background: view === 'code'
                  ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)')
                  : 'transparent',
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
      </div>

      {/* Window Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        background: theme.colors.bg.primary,
      }}>
        {view === 'preview' ? (
          <PreviewPanel files={files} onError={onError} zoom={zoom} hideHeader={true} />
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

      {/* Icon Picker - Rendered via Portal to escape overflow:hidden */}
      {showIconPicker && iconButtonRect && createPortal(
        <div
          style={{
            position: 'fixed',
            top: iconButtonRect.bottom + 8,
            left: iconButtonRect.left - 150 + iconButtonRect.width,
            zIndex: 9999,
          }}
        >
          <IconPicker
            currentIcon={artifact?.icon || 'app'}
            onSelect={(iconId) => {
              onIconChange?.(iconId);
              setShowIconPicker(false);
            }}
            onClose={() => setShowIconPicker(false)}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
