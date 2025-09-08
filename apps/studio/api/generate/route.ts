import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: Request) {
  try {
    const { prompt, device = 'desktop', framework = 'react' } = await request.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Use X.AI Grok Code Fast for code generation, GPT-5-nano as fallback
    let model
    if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1')
    } else if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-5-nano')
    } else {
      return new Response(
        JSON.stringify({ error: 'No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const isReact = framework.toLowerCase().includes('react')
    
    const systemPrompt = isReact
      ? `You are an expert React developer. Generate clean, modern React components with JSX, CSS, and JavaScript logic.

      IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.
      
      Return your response in this exact JSON format:
      {
        "html": "React JSX component code here",
        "css": "CSS styles here (use modern CSS)", 
        "js": "Additional JavaScript logic if needed"
      }
      
      JSON RULES:
      - Use double quotes only, escape internal quotes as \\"
      - No template literals or backticks in JSON
      - Use single quotes for JSX/CSS attribute values when possible
      - Escape newlines as \\n or write compact code
      - No unescaped backslashes
      
      React Code Guidelines:
      - Create functional components using React hooks
      - Use modern JSX syntax and patterns
      - Implement responsive design with modern CSS
      - Use useState, useEffect, and other hooks appropriately
      - Create reusable, accessible components
      - Follow React best practices and conventions
      - Include proper event handlers and state management
      - Use modern CSS (flexbox/grid) for layouts
      - Make components production-ready and well-structured`
      : `You are an expert web developer. Generate clean, modern HTML, CSS, and JavaScript code.
      
      Return ONLY valid JSON with the code structure requested.`

    const result = await streamText({
      model,
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
            - Add interactivity where appropriate`
            : `Create a website based on this request: ${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 8000,
    })

    // Convert streaming text to artifact format
    let fullResponse = ''
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          }

          // Parse the complete response and create artifact
          try {
            const generatedCode = JSON.parse(fullResponse)
            const artifactId = `artifact_${Date.now()}`
            
            const artifact = {
              id: artifactId,
              projectId: 'default',
              regionId: 'full-page',
              files: isReact ? {
                'App.jsx': generatedCode.html || '',
                'App.module.css': generatedCode.css || '',
                'hooks.js': generatedCode.js || '',
                'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${generatedCode.html || ''}
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
    <style>${generatedCode.css || ''}</style>
</body>
</html>`
              } : {
                'index.html': generatedCode.html || '',
                'styles.css': generatedCode.css || '',
                'script.js': generatedCode.js || ''
              },
              entry: 'index.html',
              metadata: {
                device: device,
                region: { start: { x: 0, y: 0 }, end: { x: 23, y: 19 } },
                framework: framework,
                isReact: isReact,
                dependencies: isReact ? ['react', 'react-dom'] : []
              },
              createdAt: new Date().toISOString(),
              author: 'ai-generator'
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'completed', 
              artifact,
              success: true
            })}\n\n`))
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              error: 'Failed to parse AI response'
            })}\n\n`))
          }

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`))
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
    console.error('API Error:', error)
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