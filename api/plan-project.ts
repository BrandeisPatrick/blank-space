import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'

export interface FileSpecification {
  path: string
  description: string
  specification: {
    imports?: string[]
    exports?: string[]
    props?: string
    state?: string[]
    methods?: string[]
    features?: string[]
    components?: string[]
    hooks?: string[]
    types?: string[]
    styling?: string
    purpose: string
  }
  dependencies: string[] // Files this file depends on
  category: 'component' | 'hook' | 'type' | 'style' | 'config' | 'utility'
}

export interface ProjectPlan {
  name: string
  description: string
  framework: 'react' | 'vanilla' | 'vue'
  typescript: boolean
  files: FileSpecification[]
  features: string[]
  structure: {
    hasComponents: boolean
    hasHooks: boolean
    hasTypes: boolean
    hasUtils: boolean
  }
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
    const { prompt, framework = 'react' } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Use GPT-4 for comprehensive planning
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

    const systemPrompt = `You are an expert software architect planning a ${framework} application.
Your task is to create a detailed project structure with file specifications.

MANDATORY FOLDER STRUCTURE:
- App.tsx or App.jsx at root level (entry point only)
- components/ folder - ALL UI components MUST go here
- hooks/ folder - ALL custom hooks MUST go here
- lib/ or utils/ folder - helper functions (if needed)
- styles.css or styles/ folder - styling

IMPORTANT:
- ALWAYS organize code into proper folders (components/, hooks/, lib/)
- Each component gets its own file in components/
- Each custom hook gets its own file in hooks/
- Create 5-10 files for a proper React application structure

Analyze the user's request and generate a comprehensive project plan with proper folder organization.

Return ONLY valid JSON in this exact format:
{
  "name": "Project Name",
  "description": "Brief description",
  "framework": "${framework}",
  "typescript": true,
  "features": ["feature1", "feature2"],
  "structure": {
    "hasComponents": true,
    "hasHooks": true,
    "hasTypes": true,
    "hasUtils": false
  },
  "files": [
    {
      "path": "types.ts",
      "description": "TypeScript type definitions",
      "category": "type",
      "dependencies": [],
      "specification": {
        "purpose": "Define all TypeScript interfaces and types",
        "exports": [
          "export interface Todo { id: string; text: string; completed: boolean; createdAt: number; }",
          "export type FilterType = 'all' | 'active' | 'completed'"
        ]
      }
    },
    {
      "path": "App.tsx",
      "description": "Main application entry point",
      "category": "component",
      "dependencies": ["types.ts", "components/TodoList.tsx", "hooks/useTodos.ts"],
      "specification": {
        "purpose": "Root component that composes the application",
        "imports": [
          "import React from 'react'",
          "import TodoList from './components/TodoList'",
          "import Header from './components/Header'",
          "import { useTodos } from './hooks/useTodos'",
          "import './styles.css'"
        ],
        "features": [
          "Compose child components",
          "Pass data from hooks to components",
          "Handle top-level state"
        ]
      }
    },
    {
      "path": "components/Header.tsx",
      "description": "Header component",
      "category": "component",
      "dependencies": [],
      "specification": {
        "purpose": "Display application header",
        "exports": ["export default Header"]
      }
    },
    {
      "path": "components/TodoList.tsx",
      "description": "Todo list component",
      "category": "component",
      "dependencies": ["types.ts"],
      "specification": {
        "purpose": "Display and manage todo items",
        "props": "{ todos: Todo[]; onToggle: (id: string) => void; onDelete: (id: string) => void; }",
        "exports": ["export default TodoList"]
      }
    },
    {
      "path": "hooks/useTodos.ts",
      "description": "Custom hook for todo management",
      "category": "hook",
      "dependencies": ["types.ts"],
      "specification": {
        "purpose": "Manage todo state and localStorage persistence",
        "exports": ["export const useTodos"],
        "features": [
          "useState for todos",
          "useEffect for localStorage sync",
          "addTodo, toggleTodo, deleteTodo methods"
        ]
      }
    },
    {
      "path": "styles.css",
      "description": "Application styles",
      "category": "style",
      "dependencies": [],
      "specification": {
        "purpose": "Modern, clean styling",
        "features": [
          "Responsive design",
          "CSS animations",
          "Component-specific styles"
        ]
      }
    }
  ]
}

Guidelines:
- Create 5-10 files for proper React architecture
- ALWAYS use folder structure (components/, hooks/, lib/)
- Each component in its own file in components/
- Each custom hook in its own file in hooks/
- List dependencies to ensure correct generation order
- Be specific about props, state, and methods`

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Create a detailed project plan for: ${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 4000
    })

    try {
      // Parse the JSON response
      let jsonText = result.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const plan: ProjectPlan = JSON.parse(jsonText)

      // Validate folder structure - ensure files are in proper folders
      const hasProperStructure = plan.files.some(f =>
        f.path.startsWith('components/') ||
        f.path.startsWith('hooks/') ||
        f.path.startsWith('lib/') ||
        f.path.startsWith('utils/')
      )

      if (!hasProperStructure) {
        console.warn('Warning: Plan does not include folder structure. AI may have ignored instructions.')
      }

      // Remove .bina.json if AI generated it
      plan.files = plan.files.filter(f => f.path !== '.bina.json')

      // Sort files by dependencies (files with no dependencies first)
      plan.files.sort((a, b) => {
        if (a.dependencies.length === 0 && b.dependencies.length > 0) return -1
        if (a.dependencies.length > 0 && b.dependencies.length === 0) return 1
        return a.dependencies.length - b.dependencies.length
      })

      return res.status(200).json({
        success: true,
        plan
      })

    } catch (parseError) {
      console.error('Failed to parse project plan:', parseError)
      console.error('AI Response:', result.text.slice(0, 500))

      // Return a simple fallback plan
      const fallbackPlan: ProjectPlan = {
        name: 'React App',
        description: prompt,
        framework: 'react',
        typescript: true,
        features: ['Basic functionality'],
        structure: {
          hasComponents: true,
          hasHooks: false,
          hasTypes: true,
          hasUtils: false
        },
        files: [
          {
            path: 'App.tsx',
            description: 'Main application component',
            category: 'component',
            dependencies: [],
            specification: {
              purpose: 'Main app component',
              imports: ["import React from 'react'"],
              features: ['Basic UI']
            }
          },
          {
            path: 'styles.css',
            description: 'Application styles',
            category: 'style',
            dependencies: [],
            specification: {
              purpose: 'Styling',
              features: ['Basic CSS']
            }
          }
        ]
      }

      return res.status(200).json({
        success: true,
        plan: fallbackPlan
      })
    }

  } catch (error) {
    console.error('Project planning error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}