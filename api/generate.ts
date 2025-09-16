import { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'

// ReAct reasoning step interface
interface ReasoningStep {
  id: string
  type: 'thought' | 'action' | 'observation' | 'final_answer'
  content: string
  timestamp: string
  metadata: any
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, device = 'desktop', framework = 'react', withReasoning = false } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Use X.AI Grok Code Fast for code generation, OpenAI for reasoning
    let codeModel, reasoningModel
    if (process.env.XAI_API_KEY) {
      codeModel = xai('grok-code-fast-1')
    } else if (process.env.OPENAI_API_KEY) {
      codeModel = openai('gpt-5-nano')
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY'
      })
    }

    if (process.env.OPENAI_API_KEY) {
      reasoningModel = openai('gpt-5-mini')
    } else if (process.env.XAI_API_KEY) {
      reasoningModel = xai('grok-code-fast-1')
    } else {
      reasoningModel = codeModel // Fallback to same model
    }

    const isReact = framework.toLowerCase().includes('react')
    let reasoningSteps: ReasoningStep[] = []
    let stepId = 1

    // Phase 1: ReAct Reasoning (if requested)
    if (withReasoning) {
      try {
        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

        // Step 1: Thought - Analyze the goal
        const thoughtStep: ReasoningStep = {
          id: `step-${stepId++}`,
          type: 'thought',
          content: `I need to analyze this request: "${prompt}". Let me determine if this is a React component, a full website, or code generation task.`,
          timestamp: new Date().toISOString(),
          metadata: { analysis: 'intent_classification' },
        }
        reasoningSteps.push(thoughtStep)

        res.write(`data: ${JSON.stringify({
          type: 'reasoning_step',
          step: thoughtStep
        })}\n\n`)

        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // Step 2: Action - Classify intent using AI
        let intentResult: any
        try {
          const intentResponse = await streamText({
            model: reasoningModel,
            messages: [
              {
                role: 'system',
                content: `Classify user intent for coding requests. Return JSON only.

                Return this exact format:
                {
                  "intent": "generation|modification|explanation|conversation",
                  "confidence": 0.95,
                  "reasoning": "Brief explanation"
                }`
              },
              {
                role: 'user',
                content: `Classify this request: "${prompt}"`
              }
            ],
            temperature: 0.1,
          })

          let intentText = ''
          for await (const chunk of intentResponse.textStream) {
            intentText += chunk
          }

          try {
            intentResult = JSON.parse(intentText)
          } catch (parseError) {
            console.warn('Failed to parse intent classification:', parseError)
            intentResult = { intent: 'generation', confidence: 0.7, reasoning: 'Fallback classification' }
          }
        } catch (error) {
          console.warn('Intent classification failed:', error)
          intentResult = { intent: 'generation', confidence: 0.7, reasoning: 'Fallback classification' }
        }

        const actionStep: ReasoningStep = {
          id: `step-${stepId++}`,
          type: 'action',
          content: `Based on my analysis, this appears to be a ${intentResult.intent} request (${(intentResult.confidence * 100).toFixed(1)}% confidence). ${intentResult.reasoning}. Now I'll generate the appropriate ${isReact ? 'React' : 'web'} solution.`,
          timestamp: new Date().toISOString(),
          metadata: { intent: intentResult },
        }
        reasoningSteps.push(actionStep)

        res.write(`data: ${JSON.stringify({
          type: 'reasoning_step',
          step: actionStep
        })}\n\n`)

        await new Promise(resolve => setTimeout(resolve, 800))

        // Step 3: Observation - Start generation
        const observationStep: ReasoningStep = {
          id: `step-${stepId++}`,
          type: 'observation',
          content: `Starting code generation for ${isReact ? 'React component' : 'web application'}. I'll create clean, modern code with proper structure and styling.`,
          timestamp: new Date().toISOString(),
          metadata: {
            framework: framework,
            device: device
          },
        }
        reasoningSteps.push(observationStep)

        res.write(`data: ${JSON.stringify({
          type: 'reasoning_step',
          step: observationStep
        })}\n\n`)

        // Signal reasoning complete
        res.write(`data: ${JSON.stringify({
          type: 'reasoning_complete',
          steps: reasoningSteps
        })}\n\n`)

        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error('Reasoning phase failed:', error)
        // Continue to generation even if reasoning fails
      }
    }

    // Phase 2: Code Generation
    res.write(`data: ${JSON.stringify({ type: 'generation_start' })}\n\n`)

    const systemPrompt = isReact
      ? `You are an expert React developer. Generate clean, modern React components with JSX, CSS, and JavaScript logic.

      IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.

      Return your response in this exact JSON format for single-file components:
      {
        "html": "React JSX component code here",
        "css": "CSS styles here (use modern CSS)",
        "js": "Additional JavaScript logic if needed"
      }

      OR for multi-file projects (complex components):
      {
        "files": {
          "App.jsx": "Main component code with imports",
          "components/Header.jsx": "Header component code",
          "components/Button.jsx": "Button component code",
          "styles/App.css": "Main styles"
        }
      }

      JSON RULES:
      - Use double quotes only, escape internal quotes as \\"
      - No template literals or backticks in JSON
      - Use single quotes for JSX/CSS attribute values when possible
      - Escape newlines as \\n or write compact code
      - No unescaped backslashes

      JSX TEMPLATE LITERAL RULES (CRITICAL):
      - NEVER use template literals (backticks \`) in JSX code
      - NEVER use \${} syntax in JSX attributes or content
      - For dynamic className: use string concatenation or array methods
      - Examples: className={'item ' + (active ? 'active' : '')}
      - Examples: className={['item', active && 'active'].filter(Boolean).join(' ')}

      React Code Guidelines:
      - Create functional components using React hooks
      - Use modern JSX syntax and patterns
      - Implement responsive design with modern CSS
      - Use useState, useEffect, and other hooks appropriately
      - Create reusable, accessible components
      - Follow React best practices and conventions
      - Include proper event handlers and state management
      - Use modern CSS (flexbox/grid) for layouts
      - Make components production-ready and well-structured

      CRITICAL BROWSER COMPATIBILITY RULES:
      - DO NOT use ES6 module syntax (no import/export statements)
      - DO NOT use require() or module.exports
      - Write code that runs directly in browser with Babel transpilation
      - Use function declarations, not ES6 modules
      - All code must be executable in a browser script tag with type="text/babel"
      - If you need React hooks, use them directly (useState, useEffect available globally)

      MANDATORY COMPONENT NAMING:
      - Your main component MUST be named 'App' (capital A)
      - Use either: function App() { ... } OR const App = () => { ... }
      - DO NOT export the component - just define it
      - The component will be rendered with: ReactDOM.render(<App />, root)

      Example structure:
      function App() {
        const [count, setCount] = React.useState(0);
        return <div onClick={() => setCount(count + 1)}>Count: {count}</div>;
      }`
      : `You are an expert web developer. Generate clean, modern HTML, CSS, and JavaScript code.

      Return ONLY valid JSON with the code structure requested.`

    const result = await streamText({
      model: codeModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: isReact
            ? `Create a React component based on this request: ${prompt}

            Requirements:
            - Use functional components with hooks
            - Make it responsive and accessible
            - Include proper styling
            - Add interactivity where appropriate
            - For complex components, create multiple files with proper imports
            - Use components/ folder for reusable components
            - Example multi-file structure: App.jsx imports from components/Header.jsx`
            : `Create a website based on this request: ${prompt}`
        }
      ],
      temperature: 0.7,
    })

    // Convert streaming text to artifact format
    let fullResponse = ''

    try {
      for await (const chunk of result.textStream) {
        fullResponse += chunk
        res.write(`data: ${JSON.stringify({
          type: 'generation_chunk',
          chunk
        })}\n\n`)
      }

      // Parse the complete response and create artifact
      try {
        const generatedCode = JSON.parse(fullResponse)
        const artifactId = `artifact_${Date.now()}`

        // Sanitize React code to remove problematic module syntax and template literals
        if (isReact && generatedCode.html) {
          // Remove import/export statements that could cause issues
          generatedCode.html = generatedCode.html
            .replace(/import\s+.*?from.*?['""].*?['""]\s*;?\s*/g, '')
            .replace(/export\s+(default\s+)?/g, '')
            .replace(/module\.exports\s*=.*?;?\s*/g, '')
            .replace(/export\s*\{.*?\}\s*;?\s*/g, '')
        }

        // Handle multi-file structure
        if (generatedCode.files) {
          // For multi-file projects, sanitize each file
          Object.keys(generatedCode.files).forEach(filename => {
            if (filename.endsWith('.jsx') || filename.endsWith('.js')) {
              generatedCode.files[filename] = generatedCode.files[filename]
                .replace(/import\s+.*?from.*?['""].*?['""]\s*;?\s*/g, '')
                .replace(/export\s+(default\s+)?/g, '')
                .replace(/module\.exports\s*=.*?;?\s*/g, '')
                .replace(/export\s*\{.*?\}\s*;?\s*/g, '')
            }
          })
        }

        const artifact = {
          id: artifactId,
          type: isReact ? 'react-component' : 'website',
          title: `Generated ${isReact ? 'React Component' : 'Website'}`,
          content: generatedCode,
          metadata: {
            framework,
            device,
            timestamp: new Date().toISOString(),
            reasoningSteps: withReasoning ? reasoningSteps : undefined
          }
        }

        // Final reasoning step if reasoning was enabled
        if (withReasoning) {
          const finalStep: ReasoningStep = {
            id: `step-${stepId++}`,
            type: 'final_answer',
            content: `Successfully generated ${isReact ? 'React component' : 'website'}! The solution includes:\n• ${isReact ? 'Modern React functional component with hooks' : 'Clean HTML structure'}\n• Responsive CSS styling\n• ${isReact ? 'Interactive functionality with React state' : 'Interactive JavaScript functionality'}\n• Production-ready, accessible code`,
            timestamp: new Date().toISOString(),
            metadata: {
              generated: true,
              hasArtifact: true,
              artifactId: artifactId
            },
          }
          reasoningSteps.push(finalStep)

          res.write(`data: ${JSON.stringify({
            type: 'reasoning_step',
            step: finalStep
          })}\n\n`)
        }

        res.write(`data: ${JSON.stringify({
          type: 'generation_complete',
          artifact,
          reasoningSteps: withReasoning ? reasoningSteps : undefined
        })}\n\n`)

      } catch (parseError) {
        console.error('Failed to parse generated code as JSON:', parseError)
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to parse generated code. Please try again.'
        })}\n\n`)
      }

    } catch (streamError) {
      console.error('Streaming failed:', streamError)
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Code generation failed. Please try again.'
      })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}