import { useState, useCallback, useRef, useEffect } from 'react'

export const useThinkingState = (options = {}) => {
  const { autoCollapse = true, collapseDelay = 3000 } = options

  const [phase, setPhase] = useState('idle')
  const [steps, setSteps] = useState([])
  const [answer, setAnswer] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  const collapseTimer = useRef()
  const stepCounter = useRef(0)

  // Clear any existing timer when phase changes
  useEffect(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = undefined
    }

    if (phase === 'done' && autoCollapse) {
      collapseTimer.current = setTimeout(() => {
        setIsVisible(false)
      }, collapseDelay)
    }

    return () => {
      if (collapseTimer.current) {
        clearTimeout(collapseTimer.current)
      }
    }
  }, [phase, autoCollapse, collapseDelay])

  const reset = useCallback(() => {
    setPhase('idle')
    setSteps([])
    setAnswer('')
    setIsVisible(true)
    stepCounter.current = 0

    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = undefined
    }
  }, [])

  const startThinking = useCallback(() => {
    reset()
    setPhase('thinking')
    setIsVisible(true)
  }, [reset])

  const addStep = useCallback((label, status = 'pending', customId) => {
    const newStep = {
      id: customId || `step_${++stepCounter.current}`,
      label,
      status,
      timestamp: Date.now()
    }

    setSteps(prev => [...prev, newStep])
    return newStep.id
  }, [])

  const updateStep = useCallback((stepId, updates) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, ...updates, timestamp: updates.timestamp || Date.now() }
        : step
    ))
  }, [])

  const completeStep = useCallback((stepId) => {
    updateStep(stepId, { status: 'complete' })
  }, [updateStep])

  const errorStep = useCallback((stepId) => {
    updateStep(stepId, { status: 'error' })
  }, [updateStep])

  const startStreaming = useCallback(() => {
    setPhase('streaming')
  }, [])

  const appendAnswer = useCallback((text) => {
    setAnswer(prev => prev + text)
  }, [])

  const setAnswerText = useCallback((text) => {
    setAnswer(text)
  }, [])

  const complete = useCallback(() => {
    setPhase('done')
    // Mark any remaining active steps as complete
    setSteps(prev => prev.map(step =>
      step.status === 'active' ? { ...step, status: 'complete' } : step
    ))
  }, [])

  const error = useCallback((errorMessage) => {
    setPhase('error')
    // Mark any active steps as error
    setSteps(prev => prev.map(step =>
      step.status === 'active' ? { ...step, status: 'error' } : step
    ))
    if (errorMessage) {
      setAnswer(errorMessage)
    }
  }, [])

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  // Predefined phase sequences for common AI workflows
  const sequences = {
    codeGeneration: [
      'Analyzing request',
      'Planning component structure',
      'Generating React code',
      'Optimizing output'
    ],
    reasoning: [
      'Understanding question',
      'Gathering context',
      'Analyzing options',
      'Forming response'
    ],
    webSearch: [
      'Parsing query',
      'Searching sources',
      'Ranking results',
      'Synthesizing answer'
    ]
  }

  const runSequence = useCallback(async (
    sequenceType,
    delays = [600, 800, 1000, 400]
  ) => {
    const sequence = sequences[sequenceType]
    startThinking()

    for (let i = 0; i < sequence.length; i++) {
      const stepId = addStep(sequence[i], 'pending')

      // Small delay before marking as active
      await new Promise(resolve => setTimeout(resolve, 100))
      updateStep(stepId, { status: 'active' })

      // Wait for the specified delay or default
      const delay = delays[i] || delays[delays.length - 1] || 600
      await new Promise(resolve => setTimeout(resolve, delay))

      completeStep(stepId)
    }

    startStreaming()
  }, [startThinking, addStep, updateStep, completeStep, startStreaming])

  return {
    // State
    phase,
    steps,
    answer,
    isVisible,

    // Actions
    reset,
    startThinking,
    addStep,
    updateStep,
    completeStep,
    errorStep,
    startStreaming,
    appendAnswer,
    setAnswerText,
    complete,
    error,
    toggleVisibility,
    runSequence,

    // Convenience
    isActive: phase === 'thinking' || phase === 'streaming',
    isDone: phase === 'done',
    hasError: phase === 'error',
    stepCount: steps.length,
    completedSteps: steps.filter(s => s.status === 'complete').length
  }
}
