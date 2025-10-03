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

IMPORTANT CONSTRAINTS:
- Generate a MAXIMUM of 3 files (App.tsx/jsx, styles.css, types.ts)
- NO subdirectories (no components/, hooks/, utils/ folders)
- Keep ALL code in a single App file
- Inline helper functions and components within the main App component
- Use local functions instead of separate component files

Analyze the user's request and generate a comprehensive project plan.

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
      "description": "TypeScript type definitions (OPTIONAL - only if truly needed)",
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
      "description": "Main application component with ALL logic inline",
      "category": "component",
      "dependencies": ["types.ts"],
      "specification": {
        "purpose": "Complete todo app in a single file",
        "imports": [
          "import React, { useState, useEffect } from 'react'",
          "import { Todo, FilterType } from './types'",
          "import './styles.css'"
        ],
        "state": [
          "const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('todos') || '[]'))",
          "const [filter, setFilter] = useState<FilterType>('all')",
          "const [inputText, setInputText] = useState('')"
        ],
        "methods": [
          "addTodo - inline function",
          "toggleTodo - inline function",
          "deleteTodo - inline function",
          "getFilteredTodos - inline function"
        ],
        "components": [
          "Define TodoItem as LOCAL function component inside App",
          "Header with title",
          "Input form",
          "Filter buttons",
          "TodoItem list (using local function)",
          "Empty state"
        ],
        "features": [
          "useEffect to persist todos to localStorage",
          "All helper functions defined inside App component",
          "NO imports from other components - everything inline"
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
          "Button hover effects",
          "Input styling"
        ]
      }
    }
  ]
}

Guidelines:
- MAXIMUM 3 files TOTAL
- NO subdirectories (all files in root)
- Keep ALL logic in App.tsx - use local functions for "components"
- Only create types.ts if TypeScript types are complex
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
      temperature: 0.7
    })

    try {
      // Parse the JSON response
      let jsonText = result.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const plan: ProjectPlan = JSON.parse(jsonText)

      // Enforce constraints: max 3 files, no folders
      if (plan.files.length > 3) {
        plan.files = plan.files.slice(0, 3)
      }

      // Remove any files with folder paths
      plan.files = plan.files.filter(f => !f.path.includes('/'))

      // Add .bina.json manifest as first file
      plan.files.unshift({
        path: '.bina.json',
        description: 'Bina project manifest',
        category: 'config',
        dependencies: [],
        specification: {
          purpose: 'Configure preview mode and project metadata',
          exports: []
        }
      })

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