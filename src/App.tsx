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
import { DeveloperDashboard } from './components/Developer/DeveloperDashboard'
import { useAppStore } from './pages/appStore'
import { useUserStore, initializeUserFromStorage } from './pages/userStore'
import { useResponsive } from './lib/useResponsive'
import { useTheme } from './pages/ThemeContext'
import { generationService } from './lib/generationService'
import { chatService } from './lib/chatService'
import { uiSummaryService, UISummaryEvent } from './lib/uiSummaryService'
import { memoryService } from './lib/memoryService'
import { ChatMessage } from './types'
import { getTheme } from './styles/theme'
import { CompactThinkingPanel } from './components/Chat/CompactThinkingPanel'
import { useThinkingState } from './lib/useThinkingState'
import { PlanningModal } from './components/Planning/PlanningModal'
import { ProjectPlan } from './lib/featurePlanningService'

type AppRoute = 'landing' | 'studio' | 'signin' | 'dashboard' | 'developer'

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing')
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [pendingProjectPlan, setPendingProjectPlan] = useState<ProjectPlan | null>(null)
  const [pendingGenerationMessage, setPendingGenerationMessage] = useState<string>('')
  
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
    const unsubscribe = uiSummaryService.subscribe((event: UISummaryEvent) => {
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
    initializeUserFromStorage()
  }, [])

  // Initialize memory service with existing chat messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      console.log('🧠 Initializing memory service with existing chat messages')
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
  const handleNavigateToDeveloper = () => setCurrentRoute('developer')
  
  const handleOpenArtifact = (artifactId: string) => {
    setCurrentArtifact(artifactId)
    setCurrentRoute('studio')
  }

  // Planning modal handlers
  const handlePlanApproved = () => {
    setShowPlanningModal(false)
    // Continue with generation using the approved plan
    if (pendingProjectPlan && pendingGenerationMessage) {
      continueGenerationWithPlan(pendingGenerationMessage, pendingProjectPlan)
    }
    setPendingProjectPlan(null)
    setPendingGenerationMessage('')
  }

  const handlePlanRejected = () => {
    setShowPlanningModal(false)
    setPendingProjectPlan(null)
    setPendingGenerationMessage('')
    setGenerating(false)
    thinking.error('Generation cancelled by user')

    // Add cancellation message to chat
    const cancelMessage: ChatMessage = {
      id: `msg_${Date.now()}_cancel`,
      type: 'assistant',
      content: "No problem! Feel free to refine your request and I'll create a new plan for you.",
      timestamp: Date.now()
    }
    addChatMessage(cancelMessage)
    memoryService.addMessages([cancelMessage])
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

  if (currentRoute === 'developer') {
    return (
      <DeveloperDashboard
        onNavigateBack={() => setCurrentRoute(isAuthenticated ? 'dashboard' : 'landing')}
      />
    )
  }

  // Continue generation with approved project plan
  const continueGenerationWithPlan = async (message: string, projectPlan: ProjectPlan) => {
    try {
      // Continue from where planning left off
      const result = await chatService.generateWithReasoning(message, {
        onReasoningComplete: () => {
          console.log('✅ Reasoning phase complete (skipped - already done)')
        },
        onPlanningComplete: () => {
          console.log('✅ Planning phase complete (already approved)')
        },
        onGenerationStart: () => {
          console.log('⚡ Starting code generation phase...')
          thinking.startStreaming()
        },
        onGenerationComplete: (artifact) => {
          console.log('🚀 Code generation complete!')
          thinking.complete()

          // Add clean success message
          const successMessage: ChatMessage = {
            id: `msg_${Date.now()}_success`,
            type: 'assistant',
            content: `Done! Your ${projectPlan.name} is ready.\n\nCheck it out in the editor and preview. I've included a plan.md file with all the features we discussed.`,
            timestamp: Date.now(),
            artifactId: artifact.id
          }
          addChatMessage(successMessage)
          memoryService.addMessages([successMessage])

          // Add the artifact
          addArtifact(artifact)
          setCurrentArtifact(artifact.id)
        },
        onError: (error) => {
          console.error('Generation pipeline failed:', error)
          thinking.error('Generation failed. Please try again.')

          const errorMessage: ChatMessage = {
            id: `msg_${Date.now()}_error`,
            type: 'assistant',
            content: 'Hmm, I ran into a problem generating that code. Could you try again?',
            timestamp: Date.now()
          }
          addChatMessage(errorMessage)
          memoryService.addMessages([errorMessage])
        },
        onPhaseEvent: (phaseEvent) => {
          // Handle phase events for continued generation
          uiSummaryService.onChatServicePhaseEvent(phaseEvent)

          switch (phaseEvent.type) {
            case 'phase_step':
              if (phaseEvent.status === 'active') {
                const existingStep = thinking.steps.find(s => s.id === phaseEvent.stepId)
                if (!existingStep) {
                  const activeSteps = thinking.steps.filter(s => s.status === 'active')
                  activeSteps.forEach(step => thinking.completeStep(step.id))
                  thinking.addStep(phaseEvent.label, 'active', phaseEvent.stepId)
                } else {
                  thinking.updateStep(phaseEvent.stepId, {
                    label: phaseEvent.label,
                    status: 'active'
                  })
                }
              } else if (phaseEvent.status === 'complete') {
                thinking.completeStep(phaseEvent.stepId)
              }
              break

            case 'phase_complete':
              if (phaseEvent.phase === 'generation') {
                thinking.complete()
              }
              break
          }
        }
      })
    } catch (error) {
      console.error('Continue generation failed:', error)
      setGenerating(false)
      thinking.error('Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
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
    
    console.log(`Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(1)}% confidence) - ${intentResult.reasoning}`)
    
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
          
          // Run internal pipeline with real progress tracking
          const result = await chatService.generateWithReasoning(message, {
            onReasoningComplete: (steps) => {
              console.log(`✅ Reasoning phase complete with ${steps.length} steps`)
              // Internal reasoning is complete, but UI summary continues independently
            },
            onGenerationStart: () => {
              console.log('⚡ Starting code generation phase...')
              thinking.startStreaming()
            },
            onGenerationComplete: (artifact) => {
              console.log('🚀 Code generation complete!')
              thinking.complete()

              // Add clean success message
              const fileCount = Object.keys(artifact.files).length
              const successMessage: ChatMessage = {
                id: `msg_${Date.now()}_success`,
                type: 'assistant',
                content: `Done! Your component is ready.\n\nCheck it out in the editor and preview.`,
                timestamp: Date.now(),
                artifactId: artifact.id
              }
              addChatMessage(successMessage)

              // Update memory service with assistant response
              memoryService.addMessages([successMessage])
            },
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

              // Handle thinking panel updates - use ChatService's step IDs to avoid duplicates
              switch (phaseEvent.type) {
                case 'phase_start':
                  if (phaseEvent.phase === 'thinking') {
                    thinking.reset()
                    thinking.startThinking()
                  } else if (phaseEvent.phase === 'generation') {
                    thinking.startStreaming()
                  }
                  break

                case 'phase_step':
                  if (phaseEvent.status === 'active') {
                    // Check if this step already exists to avoid duplicates
                    const existingStep = thinking.steps.find(s => s.id === phaseEvent.stepId)
                    if (!existingStep) {
                      // Complete any currently active steps first
                      const activeSteps = thinking.steps.filter(s => s.status === 'active')
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

                case 'planning_complete':
                  // Show planning modal for user approval
                  if (phaseEvent.projectPlan) {
                    setPendingProjectPlan(phaseEvent.projectPlan)
                    setPendingGenerationMessage(message)
                    setShowPlanningModal(true)

                    // Stop the current generation process
                    // We'll continue after user approval
                    return // Exit early to prevent further generation
                  }
                  break

                case 'phase_complete':
                  if (phaseEvent.phase === 'generation') {
                    thinking.complete()
                  } else if (phaseEvent.phase === 'thinking') {
                    // Complete any remaining active steps
                    const activeSteps = thinking.steps.filter(s => s.status === 'active')
                    activeSteps.forEach(step => thinking.completeStep(step.id))
                  } else if (phaseEvent.phase === 'planning') {
                    // Planning phase is complete, but we're waiting for user approval
                    const activeSteps = thinking.steps.filter(s => s.status === 'active')
                    activeSteps.forEach(step => thinking.completeStep(step.id))
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
        // Handle code modifications using conversation engine
        const { conversationEngine } = await import('./lib/conversationEngine')
        
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
        onNavigateToDeveloper={handleNavigateToDeveloper}
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

      {/* Planning Modal */}
      {showPlanningModal && pendingProjectPlan && (
        <PlanningModal
          isOpen={showPlanningModal}
          projectPlan={pendingProjectPlan}
          onApprove={handlePlanApproved}
          onReject={handlePlanRejected}
        />
      )}
    </div>
  )
}

export default App