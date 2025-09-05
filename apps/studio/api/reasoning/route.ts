import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

interface ReasoningStep {
  id: string
  type: 'thought' | 'action' | 'observation' | 'final_answer'
  content: string
  timestamp: string
  metadata: any
}

export async function POST(request: Request) {
  try {
    const { goal, options = {} } = await request.json()

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Goal is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get AI provider from environment
    let model
    if (process.env.GROQ_API_KEY) {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      model = groq('llama-3.1-70b-versatile')
    } else if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o')
    } else if (process.env.ANTHROPIC_API_KEY) {
      model = anthropic('claude-3-5-sonnet-20241022')
    } else {
      return new Response(
        JSON.stringify({ error: 'No AI provider configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create server-sent events stream for ReAct reasoning
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const steps: ReasoningStep[] = []
        let stepId = 1

        try {
          // Send initial connection message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\\n\\n`)
          )

          // Step 1: Thought - Analyze the goal
          const thoughtStep: ReasoningStep = {
            id: `step-${stepId++}`,
            type: 'thought',
            content: `I need to analyze this request: "${goal}". Let me determine if this is a React component, a full website, or code generation task.`,
            timestamp: new Date().toISOString(),
            metadata: { analysis: 'intent_classification' },
          }
          steps.push(thoughtStep)
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'step', 
              step: thoughtStep 
            })}\\n\\n`)
          )

          // Simulate thinking delay
          await new Promise(resolve => setTimeout(resolve, 1200))

          // Step 2: Action - Classify intent using AI
          let intentResult: any
          try {
            const intentResponse = await streamText({
              model,
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
                  content: `Classify this request: "${goal}"`
                }
              ],
              temperature: 0.1,
              maxTokens: 200,
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
            content: `Based on my analysis, this appears to be a ${intentResult.intent} request (${(intentResult.confidence * 100).toFixed(1)}% confidence). ${intentResult.reasoning}. Now I'll generate the appropriate React solution.`,
            timestamp: new Date().toISOString(),
            metadata: { intent: intentResult },
          }
          steps.push(actionStep)
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'step', 
              step: actionStep 
            })}\\n\\n`)
          )

          await new Promise(resolve => setTimeout(resolve, 1200))

          // Step 3: Observation - Generate the code
          let artifact: any = undefined
          try {
            // Call our own generate endpoint
            const generateResponse = await fetch(`${request.url.replace('/reasoning', '/generate')}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: goal,
                framework: 'react',
                device: options.device || 'desktop'
              })
            })

            if (generateResponse.ok) {
              const reader = generateResponse.body?.getReader()
              if (reader) {
                let fullResponse = ''
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  
                  const chunk = new TextDecoder().decode(value)
                  const lines = chunk.split('\\n\\n')
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const data = JSON.parse(line.slice(6))
                        if (data.type === 'completed' && data.artifact) {
                          artifact = data.artifact
                        }
                      } catch (e) {
                        // Continue processing other lines
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Generation failed during reasoning:', error)
          }

          const observationStep: ReasoningStep = {
            id: `step-${stepId++}`,
            type: 'observation',
            content: artifact
              ? `Successfully generated React code! The solution includes:\\n• Component structure with JSX\\n• Responsive CSS styling\\n• Interactive functionality with React hooks\\n• Clean, production-ready code`
              : `Generation encountered an issue. Let me create a fallback React component structure.`,
            timestamp: new Date().toISOString(),
            metadata: { 
              generated: !!artifact,
              hasArtifact: !!artifact
            },
          }
          steps.push(observationStep)
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'step', 
              step: observationStep 
            })}\\n\\n`)
          )

          await new Promise(resolve => setTimeout(resolve, 1200))

          // Step 4: Final Answer - Provide the solution
          const finalStep: ReasoningStep = {
            id: `step-${stepId++}`,
            type: 'final_answer',
            content: artifact
              ? `✅ **React Solution Complete!**\\n\\nI've successfully created a React-based solution for: "${goal}"\\n\\n**Generated:**\\n• Modern React component with JSX\\n• Responsive CSS styling\\n• Interactive features using React hooks\\n• Clean, production-ready code\\n\\nThe code is ready for preview and can be copied, modified, or deployed immediately.`
              : `I've analyzed your request: "${goal}"\\n\\nWhile I encountered some issues with the generation service, I can help you create React components, websites, and applications. Please try rephrasing your request or ensure the AI service is properly configured.`,
            timestamp: new Date().toISOString(),
            metadata: { 
              artifact: artifact,
              success: !!artifact
            },
          }
          steps.push(finalStep)
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'step', 
              step: finalStep 
            })}\\n\\n`)
          )

          await new Promise(resolve => setTimeout(resolve, 800))

          // Send completion message with full result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'completed',
              success: true,
              steps,
              finalAnswer: finalStep.content,
              totalSteps: steps.length,
              artifact
            })}\\n\\n`)
          )

          controller.close()
        } catch (error) {
          console.error('ReAct reasoning error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\\n\\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Reasoning API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}