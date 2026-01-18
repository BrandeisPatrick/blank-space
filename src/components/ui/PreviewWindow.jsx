import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { Z_INDEX } from '../../constants'
import { useIsMobile } from '../../hooks/useIsMobile'
import { PreviewPanel } from '../preview/PreviewPanel'
import { EditorPanel } from '../editor/EditorPanel'
import { EyeIcon, CodeIcon, SettingsIcon } from '../icons'
import { IconPicker, getIconById, getIconColorById } from '../artifact/IconPicker'
import { AppSettingsModal } from './AppSettingsModal'

export const PreviewWindow = ({
  visible = false,
  artifact = null,
  files = {},
  loading = false,
  onClose,
  onFileChange,
  onError,
  onDebug,
  onDebugNewChat,
  isDebugging = false,
  onIconChange,
  onRename,
  sidebarWidth = 250,
}) => {
  const [view, setView] = useState('preview')
  const [activeFile, setActiveFile] = useState('App.jsx')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconButtonRect, setIconButtonRect] = useState(null)
  const iconButtonRef = useRef(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [zoom, setZoom] = useState(100)
  const [showAppSettings, setShowAppSettings] = useState(false)
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

  if (!visible || !artifact) {
    return null;
  }

  // Calculate fullscreen dimensions (respecting sidebar on desktop)
  const offsetX = isMobile ? 0 : sidebarWidth
  const width = isMobile ? window.innerWidth : window.innerWidth - sidebarWidth
  const height = window.innerHeight

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: offsetX,
        width: width,
        height: height,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.bg.primary,
        overflow: 'hidden',
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          minHeight: '48px',
          background: theme.colors.bg.primary,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        {/* Left: Close Button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#ff5f57',
              border: 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff4136'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ff5f57'
            }}
            title="Close"
          />
        </div>

        {/* Center: Title (Desktop only) */}
        {!isMobile && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
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
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.normal,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: theme.colors.text.primary,
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${mode === 'dark' ? '#1f1f1f' : '#e0e0e0'}`,
                  borderRadius: theme.radius.lg,
                  textAlign: 'center',
                  outline: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={() => {
                  setEditedName(artifact?.name || 'Untitled');
                  setIsEditingName(true);
                }}
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.normal,
                  fontFamily: theme.typography.fontFamily.sans,
                  color: theme.colors.text.primary,
                  cursor: 'text',
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.radius.lg,
                  transition: `all ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.secondary;
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
        )}

        {/* Right: Controls */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
          marginLeft: isMobile ? 'auto' : 0,
        }}>
          {/* Settings Button - Mobile only */}
          {isMobile && (
            <button
              onClick={() => setShowAppSettings(true)}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
              }}
              title="App settings"
            >
              <SettingsIcon size={16} color={theme.colors.text.secondary} />
            </button>
          )}

          {/* Zoom Controls - Preview mode only */}
          {view === 'preview' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              background: 'transparent',
              borderRadius: theme.radius.lg,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <button
                onClick={handleZoomOut}
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
                  fontFamily: theme.typography.fontFamily.sans,
                }}
              >
                −
              </button>
              <button
                onClick={handleZoomReset}
                style={{
                  padding: `0 ${theme.spacing.xs}`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.normal,
                  fontFamily: theme.typography.fontFamily.sans,
                  minWidth: '40px',
                }}
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
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
                  fontFamily: theme.typography.fontFamily.sans,
                }}
              >
                +
              </button>
            </div>
          )}

          {/* Icon Button - Desktop only */}
          {!isMobile && (
            <button
              ref={iconButtonRef}
              onClick={() => {
                if (iconButtonRef.current) {
                  const rect = iconButtonRef.current.getBoundingClientRect();
                  setIconButtonRect(rect);
                }
                setShowIconPicker(!showIconPicker);
              }}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
              }}
              title="Change icon"
            >
              <CurrentIcon size={18} color={currentIconColor} />
            </button>
          )}

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.xs,
            background: 'transparent',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xs,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <button
              onClick={() => setView('preview')}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                background: view === 'preview'
                  ? (theme.colors.bg.secondary)
                  : 'transparent',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              <EyeIcon size={16} color={view === 'preview' ? (theme.colors.text.primary) : (theme.colors.text.secondary)} />
              {!isMobile && (
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: view === 'preview' ? (theme.colors.text.primary) : (theme.colors.text.secondary),
                  fontWeight: theme.typography.fontWeight.normal,
                  fontFamily: theme.typography.fontFamily.sans,
                }}>
                  Preview
                </span>
              )}
            </button>
            <button
              onClick={() => setView('code')}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                background: view === 'code'
                  ? (theme.colors.bg.secondary)
                  : 'transparent',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              <CodeIcon size={16} color={view === 'code' ? (theme.colors.text.primary) : (theme.colors.text.secondary)} />
              {!isMobile && (
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: view === 'code' ? (theme.colors.text.primary) : (theme.colors.text.secondary),
                  fontWeight: theme.typography.fontWeight.normal,
                  fontFamily: theme.typography.fontFamily.sans,
                }}>
                  Code
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        background: theme.colors.bg.primary,
      }}>
        {view === 'preview' ? (
          <PreviewPanel files={files} loading={loading} onError={onError} onDebug={onDebug} onDebugNewChat={onDebugNewChat} isDebugging={isDebugging} zoom={zoom} hideHeader={true} activeArtifact={artifact} />
        ) : (
          <EditorPanel
            files={files}
            activeFile={activeFile}
            onFileChange={onFileChange}
          />
        )}
      </div>

      {/* Icon Picker Portal - Desktop only */}
      {!isMobile && showIconPicker && iconButtonRect && createPortal(
        <div
          style={{
            position: 'fixed',
            top: iconButtonRect.bottom + 8,
            left: iconButtonRect.left - 150 + iconButtonRect.width,
            zIndex: Z_INDEX.ICON_PICKER,
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

      {/* App Settings Modal - Mobile only */}
      <AppSettingsModal
        isOpen={showAppSettings}
        onClose={() => setShowAppSettings(false)}
        name={artifact?.name || 'Untitled'}
        icon={artifact?.icon || 'app'}
        onNameChange={(newName) => onRename?.(newName)}
        onIconChange={(iconId) => onIconChange?.(iconId)}
      />
    </div>
  )
}
