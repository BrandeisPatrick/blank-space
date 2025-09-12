import { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, device = 'desktop', framework = 'react' } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Use X.AI Grok Code Fast for code generation, GPT-5-nano as fallback
    let model
    if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1')
    } else if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-5-nano')
    } else {
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY' 
      })
    }

    const isReact = framework.toLowerCase().includes('react')
    
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
            - Add interactivity where appropriate
            - For complex components, create multiple files with proper imports
            - Use components/ folder for reusable components
            - Example multi-file structure: App.jsx imports from components/Header.jsx`
            : `Create a website based on this request: ${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 8000,
    })

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    
    // Convert streaming text to artifact format
    let fullResponse = ''
    
    try {
      for await (const chunk of result.textStream) {
        fullResponse += chunk
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
      }

      // Parse the complete response and create artifact
      try {
        const generatedCode = JSON.parse(fullResponse)
        const artifactId = `artifact_${Date.now()}`
        
        // Sanitize React code to remove problematic module syntax and template literals
        if (isReact && generatedCode.html) {
          // Remove any ES6 module syntax that could cause "exports is not defined"
          generatedCode.html = generatedCode.html
            .replace(/^\s*import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
            .replace(/^\s*export\s+.*?$/gm, '')
            .replace(/^\s*module\.exports\s*=.*$/gm, '')
            .replace(/^\s*exports\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=.*$/gm, '')
            .trim()
          
          // Replace template literals that cause Babel parsing errors
          generatedCode.html = generatedCode.html
            .replace(/className=\{\`([^`]*)\$\{([^}]*)\}([^`]*)\`\}/g, 
              "className={'$1' + ($2) + '$3'}")
            .replace(/className=\{\`([^`]*)\`\}/g, "className={'$1'}")
            .replace(/\`([^`]*)\$\{([^}]*)\}([^`]*)\`/g, "'$1' + ($2) + '$3'")
        }
        
        // Handle both single-file and multi-file responses
        let artifactFiles: Record<string, string>
        
        if (generatedCode.files) {
          // Multi-file response
          artifactFiles = generatedCode.files
        } else {
          // Single-file response (legacy format)
          artifactFiles = isReact ? {
            'App.jsx': generatedCode.html || '',
            'App.module.css': generatedCode.css || '',
            'hooks.js': generatedCode.js || ''
            // Don't include index.html - let the frontend handle transpilation and HTML generation
          } : {
            'index.html': generatedCode.html || '',
            'styles.css': generatedCode.css || '',
            'script.js': generatedCode.js || ''
          }
        }
        
        const artifact = {
          id: artifactId,
          projectId: 'default',
          regionId: 'full-page',
          files: artifactFiles,
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

        res.write(`data: ${JSON.stringify({ 
          type: 'completed', 
          artifact,
          success: true
        })}\n\n`)
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: 'Failed to parse AI response'
        })}\n\n`)
      }

      res.end()
    } catch (error) {
      console.error('Streaming error:', error)
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`)
      res.end()
    }

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}