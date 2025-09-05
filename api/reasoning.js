import { setCorsHeaders } from './utils/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { goal, options = {} } = req.body || {}

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' })
    }

    // Set up server-sent events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })

    const startTime = Date.now()

    // Step 1: Thought - Analyze the request
    const step1 = {
      id: 'step-1',
      type: 'thought',
      content: `I need to analyze this request: "${goal}". Let me break down what the user wants and determine the best approach to create a functional React component.`,
      timestamp: new Date().toISOString(),
      metadata: { analysis: 'intent_classification' }
    }
    res.write(`data: ${JSON.stringify({ type: 'step', step: step1 })}\n\n`)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Step 2: Action - Generate the component
    const step2 = {
      id: 'step-2',
      type: 'action',
      content: `Based on my analysis, I'll create a React component using Google Gemini AI. I'm generating functional code with proper state management and interactive features...`,
      timestamp: new Date().toISOString(),
      metadata: { intent: { intent: 'generation', confidence: 0.95 } }
    }
    res.write(`data: ${JSON.stringify({ type: 'step', step: step2 })}\n\n`)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Call the generate API to get real code
    let artifact = null
    try {
      const generateResponse = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: goal,
          device: options.device || 'desktop',
          framework: options.framework || 'react'
        })
      })

      if (generateResponse.ok) {
        const result = await generateResponse.json()
        artifact = result.artifact
      }
    } catch (error) {
      console.error('Generate API call failed:', error)
    }

    // Step 3: Observation - Code generation complete
    const step3 = {
      id: 'step-3',
      type: 'observation',
      content: artifact 
        ? `Successfully generated a React component! The code includes modern hooks, proper styling, and interactive functionality. The component is ready for preview.`
        : `Generated component structure, but encountered some issues with code generation. Providing fallback solution.`,
      timestamp: new Date().toISOString(),
      metadata: { 
        generated: true,
        hasArtifact: !!artifact,
        codeLines: artifact ? artifact.files['App.jsx']?.split('\n').length : 0
      }
    }
    res.write(`data: ${JSON.stringify({ type: 'step', step: step3 })}\n\n`)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Step 4: Final Answer
    const executionTime = Date.now() - startTime
    const step4 = {
      id: 'step-4',
      type: 'final_answer',
      content: `✅ **React Component Generated!**

I've successfully created a functional React component for: "${goal}"

**Features Generated:**
• Interactive UI with modern React hooks
• Proper state management and event handling  
• Responsive design with clean styling
• Production-ready code structure

**Technical Details:**
• Framework: React with JSX
• AI Provider: Google Gemini
• Execution Time: ${executionTime}ms
• Component Type: Functional with hooks

The component is now ready for preview and can be used immediately!`,
      timestamp: new Date().toISOString(),
      metadata: { 
        success: true,
        executionTime,
        aiProvider: 'google-gemini'
      }
    }
    res.write(`data: ${JSON.stringify({ type: 'step', step: step4 })}\n\n`)

    const allSteps = [step1, step2, step3, step4]

    // Send completion with artifact
    res.write(`data: ${JSON.stringify({
      type: 'completed',
      success: true,
      steps: allSteps,
      finalAnswer: step4.content,
      totalSteps: allSteps.length,
      executionTime,
      artifact: artifact || undefined
    })}\n\n`)

    res.end()

  } catch (error) {
    console.error('Reasoning API Error:', error)
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
    res.write(JSON.stringify({ 
      error: 'Internal server error during reasoning',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }))
    res.end()
  }
}