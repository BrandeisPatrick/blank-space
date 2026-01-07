import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect, getFloatingWindowDimensions } from '../../styles/componentStyles'
import { SIZES, Z_INDEX } from '../../constants'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import { useIsMobile } from '../../hooks/useIsMobile'
import { PreviewPanel } from '../preview/PreviewPanel'
import { EditorPanel } from '../editor/EditorPanel'
import { XIcon, EyeIcon, CodeIcon, SettingsIcon } from '../icons'
import { IconPicker, getIconById, getIconColorById } from '../artifact/IconPicker'
import { AppSettingsModal } from './AppSettingsModal'

export const FloatingBrowserWindow = ({
  visible = false,
  artifact = null,
  files = {},
  onClose,
  onFileChange,
  onError,
  onDebug,
  isDebugging = false,
  onIconChange,
  onRename,
  sidebarWidth = 250, // Sidebar width in pixels for fullscreen positioning
}) => {
  const [view, setView] = useState('preview') // 'preview' or 'code'
  const [activeFile, setActiveFile] = useState('App.jsx')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconButtonRect, setIconButtonRect] = useState(null)
  const iconButtonRef = useRef(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [zoom, setZoom] = useState(100)
  const [showAppSettings, setShowAppSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [preFullscreenState, setPreFullscreenState] = useState(null)
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const isMobile = useIsMobile()

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleZoomReset = () => setZoom(100)

  // Fullscreen toggle - respects sidebar on desktop
  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Restore previous state
      if (preFullscreenState) {
        setPosition(preFullscreenState.position)
        setSize(preFullscreenState.size)
      }
      setIsFullscreen(false)
      setPreFullscreenState(null)
    } else {
      // Save current state and go fullscreen (respecting sidebar)
      setPreFullscreenState({
        position: { ...position },
        size: { ...size }
      })
      // On mobile, use full width; on desktop, account for sidebar
      const offsetX = isMobile ? 0 : sidebarWidth
      const availableWidth = isMobile ? window.innerWidth : window.innerWidth - sidebarWidth
      setPosition({ x: offsetX, y: 0 })
      setSize({ width: availableWidth, height: window.innerHeight })
      setIsFullscreen(true)
    }
  }

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

  // Responsive window sizing using centralized values
  const { width: windowWidth, height: windowHeight, x: initialX, y: initialY } =
    getFloatingWindowDimensions(isMobile, SIZES.FLOATING_WINDOW);

  const { position, setPosition, isDragging, handleMouseDown: handleDrag, handleTouchStart, style: dragStyle } = useDraggable(
    { x: initialX, y: initialY },
    '.window-titlebar' // Only allow dragging from titlebar
  )

  const minWidth = isMobile ? SIZES.FLOATING_WINDOW.MIN_WIDTH.mobile : SIZES.FLOATING_WINDOW.MIN_WIDTH.desktop;
  const { size, setSize, style: resizeStyle, ResizeHandles } = useResizable(
    { width: windowWidth, height: windowHeight },
    { width: minWidth, height: SIZES.FLOATING_WINDOW.MIN_HEIGHT }
  )

  // Reset size and position when mobile state changes or window becomes visible
  useEffect(() => {
    if (visible) {
      if (isFullscreen) {
        // Start in fullscreen mode (respecting sidebar on desktop)
        const offsetX = isMobile ? 0 : sidebarWidth;
        const availableWidth = isMobile ? window.innerWidth : window.innerWidth - sidebarWidth;
        setSize({ width: availableWidth, height: window.innerHeight });
        setPosition({ x: offsetX, y: 0 });
      } else {
        const dims = getFloatingWindowDimensions(isMobile, SIZES.FLOATING_WINDOW);
        setSize({ width: dims.width, height: dims.height });
        setPosition({ x: dims.x, y: dims.y });
      }
    }
  }, [isMobile, visible, setSize, setPosition, isFullscreen, sidebarWidth]);

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
        borderRadius: isFullscreen ? 0 : theme.radius['2xl'],
        background: mode === 'dark' ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: isFullscreen ? 'none' : (mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)'),
        boxShadow: isFullscreen ? 'none' : (mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'),
        overflow: 'hidden',
        transition: `border-radius ${theme.animation.fast}, border ${theme.animation.fast}, box-shadow ${theme.animation.fast}`,
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
        {/* Left: Window Control Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Minimize Button (Yellow) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#febc2e',
              border: 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5a623'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#febc2e'
            }}
            title="Minimize window"
          />
          {/* Fullscreen Button (Green) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isFullscreen ? '#34c759' : '#28cd41',
              border: 'none',
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2db640'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isFullscreen ? '#34c759' : '#28cd41'
            }}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          />
        </div>

        {/* Center: Title (Desktop only - on mobile everything is right-aligned) */}
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
        )}

        {/* Right: Settings (mobile) + Zoom + Icon Picker + View Toggle */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
          marginLeft: isMobile ? 'auto' : 0,
        }}>
          {/* Settings Button - Mobile only */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAppSettings(true);
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
              title="App settings"
            >
              <SettingsIcon size={16} color={theme.colors.text.secondary} />
            </button>
          )}

          {/* Zoom Controls - Show in preview mode */}
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

          {/* Category Icon Button - Desktop only */}
          {!isMobile && (
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
          )}

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
              {!isMobile && (
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: view === 'preview' ? theme.colors.text.primary : theme.colors.text.tertiary,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  Preview
                </span>
              )}
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
              {!isMobile && (
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: view === 'code' ? theme.colors.text.primary : theme.colors.text.tertiary,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  Code
                </span>
              )}
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
          <PreviewPanel files={files} onError={onError} onDebug={onDebug} isDebugging={isDebugging} zoom={zoom} hideHeader={true} />
        ) : (
          <EditorPanel
            files={files}
            activeFile={activeFile}
            onFileChange={onFileChange}
          />
        )}
      </div>

      {/* Resize Handles - hidden in fullscreen mode */}
      {!isFullscreen && <ResizeHandles />}

      {/* Icon Picker - Rendered via Portal to escape overflow:hidden (Desktop only) */}
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
