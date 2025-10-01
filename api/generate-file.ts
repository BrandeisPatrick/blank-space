import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { FileSpecification } from './plan-project'

interface GenerateFileRequest {
  file: FileSpecification
  previousFiles: {
    path: string
    content: string
  }[]
  framework: 'react' | 'vanilla' | 'vue'
  typescript: boolean
}

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
    const { file, previousFiles = [], framework = 'react', typescript = true }: GenerateFileRequest = req.body

    if (!file) {
      return res.status(400).json({ error: 'File specification is required' })
    }

    // Reject .bina.json generation - system handles entry point detection
    if (file.path === '.bina.json') {
      return res.status(400).json({
        error: '.bina.json generation is not allowed. System auto-detects entry points from App.tsx/App.jsx.'
      })
    }

    // Select AI model
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

    // Build context from previous files
    const contextSummary = previousFiles.map(f => {
      // Extract exports from previous files for reference
      const exportMatches = f.content.match(/export\s+(default\s+)?(function|const|class|interface|type|enum)\s+(\w+)/g) || []
      const exports = exportMatches.map(exp => {
        const parts = exp.split(/\s+/)
        return parts[parts.length - 1]
      })

      return `File: ${f.path}
Exports: ${exports.join(', ') || 'none'}
---`
    }).join('\n')

    // Build detailed system prompt for file generation
    const systemPrompt = `You are an expert ${framework} developer generating a single file based on specifications.

Framework: ${framework}
TypeScript: ${typescript ? 'Yes' : 'No'}
File: ${file.path}
Category: ${file.category}

CONTEXT FROM PREVIOUS FILES:
${contextSummary || 'No previous files'}

FILE SPECIFICATION:
${JSON.stringify(file.specification, null, 2)}

IMPORT PATH RULES (CRITICAL):
- If generating a file in components/ folder (e.g., components/Header.tsx):
  - Import from hooks/ as: import { useHook } from '../hooks/useHook'
  - Import from lib/ as: import { helper } from '../lib/helper'
  - Import other components: import Other from './Other' (same folder)
  - Import types from root: import { Type } from '../types'

- If generating a file in hooks/ folder (e.g., hooks/useTodos.ts):
  - Import types from root: import { Type } from '../types'
  - Import from lib/ as: import { helper } from '../lib/helper'

- If generating App.tsx (at root):
  - Import components: import Header from './components/Header'
  - Import hooks: import { useHook } from './hooks/useHook'
  - Import types: import { Type } from './types'

GENERATION RULES:
1. Generate ONLY the file content - no explanations, no markdown code blocks
2. Follow the specification exactly
3. Use CORRECT relative import paths based on file location
4. Use modern ${framework} best practices
5. Include all specified features and methods
6. ${typescript ? 'Use proper TypeScript types' : 'Use JSDoc comments for type hints'}
7. Make the code production-ready and complete
8. NO placeholders like "// rest of code" - implement everything
9. Ensure all imports use proper relative paths

For React components:
- Use functional components with hooks
- Include proper prop types with TypeScript interfaces
- Handle all edge cases
- Add accessibility attributes
- Export as default: export default ComponentName

For React hooks:
- Follow hooks naming convention (useXxx)
- Export as named export: export const useXxx
- Return object with methods and state

For TypeScript files:
- Export all specified interfaces/types
- Use proper type annotations
- Avoid 'any' type

For CSS files (CRITICAL - Must be comprehensive, not minimal):
- Generate 200+ lines of complete, production-ready CSS
- Include ALL of the following sections (non-negotiable):

  1. CSS Reset & Base Styles:
     * { box-sizing: border-box; }
     body, html { margin: 0; padding: 0; min-height: 100vh; }
     #root { min-height: 100vh; }

  2. Design Tokens (CSS Variables):
     :root {
       --color-primary: #3b82f6;
       --color-primary-hover: #2563eb;
       --color-secondary: #8b5cf6;
       --color-bg: #ffffff;
       --color-bg-secondary: #f3f4f6;
       --color-text: #1f2937;
       --color-text-secondary: #6b7280;
       --color-border: #e5e7eb;
       --color-error: #ef4444;
       --color-success: #10b981;
       --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
       --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
       --radius: 8px;
       --spacing: 1rem;
     }

  3. Typography:
     h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 600; color: var(--color-text); }
     h1 { font-size: 2.5rem; }
     h2 { font-size: 2rem; }
     p { line-height: 1.6; color: var(--color-text-secondary); }

  4. Buttons (ALL states required):
     button {
       padding: 0.75rem 1.5rem;
       border: none;
       border-radius: var(--radius);
       font-size: 1rem;
       cursor: pointer;
       transition: all 0.2s;
       background: var(--color-primary);
       color: white;
     }
     button:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
     button:active { transform: translateY(0); }
     button:disabled { opacity: 0.5; cursor: not-allowed; }
     button:focus { outline: 2px solid var(--color-primary); outline-offset: 2px; }

  5. Inputs/Forms:
     input, textarea, select {
       padding: 0.75rem;
       border: 1px solid var(--color-border);
       border-radius: var(--radius);
       font-size: 1rem;
       width: 100%;
       transition: border-color 0.2s;
     }
     input:focus, textarea:focus { border-color: var(--color-primary); outline: none; }
     label { display: block; margin-bottom: 0.5rem; font-weight: 500; }

  6. Cards/Containers:
     .card {
       background: var(--color-bg);
       border: 1px solid var(--color-border);
       border-radius: var(--radius);
       padding: 1.5rem;
       box-shadow: var(--shadow-md);
     }

  7. Lists:
     ul, ol { padding-left: 1.5rem; }
     li { margin-bottom: 0.5rem; }

  8. Empty States (MUST style these):
     .empty-state {
       text-align: center;
       padding: 3rem 1rem;
       color: var(--color-text-secondary);
       font-size: 1.125rem;
     }

  9. Responsive Design (required breakpoints):
     @media (max-width: 768px) { /* mobile styles */ }
     @media (min-width: 769px) and (max-width: 1024px) { /* tablet */ }
     @media (min-width: 1025px) { /* desktop */ }

  10. Animations & Transitions:
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .fade-in { animation: fadeIn 0.3s; }

  11. Component-Specific Styles:
      Style EVERY component mentioned in the app with proper classes

- Generate complete, production-ready CSS (200+ lines minimum)
- NO placeholders or comments like "/* add more styles */"
- Include ALL interactive states (hover, focus, active, disabled)
- Use modern CSS features (flexbox, grid, CSS variables, transitions)
- Ensure accessibility (focus outlines, contrast ratios)
- Make it visually appealing with proper colors, spacing, shadows

IMPORTANT: Output ONLY the file content, nothing else. Ensure import paths are relative and correct.`

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
          content: `Generate the complete content for ${file.path}:

Description: ${file.description}
Purpose: ${file.specification.purpose}
Dependencies: ${file.dependencies.join(', ') || 'none'}

Follow the specification exactly and create production-ready code.`
        }
      ],
      temperature: 0.5 // Lower temperature for more consistent code
    })

    // Helper to strip markdown code fences
    const stripMarkdownCodeFences = (content: string): string => {
      // Remove opening fence: ```typescript, ```tsx, ```javascript, ```jsx, ```css, etc.
      content = content.replace(/^```(?:typescript|tsx|javascript|jsx|js|ts|css|html|json)?\s*\n/gm, '')
      // Remove closing fence: ```
      content = content.replace(/\n```\s*$/gm, '')
      // Also handle cases where fence appears mid-content
      content = content.replace(/```(?:typescript|tsx|javascript|jsx|js|ts|css|html|json)?\s*\n/g, '')
      content = content.replace(/\n```/g, '')
      return content.trim()
    }

    // Stream the file content
    let fullContent = ''

    for await (const chunk of result.textStream) {
      fullContent += chunk

      // Send chunk to client
      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: chunk
      })}\n\n`)
    }

    // Strip markdown code fences before sending final content
    const cleanContent = stripMarkdownCodeFences(fullContent)

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      file: file.path,
      content: cleanContent
    })}\n\n`)

    res.end()

  } catch (error) {
    console.error('File generation error:', error)

    // Check if headers were already sent (streaming started)
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }

    // If streaming already started, send error as SSE
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })}\n\n`)
    res.end()
  }
}