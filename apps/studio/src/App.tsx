import { useState, useEffect } from 'react'
import { ChatPanel } from './components/Chat/ChatPanel'
import { ChatInput } from './components/Chat/ChatInput'
import { EditorPanel } from './components/CodeEditor/EditorPanel'
import { PreviewFrame } from './components/Preview/PreviewFrame'
import { TopBar } from './components/TopBar/TopBar'
import { MobileToggleBar } from './components/Layout/MobileToggleBar'
import { SignInPage } from './components/Auth/SignInPage'
import { LandingPage } from './components/Landing/LandingPage'
import { Dashboard } from './components/Dashboard/Dashboard'
import { useAppStore } from './state/appStore'
import { useUserStore, initializeUserFromStorage } from './state/userStore'
import { useResponsive } from './hooks/useResponsive'
import { useTheme } from './contexts/ThemeContext'
import { generationService } from './services/generationService'
// import { conversationEngine } from './services/conversationEngine'
import { ChatMessage } from './types'
import { getTheme } from './styles/theme'

type AppRoute = 'landing' | 'studio' | 'signin' | 'dashboard'

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing')
  
  const { 
    setGenerating,
    addArtifact,
    addChatMessage,
    showChat,
    showCode,
    showPreview,
    currentArtifactId,
    artifacts,
    chatMessages,
    responseMode,
    setCurrentArtifact
  } = useAppStore()
  
  const { user, isAuthenticated, signIn, signOut } = useUserStore()
  const { isMobile } = useResponsive()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Initialize user from storage on app start
  useEffect(() => {
    initializeUserFromStorage()
  }, [])

  // Determine initial route based on authentication status
  useEffect(() => {
    if (isAuthenticated && currentRoute === 'landing') {
      setCurrentRoute('dashboard')
    }
  }, [isAuthenticated, currentRoute])

  // Handle sign in
  const handleSignIn = async (email: string, password: string) => {
    // For demo purposes, create a user from the email
    const userName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1)
    
    signIn({
      email,
      name: formattedName,
    })
    
    // Navigate to dashboard after successful sign in
    setCurrentRoute('dashboard')
  }

  // Handle sign out
  const handleSignOut = () => {
    signOut()
    setCurrentRoute('landing')
  }

  // Navigation handlers
  const handleTryNow = () => setCurrentRoute('studio')
  const handleNavigateToSignIn = () => setCurrentRoute('signin')
  const handleNavigateToLanding = () => setCurrentRoute('landing')
  const handleNavigateToDashboard = () => setCurrentRoute('dashboard')
  const handleCreateNew = () => setCurrentRoute('studio')
  
  const handleOpenArtifact = (artifactId: string) => {
    setCurrentArtifact(artifactId)
    setCurrentRoute('studio')
  }

  // Route rendering
  if (currentRoute === 'landing') {
    return (
      <LandingPage 
        onTryNow={handleTryNow} 
        onSignIn={handleNavigateToSignIn} 
      />
    )
  }

  if (currentRoute === 'signin') {
    return (
      <SignInPage 
        onNavigateToMain={handleNavigateToLanding}
        onSignIn={handleSignIn}
      />
    )
  }

  if (currentRoute === 'dashboard' && isAuthenticated) {
    return (
      <Dashboard
        onCreateNew={handleCreateNew}
        onOpenArtifact={handleOpenArtifact}
        onSignOut={handleSignOut}
      />
    )
  }

  // AI-powered intent classification and conversation handling
  const analyzeUserIntent = async (message: string) => {
    const hasActiveCode = Boolean(currentArtifactId)
    const context = {
      hasActiveCode,
      recentMessages: chatMessages.slice(-3).map(msg => msg.content),
      currentArtifacts: artifacts.length,
      responseMode
    }
    
    const intentResult = await generationService.classifyIntent(message, hasActiveCode, responseMode)
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

    // Analyze user intent with AI classification
    const { intentResult, context } = await analyzeUserIntent(message)
    
    console.log(`Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(1)}% confidence) - ${intentResult.reasoning}`)
    
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
        // Handle code modifications using conversation engine
        const { conversationEngine } = await import('./services/conversationEngine')
        
        // Check if this is an incremental building request
        if (conversationEngine.isIncrementalRequest && conversationEngine.isIncrementalRequest(message) && currentArtifactId) {
          // Handle incremental building - enhance existing code
          try {
            setGenerating(true)
            
            // Get current artifact
            const currentArtifact = artifacts.find(a => a.id === currentArtifactId)
            if (!currentArtifact) {
              throw new Error('No current artifact found')
            }
            
            // Create enhancement prompt with existing code context
            const enhancementPrompt = `Enhance the existing website by: ${message}

EXISTING CODE CONTEXT:
Current HTML: ${currentArtifact.files['index.html'] || ''}
Current CSS: ${currentArtifact.files['styles.css'] || ''}
Current JS: ${currentArtifact.files['script.js'] || ''}

ENHANCEMENT REQUIREMENTS:
- Preserve all existing working functionality and styling
- Add the requested enhancement: ${message}
- Maintain the current design aesthetic while improving it
- Ensure all code works together seamlessly
- Keep the same overall structure and layout principles`
            
            // Generate enhanced version
            const enhancedArtifact = await generationService.generateWebsite(enhancementPrompt)
            addArtifact(enhancedArtifact)
            
            // Add success message
            const successMessage: ChatMessage = {
              id: `msg_${Date.now()}_ai`,
              type: 'assistant',
              content: `Perfect! I've enhanced your website with the requested changes. 🚀\n\n**Enhanced:**\n• Preserved all existing functionality\n• Added your requested feature\n• Maintained the design aesthetic\n• Ensured everything works together\n\nYou can see the enhanced version in the editor and preview!`,
              timestamp: Date.now(),
              artifactId: enhancedArtifact.id
            }
            addChatMessage(successMessage)
            
          } catch (error) {
            console.error('Enhancement failed:', error)
            
            const errorMessage: ChatMessage = {
              id: `msg_${Date.now()}_error`,
              type: 'assistant',
              content: 'Sorry, there was an error enhancing your website. Let me try a different approach or you can describe the changes differently.',
              timestamp: Date.now()
            }
            addChatMessage(errorMessage)
          } finally {
            setGenerating(false)
          }
        } else {
          // Regular modification response
          const modificationResponse = conversationEngine.generateResponse(message, context)
          
          const modMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: modificationResponse,
            timestamp: Date.now()
          }
          addChatMessage(modMessage)
        }
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
      <TopBar 
        onNavigateToSignIn={isAuthenticated ? handleNavigateToDashboard : handleNavigateToSignIn}
        user={user}
        isAuthenticated={isAuthenticated}
      />
      
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
            height: isMobile ? '100%' : '100%', // Force explicit height
            maxHeight: '100%', // Prevent overflow
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0, // Allow shrinking
            flex: isMobile ? '1' : '1', // Use flex: 1 for desktop too
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
            overflow: 'hidden', // Prevent overflow from breaking layout
          }}>
            <ChatPanel />
            <ChatInput onSend={handleSendMessage} />
          </div>
        )}
        
        {/* Middle Panel - Code Editor */}
        {showCode && (!isMobile || activeMobilePanel === 'code') && (
          <div style={{
            width: isMobile ? '100%' : panelWidth,
            height: isMobile ? '100%' : '100%',
            maxHeight: '100%',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
            flex: isMobile ? '1' : '1',
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
            overflow: 'hidden',
          }}>
            <EditorPanel />
          </div>
        )}
        
        {/* Right Panel - Preview */}
        {showPreview && (!isMobile || activeMobilePanel === 'preview') && (
          <div style={{
            width: isMobile ? '100%' : panelWidth,
            height: isMobile ? '100%' : '100%',
            maxHeight: '100%',
            background: theme.colors.bg.primary,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
            flex: isMobile ? '1' : '1',
            borderRadius: isMobile ? '0' : theme.radius.lg,
            boxShadow: isMobile ? 'none' : theme.shadows.md,
            overflow: 'hidden',
          }}>
            <PreviewFrame />
          </div>
        )}
      </div>
    </div>
  )
}

export default App