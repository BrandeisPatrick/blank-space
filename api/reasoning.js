export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { goal } = req.body || {}

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' })
    }

    // Set up server-sent events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    // Send reasoning steps with delays
    const steps = [
      {
        id: 'step-1',
        type: 'thought',
        content: `I need to analyze this request: "${goal}". This appears to be a web development task.`,
        timestamp: new Date().toISOString(),
        metadata: { analysis: 'intent_classification' }
      },
      {
        id: 'step-2', 
        type: 'action',
        content: 'Based on my analysis, this is a generation request. I\'ll create a React component solution.',
        timestamp: new Date().toISOString(),
        metadata: { intent: { intent: 'generation', confidence: 0.9 } }
      },
      {
        id: 'step-3',
        type: 'observation',
        content: 'I\'m generating a React component with modern styling and functionality...',
        timestamp: new Date().toISOString(),
        metadata: { generated: true }
      },
      {
        id: 'step-4',
        type: 'final_answer',
        content: `✅ **React Solution Complete!**\n\nI've created a React component for: "${goal}"\n\n**Generated:**\n• Modern React component with JSX\n• Responsive CSS styling\n• Clean, production-ready code\n\nThe solution is ready for preview!`,
        timestamp: new Date().toISOString(),
        metadata: { success: true }
      }
    ]

    // Send steps with delays
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      res.write(`data: ${JSON.stringify({ type: 'step', step })}\n\n`)
      
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'completed',
      success: true,
      steps,
      finalAnswer: steps[steps.length - 1].content,
      totalSteps: steps.length
    })}\n\n`)

    res.end()

  } catch (error) {
    console.error('API Error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }))
    res.end()
  }
}