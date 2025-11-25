import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { createGlassEffect } from '../../styles/componentStyles'
import { ChatPanel } from '../chat/ChatPanel'
import { BinaIcon } from '../icons'

export const FloatingChatPanel = ({
  visible = false,
  messages = [],
  thinkingState = null,
  onFixBug
}) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!visible) {
    return null;
  }

  // Separate Bina icon + simplified chat panel
  return (
    <>
      {/* Bina Icon - Separate floating indicator in top-right */}
      <div
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: theme.radius.full,
          ...createGlassEffect(theme),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          boxShadow: theme.shadows.xl,
        }}
      >
        <BinaIcon size={32} />
      </div>

      {/* Chat Panel - Below the Bina icon */}
      <div
        style={{
          position: 'fixed',
          top: '170px', // Below the Bina icon
          right: '20px',
          width: '500px',
          maxHeight: '400px',
          borderRadius: theme.radius['2xl'],
          ...createGlassEffect(theme),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 100,
          boxShadow: theme.shadows.xl,
        }}
      >
        {/* Chat content - no header, no input, no avatars */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          <ChatPanel
            messages={messages}
            thinkingState={thinkingState}
            onFixBug={onFixBug}
          />
        </div>
      </div>
    </>
  )
}
