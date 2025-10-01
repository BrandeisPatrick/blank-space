import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      prompt,
      device = 'desktop',
      framework = 'react',
      withReasoning = false,
      sessionContext
    } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Select AI model - OpenAI primary, XAI fallback
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o')
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-beta')
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      })
    }

    const isReact = framework.toLowerCase().includes('react')

    const systemPrompt = isReact
      ? `You are Bina, an expert React developer. Generate clean, modern React components.

${withReasoning ? `REASONING MODE: Think step-by-step before generating code.
1. First emit reasoning steps as you analyze the request
2. Then generate the final code

Emit reasoning steps in this format:
data: {"type":"reasoning_step","step":{"id":"step_1","type":"thought","content":"...","timestamp":"..."}}

After reasoning is complete, emit:
data: {"type":"reasoning_complete"}

Then generate code.` : ''}

CRITICAL: You MUST return your response wrapped in a single <binaArtifact> tag with nested <binaAction> tags.

FORMAT REQUIREMENTS:
- Wrap everything in: <binaArtifact id="unique-id" title="Project Name">
- Each file must be a <binaAction type="file" filePath="path/to/file">
- Include FULL file contents (no partial edits or "rest remains same")
- Add shell commands as <binaAction type="shell">
- Close all tags properly

EXAMPLE:
<binaArtifact id="app-${Date.now()}" title="React Application">
  <binaAction type="file" filePath="App.jsx">
import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default App;
  </binaAction>

  <binaAction type="file" filePath="styles.css">
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
  </binaAction>
</binaArtifact>

GENERATION GUIDELINES:
- Modern functional components with hooks
- Responsive design with modern CSS or Tailwind
- Proper state management with useState/useReducer
- Event handlers and side effects with useEffect
- Accessible components (ARIA labels, semantic HTML)
- Clean, well-structured code

IMPORTANT FOR REACT APPS:
- Always generate an App entry point (App.jsx/App.tsx) that imports its child views from `./components`
- Always create a `components/` folder and place every visual subcomponent inside it (e.g., `components/TodoList.tsx`)
- Always extract custom hook logic into a `hooks/` folder (e.g., `hooks/useTodos.ts`), even for simple stateful helpers
- Keep utilities/helpers in `lib/` or `utils/` if needed; never co-locate extras beside App
- Update imports to point at these folders (e.g., `import TodoList from './components/TodoList'`)
- Styles belong in dedicated CSS/SCSS files referenced from App or components
- DO NOT generate index.html, index.js, or package.json - those are handled by the host app

RULES:
- ALWAYS include FULL file contents
- NO placeholders like "// rest of code here"
- NO markdown code blocks inside <binaAction>
- Close ALL tags properly`
      : `You are Bina, an expert web developer. Generate clean HTML, CSS, and JavaScript using <binaArtifact> and <binaAction> tags.`

    // Build context-aware prompt
    let enhancedPrompt = prompt
    if (sessionContext) {
      enhancedPrompt = `${sessionContext}\n\n--- Current Request ---\n${prompt}`
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      temperature: 0.7
    })

    // Helper function to parse Bina XML artifact
    function parseBinaArtifact(xmlString: string) {
      // Extract artifact
      const artifactMatch = xmlString.match(/<binaArtifact[^>]*>([\s\S]*?)<\/binaArtifact>/)
      if (!artifactMatch) {
        throw new Error('No binaArtifact found in response')
      }

      const artifactContent = artifactMatch[1]
      const idMatch = artifactMatch[0].match(/id="([^"]*)"/)
      const titleMatch = artifactMatch[0].match(/title="([^"]*)"/)

      // Extract all file actions
      const fileRegex = /<binaAction\s+type="file"\s+filePath="([^"]*)"\s*>([\s\S]*?)<\/binaAction>/g
      const files: Record<string, string> = {}

      let fileMatch
      while ((fileMatch = fileRegex.exec(artifactContent)) !== null) {
        const filePath = fileMatch[1]
        const content = fileMatch[2].trim()
        files[filePath] = content
      }

      // Extract shell commands
      const shellRegex = /<binaAction\s+type="shell"\s*>([\s\S]*?)<\/binaAction>/g
      const shellCommands: string[] = []

      let shellMatch
      while ((shellMatch = shellRegex.exec(artifactContent)) !== null) {
        shellCommands.push(shellMatch[1].trim())
      }

      return {
        id: idMatch?.[1] || `artifact_${Date.now()}`,
        title: titleMatch?.[1] || 'Generated Project',
        files,
        shellCommands
      }
    }

    // Stream the response
    let fullResponse = ''
    let reasoningSteps: any[] = []
    let inReasoningPhase = withReasoning

    for await (const chunk of result.textStream) {
      fullResponse += chunk

      // Try to parse reasoning steps
      if (inReasoningPhase && chunk.includes('reasoning_step')) {
        try {
          const stepMatch = chunk.match(/\{[^}]*"type":\s*"reasoning_step"[^}]*\}/)
          if (stepMatch) {
            const step = JSON.parse(stepMatch[0])
            reasoningSteps.push(step.step)
            res.write(`data: ${JSON.stringify(step)}\n\n`)
          }
        } catch (e) {
          // Continue if parsing fails
        }
      }

      // Check if reasoning is complete
      if (chunk.includes('reasoning_complete')) {
        inReasoningPhase = false
        res.write(`data: ${JSON.stringify({ type: 'reasoning_complete' })}\n\n`)
      }

      // Stream the raw chunk for client-side BinaArtifact parsing
      // This allows the client to parse and execute actions incrementally
      res.write(`data: ${JSON.stringify({
        type: 'generation_chunk',
        chunk: chunk
      })}\n\n`)
    }

    // Parse the Bina XML artifact from the response
    try {
      const parsed = parseBinaArtifact(fullResponse)

      const artifact = {
        id: parsed.id,
        projectId: 'default',
        regionId: 'full-page',
        files: parsed.files,
        entry: Object.keys(parsed.files).find(f => f.includes('index.html')) || Object.keys(parsed.files)[0],
        metadata: {
          device,
          framework,
          title: parsed.title,
          shellCommands: parsed.shellCommands
        },
        createdAt: new Date().toISOString(),
        author: 'bina-ai-generator'
      }

      res.write(`data: ${JSON.stringify({
        type: 'generation_complete',
        artifact,
        reasoningSteps
      })}\n\n`)

    } catch (e) {
      console.error('Failed to parse Bina artifact:', e)
      console.error('Full response:', fullResponse.slice(0, 500))

      // Send error as SSE event (headers already sent)
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to parse artifact. Please ensure response follows Bina XML format.'
      })}\n\n`)
    }

    res.end()
  } catch (error) {
    console.error('Generation error:', error)

    // Check if headers were already sent as SSE
    if (!res.headersSent) {
      // Headers not sent yet - can still send JSON error
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }

    // Headers already sent as SSE - send error as SSE event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })}\n\n`)
    res.end()
  }
}
