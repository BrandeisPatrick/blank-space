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
import { intentClassifier } from './services/intentClassifier'
import { conversationEngine } from './services/conversationEngine'
import { ChatMessage } from './types'
import { getTheme } from './styles/theme'

function App() {
  const { 
    setGenerating,
    addArtifact,
    addChatMessage,
    showChat,
    showCode,
    showPreview,
    currentArtifactId,
    artifacts,
    chatMessages
  } = useAppStore()
  
  const { isMobile } = useResponsive()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Professional intent classification and conversation handling
  const analyzeUserIntent = (message: string) => {
    const hasActiveCode = Boolean(currentArtifactId)
    const context = {
      hasActiveCode,
      recentMessages: chatMessages.slice(-3).map(msg => msg.content),
      currentArtifacts: artifacts.length
    }
    
    const intentResult = intentClassifier.classify(message, hasActiveCode)
    return { intentResult, context }
  }

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: message,
      timestamp: Date.now()
    }
    addChatMessage(userMessage)

    // Analyze user intent with professional classification
    const { intentResult, context } = analyzeUserIntent(message)
    
    console.log(`Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(1)}% confidence)`)
    
    switch (intentResult.intent) {
      case 'generation':
        // Generate new website/component
        try {
          setGenerating(true)
          
          // Generate website using Groq API
          const artifact = await generationService.generateWebsite(message)
          addArtifact(artifact)
          
          // Add AI response to chat
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: `I've created a website based on your request! 🎉\n\n**Generated:**\n• HTML structure with semantic elements\n• CSS styling with modern design\n• JavaScript for interactivity\n\nYou can see the generated code in the editor and the live preview on the right. Feel free to ask for any modifications!`,
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
            content: 'Sorry, there was an error generating your website. Please try again with a different description.',
            timestamp: Date.now()
          }
          addChatMessage(errorMessage)
        } finally {
          setGenerating(false)
        }
        break

      case 'modification':
        // Handle code modifications (future feature)
        const modificationResponse = "I can see you want to modify something! 🔧\n\nCurrently, I can generate new websites from scratch. Code modification features are coming soon!\n\nFor now, you can:\n• **Copy code** from the editor and describe changes you want\n• **Ask me to generate** a new version with your requirements\n• **Tell me specifically** what you'd like to build instead"
        
        const modMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          type: 'assistant',
          content: modificationResponse,
          timestamp: Date.now()
        }
        addChatMessage(modMessage)
        break

      case 'explanation':
        // Handle code explanations (future feature)
        const explanationResponse = "I'd love to explain code for you! 📚\n\nCode explanation features are coming soon. For now, I can:\n• **Generate new websites** from your descriptions\n• **Create components** like forms, navigation bars, etc.\n• **Build applications** like dashboards, portfolios, blogs\n\nWhat would you like me to create for you?"
        
        const expMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          type: 'assistant',
          content: explanationResponse,
          timestamp: Date.now()
        }
        addChatMessage(expMessage)
        break

      case 'conversation':
      default:
        // Handle conversational interactions with LLM API
        try {
          const llmResponse = await generationService.generateChatResponse(message, {
            hasActiveCode: context.hasActiveCode,
            recentMessages: context.recentMessages,
            currentArtifacts: context.currentArtifacts
          })
          
          // Add LLM-generated conversational response to chat
          const aiMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: llmResponse,
            timestamp: Date.now()
          }
          addChatMessage(aiMessage)
          
        } catch (error) {
          console.error('Chat response failed:', error)
          
          // Fallback to local response if LLM fails
          const fallbackResponse = "I'm having trouble connecting right now, but I'm here to help you build websites! What would you like to create?"
          
          const fallbackMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: fallbackResponse,
            timestamp: Date.now()
          }
          addChatMessage(fallbackMessage)
        }
        break
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