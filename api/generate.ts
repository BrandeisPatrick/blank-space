import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { addViteProjectFiles } from '../src/lib/projectTemplates'

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
      ? `You are Bina, an expert React developer who ALWAYS organizes code into proper folder structures (components/, hooks/, lib/). Generate clean, modern React components.

${withReasoning ? `REASONING MODE: Think step-by-step before generating code.
1. First emit reasoning steps as you analyze the request
2. Then generate the final code

Emit reasoning steps in this format:
data: {"type":"reasoning_step","step":{"id":"step_1","type":"thought","content":"...","timestamp":"..."}}

After reasoning is complete, emit:
data: {"type":"reasoning_complete"}

Then generate code.` : ''}

FILE STRUCTURE REQUIREMENTS (MANDATORY - VIOLATIONS WILL BE REJECTED):
✅ REQUIRED folder structure for ALL React apps:
- App.tsx or App.jsx at root level (entry point only)
- components/ folder - ALL UI components MUST go here
- hooks/ folder - ALL custom hooks MUST go here
- lib/ or utils/ folder - helper functions (if needed)
- styles/ folder or CSS files with components

❌ FORBIDDEN - The following will cause REJECTION:
- Placing components directly at root level (except App.tsx/App.jsx)
- Mixing hooks with components in the same folder
- Creating TodoList.tsx at root instead of components/TodoList.tsx
- Flat file structures without proper folders
- Components outside the components/ folder
- Generating index.html, index.js, or package.json (handled by host)

❌ REJECTED EXAMPLE (DO NOT FOLLOW THIS):
<binaArtifact id="bad-counter" title="Counter App">
  <binaAction type="file" filePath="types.ts">
  ❌ WRONG - Flat structure without folders
  </binaAction>
  <binaAction type="file" filePath="App.tsx">
  import Counter from './Counter'; ❌ WRONG - should import from './components/Counter'
  </binaAction>
  <binaAction type="file" filePath="Counter.tsx">
  ❌ WRONG - Component should be in components/Counter.tsx
  </binaAction>
  <binaAction type="file" filePath="useCounter.ts">
  ❌ WRONG - Hook should be in hooks/useCounter.ts
  </binaAction>
</binaArtifact>

✅ CORRECT EXAMPLE (FOLLOW THIS STRUCTURE EXACTLY):
<binaArtifact id="app-${Date.now()}" title="Todo Application">
  <!-- Root entry point - ONLY file allowed at root -->
  <binaAction type="file" filePath="App.tsx">
import React from 'react';
import Header from './components/Header';
import TodoList from './components/TodoList';
import { useTodos } from './hooks/useTodos';
import './styles.css';

function App() {
  const { todos, addTodo, removeTodo } = useTodos();

  return (
    <div className="app">
      <Header />
      <TodoList todos={todos} onAdd={addTodo} onRemove={removeTodo} />
    </div>
  );
}

export default App;
  </binaAction>

  <!-- ALL components MUST be in components/ folder -->
  <binaAction type="file" filePath="components/Header.tsx">
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>My Todo App</h1>
    </header>
  );
};

export default Header;
  </binaAction>

  <binaAction type="file" filePath="components/TodoList.tsx">
import React, { useState } from 'react';

interface TodoListProps {
  todos: string[];
  onAdd: (todo: string) => void;
  onRemove: (index: number) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input);
      setInput('');
    }
  };

  return (
    <div className="todo-list">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>
            {todo}
            <button onClick={() => onRemove(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
  </binaAction>

  <!-- ALL hooks MUST be in hooks/ folder -->
  <binaAction type="file" filePath="hooks/useTodos.ts">
import { useState } from 'react';

export const useTodos = () => {
  const [todos, setTodos] = useState<string[]>([]);

  const addTodo = (todo: string) => {
    setTodos([...todos, todo]);
  };

  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return { todos, addTodo, removeTodo };
};
  </binaAction>

  <!-- Styles can be at root or in styles/ folder -->
  <!-- CRITICAL: CSS MUST be comprehensive (200+ lines). Include complete styling for all components, buttons, inputs, cards, empty states, responsive design, and animations. NO minimal CSS! -->
  <binaAction type="file" filePath="styles.css">
/* CSS Reset & Base Styles */
* {
  box-sizing: border-box;
}

body, html {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

/* Design Tokens */
:root {
  --color-primary: #007bff;
  --color-primary-hover: #0056b3;
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #ddd;
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --radius: 8px;
}

/* App Layout */
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

/* Todo List Container */
.todo-list {
  background: var(--color-bg-secondary);
  padding: 20px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}

.todo-list form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

/* Input Styles (ALL states) */
.todo-list input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.todo-list input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

/* Button Styles (ALL states) */
.todo-list button {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.todo-list button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.todo-list button:active {
  transform: translateY(0);
}

.todo-list button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* List Styles */
.todo-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  margin-bottom: 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  transition: transform 0.2s, box-shadow 0.2s;
}

.todo-list li:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
  font-size: 1.125rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app {
    padding: 10px;
  }

  .todo-list {
    padding: 15px;
  }

  .todo-list form {
    flex-direction: column;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.todo-list li {
  animation: fadeIn 0.3s ease-out;
}
  </binaAction>
</binaArtifact>

VALIDATION CHECKLIST (YOU MUST FOLLOW):
✓ Every component import uses './components/...'
✓ Every hook import uses './hooks/...'
✓ NO components at root level (only App.tsx/App.jsx allowed)
✓ ALL visual components in components/ folder
✓ ALL custom hooks in hooks/ folder
✓ Clean import paths with proper folder references

FORMAT REQUIREMENTS:
- CRITICAL: You MUST return your response wrapped in a single <binaArtifact> tag with nested <binaAction> tags
- Wrap everything in: <binaArtifact id="unique-id" title="Project Name">
- Each file must be a <binaAction type="file" filePath="path/to/file">
- Include FULL file contents (no partial edits or "rest remains same")
- Add shell commands as <binaAction type="shell">
- Close all tags properly

GENERATION GUIDELINES:
- Modern functional components with hooks
- Responsive design with modern CSS or Tailwind
- Proper state management with useState/useReducer
- Event handlers and side effects with useEffect
- Accessible components (ARIA labels, semantic HTML)
- Clean, well-structured code with PROPER FOLDER ORGANIZATION

MANDATORY RULES:
- ALWAYS use proper folder structure (components/, hooks/, etc.)
- ALWAYS include FULL file contents
- NO placeholders like "// rest of code here"
- NO markdown code blocks inside <binaAction>
- Close ALL tags properly

REMINDER: The system automatically detects App.tsx or App.jsx as the entry point and auto-enables bundling when it finds components/, hooks/, or lib/ folders. You do NOT need to specify this - just create the proper folder structure.`
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

    // Helper to strip markdown code fences from file content
    function stripMarkdownCodeFences(content: string): string {
      let cleaned = content
      // Remove opening fences: ```tsx, ```typescript, ```jsx, ```javascript, etc.
      cleaned = cleaned.replace(/^```[\w]*\n?/gm, '')
      // Remove closing fences: ```
      cleaned = cleaned.replace(/\n?```$/gm, '')
      // Handle any remaining stray fences
      cleaned = cleaned.replace(/```[\w]*\n?/g, '')
      cleaned = cleaned.replace(/```/g, '')
      return cleaned.trim()
    }

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
        // Strip any markdown code fences the AI might have added
        files[filePath] = stripMarkdownCodeFences(content)
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

      // Enhance files with Vite boilerplate (index.html, main.tsx, package.json, etc.)
      const enhancedFiles = addViteProjectFiles(parsed.files)

      const artifact = {
        id: parsed.id,
        projectId: 'default',
        regionId: 'full-page',
        files: enhancedFiles,
        entry: Object.keys(enhancedFiles).find(f => f.includes('index.html')) || Object.keys(enhancedFiles)[0],
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
