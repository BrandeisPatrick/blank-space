import { ChatPanel } from './components/Chat/ChatPanel'
import { ChatInput } from './components/Chat/ChatInput'
import { EditorPanel } from './components/CodeEditor/EditorPanel'
import { PreviewFrame } from './components/Preview/PreviewFrame'
import { TopBar } from './components/TopBar/TopBar'
import { MobileToggleBar } from './components/Layout/MobileToggleBar'
import { useAppStore } from './state/appStore'
import { useResponsive } from './hooks/useResponsive'
import { useTheme } from './contexts/ThemeContext'
import { generationService } from './services/generationService'
import { ChatMessage } from './types'
import { getTheme } from './styles/theme'

function App() {
  const { 
    setGenerating,
    addArtifact,
    addChatMessage,
    showChat,
    showCode,
    showPreview
  } = useAppStore()
  
  const { isMobile } = useResponsive()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: message,
      timestamp: Date.now()
    }
    addChatMessage(userMessage)

    try {
      setGenerating(true)
      
      // Generate website using Groq API
      const artifact = await generationService.generateWebsite(message)
      addArtifact(artifact)
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        type: 'assistant',
        content: `I've created a website based on your request. The code includes:\n\n• HTML structure with semantic elements\n• CSS styling with modern design\n• JavaScript for interactivity\n\nYou can see the generated code in the editor and the live preview on the right. Feel free to ask for any modifications!`,
        timestamp: Date.now(),
        artifactId: artifact.id
      }
      addChatMessage(aiMessage)
      
    } catch (error) {
      console.error('Generation failed:', error)
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        type: 'assistant',
        content: 'Sorry, there was an error generating your website. Please try again.',
        timestamp: Date.now()
      }
      addChatMessage(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  // Calculate panel widths based on which panels are visible and screen size
  const visiblePanels = [showChat, showCode, showPreview].filter(Boolean).length
  const visiblePanelCount = Math.max(visiblePanels, 1)
  
  // On mobile, show only one panel at a time (100%)
  // On tablet and desktop, distribute panels evenly
  const panelWidth = isMobile ? '100%' : `${100 / visiblePanelCount}%`
  
  // Determine active panel for mobile
  const activeMobilePanel = isMobile ? (
    showChat ? 'chat' : showCode ? 'code' : showPreview ? 'preview' : 'chat'
  ) : null

  return (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.colors.bg.primary,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
      overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <TopBar />
      
      {/* Mobile Toggle Bar */}
      {isMobile && <MobileToggleBar />}
      
      {/* Main Content Panels */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        gap: isMobile ? '0' : theme.spacing.xs,
        background: theme.colors.gradient.subtle,
        padding: isMobile ? '0' : theme.spacing.xs,
      }}>
        {/* Left Panel - AI Chat */}
        {showChat && (!isMobile || activeMobilePanel === 'chat') && (
          <div style={{
            width: isMobile ? '100%' : panelWidth,
            height: isMobile ? '100%' : 'auto',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: isMobile ? '0' : 'auto',
            flex: isMobile ? '1' : 'none',
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
          }}>
            <ChatPanel />
            <ChatInput onSend={handleSendMessage} />
          </div>
        )}
        
        {/* Middle Panel - Code Editor */}
        {showCode && (!isMobile || activeMobilePanel === 'code') && (
          <div style={{
            width: isMobile ? '100%' : panelWidth,
            height: isMobile ? '100%' : 'auto',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: isMobile ? '0' : 'auto',
            flex: isMobile ? '1' : 'none',
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
          }}>
            <EditorPanel />
          </div>
        )}
        
        {/* Right Panel - Preview */}
        {showPreview && (!isMobile || activeMobilePanel === 'preview') && (
          <div style={{
            width: isMobile ? '100%' : panelWidth,
            height: isMobile ? '100%' : 'auto',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: isMobile ? '0' : 'auto',
            flex: isMobile ? '1' : 'none',
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
          }}>
            <PreviewFrame />
          </div>
        )}
      </div>
    </div>
  )
}

export default App