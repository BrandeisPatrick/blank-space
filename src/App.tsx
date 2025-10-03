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
import { useAppStore } from './stores/appStore'
import { useUserStore, loadUserFromLocalStorage } from './stores/userStore'
import { useResponsive } from './lib/useResponsive'
import { useTheme } from './contexts/ThemeContext'
import { generationService } from './lib/generationService'
import { chatService } from './lib/chatService'
import { uiSummaryService, UserInterfaceProgressEvent } from './lib/uiSummaryService'
import { memoryService } from './lib/memoryService'
import { ChatMessage } from './types'
import { getTheme } from './styles/theme'
import { CompactThinkingPanel } from './components/Chat/CompactThinkingPanel'
import { useThinkingState } from './lib/useThinkingState'

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
  
  // Compact thinking panel state
  const thinking = useThinkingState({
    autoCollapse: true,
    collapseDelay: 3000
  })

  // Subscribe to UI summary events for clean user display (legacy compatibility)
  useEffect(() => {
    const unsubscribe = uiSummaryService.subscribe((event: UserInterfaceProgressEvent) => {
      // Only process UI summary events if they're not coming from real backend progress
      // This maintains backward compatibility for any remaining fake events
      if (!event.realProgress) {
        const phaseMap = {
          analyzing: 'Understanding requirements',
          planning: 'Planning solution',
          generating: 'Generating code',
          finalizing: 'Finalizing project'
        }

        switch (event.type) {
          case 'phase_start':
            // Only add if thinking isn't already active (to avoid conflicts with real events)
            if (!thinking.isActive) {
              thinking.addStep(phaseMap[event.phase], 'active')
            }
            break

          case 'phase_progress':
            // Skip - real progress is handled in onPhaseEvent
            break

          case 'phase_complete':
            // Skip - real completion is handled in onPhaseEvent
            break

          case 'phase_error':
            const errorSteps = thinking.steps.filter(s => s.label.includes(phaseMap[event.phase]))
            if (errorSteps.length > 0) {
              thinking.errorStep(errorSteps[0].id)
            }
            break
        }
      }
    })

    return unsubscribe
  }, [thinking])

  // Initialize user from storage on app start
  useEffect(() => {
    loadUserFromLocalStorage()
  }, [])

  // Initialize memory service with existing chat messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      memoryService.addMessages(chatMessages)
    }
  }, [chatMessages.length])

  // Determine initial route based on authentication status
  useEffect(() => {
    if (isAuthenticated && currentRoute === 'landing') {
      setCurrentRoute('dashboard')
    }
  }, [isAuthenticated, currentRoute])

  // Handle sign in
  const handleSignIn = async (email: string, _password: string) => {
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
    
    const intentResult = await chatService.classifyIntent(message, hasActiveCode)
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

    // Update memory service with new messages
    memoryService.addMessages([userMessage])

    // Analyze user intent with AI classification
    const { intentResult, context } = await analyzeUserIntent(message)
    
    
    switch (intentResult.intent) {
      case 'generation':
        // Generate new React component with ReAct reasoning + actual code generation
        try {
          setGenerating(true)
          
          // Reset thinking state for new generation
          thinking.reset()
          thinking.startThinking()

          // Start UI summary pipeline (clean user display)
          uiSummaryService.startGeneration(message)

          // Run internal pipeline with multi-stage generation (real progress tracking)
          const result = await chatService.generateWithMultiStage(message, {
            onError: (error) => {
              console.error('Generation pipeline failed:', error)

              // Notify UI summary service of error
              uiSummaryService.onBackendGenerationError(error.message)
              thinking.error('Generation failed. Please try again.')

              // Add error message to chat
              const errorMessage: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                type: 'assistant',
                content: 'Hmm, I ran into a problem generating that code. Could you double-check that your API keys are set up correctly? Once that\'s sorted, we can try again.',
                timestamp: Date.now()
              }
              addChatMessage(errorMessage)

              // Update memory service with error message
              memoryService.addMessages([errorMessage])
            },
            // NEW: Connect real ChatService events to both systems
            onPhaseEvent: (phaseEvent) => {
              // Route to UI Summary Service for user-friendly display
              uiSummaryService.onChatServicePhaseEvent(phaseEvent)

              // Handle thinking panel updates with real multi-stage progress
              switch (phaseEvent.type) {
                case 'phase_start':
                  if (phaseEvent.phase === 'planning') {
                    // Start planning phase - this is the first real step
                    thinking.reset()
                    thinking.startThinking()
                    thinking.addStep('Analyzing your request', 'active', 'step_planning')
                  } else if (phaseEvent.phase === 'generation') {
                    // Complete planning, move to generation
                    const planningStep = thinking.steps.find(s => s.id === 'step_planning')
                    if (planningStep && planningStep.status === 'active') {
                      thinking.completeStep('step_planning')
                    }
                    thinking.startStreaming()
                  }
                  break

                case 'phase_step':
                  // Real progress: showing actual files being generated
                  if (phaseEvent.status === 'active') {
                    // Check if this step already exists to avoid duplicates
                    const existingStep = thinking.steps.find(s => s.id === phaseEvent.stepId)
                    if (!existingStep) {
                      // Complete any currently active steps first (except planning)
                      const activeSteps = thinking.steps.filter(s =>
                        s.status === 'active' && s.id !== 'step_planning'
                      )
                      activeSteps.forEach(step => thinking.completeStep(step.id))

                      // Add new step with the ChatService's step ID
                      thinking.addStep(phaseEvent.label, 'active', phaseEvent.stepId)
                    } else {
                      // Update existing step
                      thinking.updateStep(phaseEvent.stepId, {
                        label: phaseEvent.label,
                        status: 'active'
                      })
                    }
                  } else if (phaseEvent.status === 'complete') {
                    // Complete the specific step
                    thinking.completeStep(phaseEvent.stepId)
                  }
                  break

                case 'phase_complete':
                  if (phaseEvent.phase === 'generation') {
                    // All generation complete
                    thinking.complete()
                  } else if (phaseEvent.phase === 'planning') {
                    // Planning phase is complete
                    const activeSteps = thinking.steps.filter(s => s.status === 'active')
                    activeSteps.forEach(step => thinking.completeStep(step.id))
                  }
                  break

                case 'bina_artifact_complete':
                  // Multi-stage generation complete - add success message
                  if (phaseEvent.artifact) {
                    const fileCount = Object.keys(phaseEvent.artifact.files).length
                    const successMessage: ChatMessage = {
                      id: `msg_${Date.now()}_success`,
                      type: 'assistant',
                      content: `Done! Your app is ready with ${fileCount} files.\n\nCheck it out in the editor and preview.`,
                      timestamp: Date.now(),
                      artifactId: phaseEvent.artifact.id
                    }
                    addChatMessage(successMessage)

                    // Update memory service with assistant response
                    memoryService.addMessages([successMessage])
                  }
                  break
              }
            }
          })

          // Add the artifact if generation was successful
          if (result.artifact) {
            addArtifact(result.artifact)
            setCurrentArtifact(result.artifact.id)
          }
          
        } catch (error) {
          console.error('Generation pipeline failed:', error)
          
          // Notify UI summary service of error
          uiSummaryService.onBackendGenerationError(error instanceof Error ? error.message : 'Unknown error')
          thinking.error('Generation failed. Please try again.')
          
          // Add error message to chat
          const errorMessage: ChatMessage = {
            id: `msg_${Date.now()}_error`,
            type: 'assistant',
            content: 'Oops, something unexpected happened while I was working on that. Let\'s give it another shot - could you try again?',
            timestamp: Date.now()
          }
          addChatMessage(errorMessage)

          // Update memory service with error message
          memoryService.addMessages([errorMessage])
        } finally {
          setGenerating(false)
        }
        break

      case 'modification':
        // Handle code modifications with incremental building
        if (currentArtifactId) {
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
              content: `Nice! I've added those changes to your website.\n\nHere's what I did:\n• Kept everything that was already working\n• Added the new feature you asked for\n• Made sure the design stays consistent\n• Double-checked that everything plays nicely together\n\nTake a look at the updated version in the editor and preview - I think you'll like how it turned out!`,
              timestamp: Date.now(),
              artifactId: enhancedArtifact.id
            }
            addChatMessage(successMessage)

          } catch (error) {
            console.error('Enhancement failed:', error)

            const errorMessage: ChatMessage = {
              id: `msg_${Date.now()}_error`,
              type: 'assistant',
              content: 'Hmm, I had some trouble making those changes. Maybe we could try a different approach? Feel free to describe what you want in another way and I\'ll give it another go.',
              timestamp: Date.now()
            }
            addChatMessage(errorMessage)
          } finally {
            setGenerating(false)
          }
        } else {
          // No active code to modify
          const modMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: "I'd love to help you modify code! To get started, create a website first by describing what you want to build. Once you have an active project, I can help you make changes and improvements to it.",
            timestamp: Date.now()
          }
          addChatMessage(modMessage)
        }
        break

      case 'explanation':
        // Handle code explanations (future feature)
        const explanationResponse = "I'd be happy to explain code for you!\n\nThat feature is coming soon, but right now I can help you with:\n• Creating new websites from your descriptions\n• Building components like forms, navigation bars, and more\n• Making full applications like dashboards, portfolios, or blogs\n\nWhat would you like me to help you build today?"
        
        const expMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          type: 'assistant',
          content: explanationResponse,
          timestamp: Date.now()
        }
        addChatMessage(expMessage)

        // Update memory service with explanation response
        memoryService.addMessages([expMessage])
        break

      case 'conversation':
      default:
        // Handle conversational interactions with LLM API
        try {
          const aiMessage = await chatService.generateChatResponse(message, {
            hasActiveCode: context.hasActiveCode,
            recentMessages: context.recentMessages,
            currentArtifacts: context.currentArtifacts
          })
          
          // Add LLM-generated conversational response to chat
          addChatMessage(aiMessage)

          // Update memory service with AI response
          memoryService.addMessages([aiMessage])
          
        } catch (error) {
          console.error('Chat response failed:', error)
          
          // Fallback to local response if LLM fails
          const fallbackMessage: ChatMessage = {
            id: `msg_${Date.now()}_ai`,
            type: 'assistant',
            content: "I'm having trouble connecting right now, but I'm here to help you build websites! What would you like to create?",
            timestamp: Date.now()
          }
          addChatMessage(fallbackMessage)

          // Update memory service with fallback response
          memoryService.addMessages([fallbackMessage])
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
            {/* Compact Thinking Panel */}
            {thinking.isActive && (
              <div style={{ padding: `${theme.spacing.md} ${theme.spacing.md} 0` }}>
                <CompactThinkingPanel
                  phase={thinking.phase}
                  steps={thinking.steps}
                  answer={thinking.answer}
                  isVisible={thinking.isVisible}
                  onToggleVisibility={thinking.toggleVisibility}
                />
              </div>
            )}
            
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
