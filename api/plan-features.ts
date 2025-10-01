import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateText } from 'ai'
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
      prompt
    } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Use GPT-4 for comprehensive planning
    let model
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o') // Use GPT-4 for better planning
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-beta')
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      })
    }

    const systemPrompt = `You are an expert product manager and software architect. Analyze the user's app idea and create a comprehensive v1 feature plan.

Your task:
1. Understand the app type (SaaS, dashboard, landing page, e-commerce, blog, portfolio, tool, game, other)
2. Identify the target audience and primary goal
3. Suggest essential v1 features (prioritized by importance)
4. Recommend modern tech stack
5. Create a development timeline

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "name": "App Name (3-4 words)",
  "description": "Brief description of the app",
  "analysis": {
    "appType": "saas|dashboard|landing-page|e-commerce|blog|portfolio|tool|game|other",
    "targetAudience": "Who will use this app",
    "primaryGoal": "Main purpose of the app",
    "keyFunctionalities": ["func1", "func2", "func3"],
    "scalabilityNeeds": "low|medium|high"
  },
  "features": [
    {
      "id": "unique-id",
      "name": "Feature Name",
      "description": "What this feature does",
      "priority": "high|medium|low",
      "complexity": "simple|moderate|complex",
      "category": "core|user-management|ui-ux|data|integration",
      "estimatedHours": 4,
      "userStory": "As a user, I want..."
    }
  ],
  "techStack": {
    "frontend": ["React", "TypeScript"],
    "styling": ["Tailwind CSS"],
    "stateManagement": ["Zustand"],
    "backend": ["Supabase"],
    "database": ["PostgreSQL"],
    "authentication": ["NextAuth.js"],
    "deployment": ["Vercel"]
  },
  "timeline": [
    {
      "phase": "Phase 1: Foundation",
      "features": ["Setup", "Basic UI"],
      "estimatedDays": 3
    }
  ],
  "planMarkdown": "# Full markdown plan with all details above formatted nicely"
}

Guidelines:
- Focus on v1 MVP features only (keep it lean)
- Prioritize features by business value
- Consider development complexity realistically
- Suggest modern, production-ready tech stack
- Break down into 2-4 development phases
- Be specific and actionable`

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze this app idea and create a comprehensive v1 feature plan:\n\n${prompt}`
        }
      ],
      temperature: 0.7
    })

    // Parse the AI response
    try {
      // Remove markdown code blocks if present
      let jsonText = result.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const plan = JSON.parse(jsonText)

      // Validate the plan structure
      if (!plan.name || !plan.features || !plan.techStack) {
        throw new Error('Invalid plan structure')
      }

      return res.status(200).json({
        success: true,
        ...plan
      })
    } catch (parseError) {
      console.error('Failed to parse feature plan:', parseError)
      console.error('AI Response:', result.text)

      // Return fallback plan
      return res.status(200).json({
        success: true,
        name: extractAppName(prompt),
        description: prompt.slice(0, 200),
        analysis: {
          appType: 'tool',
          targetAudience: 'General users',
          primaryGoal: 'Provide useful functionality',
          keyFunctionalities: ['Core functionality', 'User interface', 'Data management'],
          scalabilityNeeds: 'medium'
        },
        features: [
          {
            id: 'responsive-design',
            name: 'Responsive Design',
            description: 'Mobile-first responsive layout',
            priority: 'high',
            complexity: 'simple',
            category: 'ui-ux',
            estimatedHours: 4,
            userStory: 'As a user, I want the app to work on all devices'
          },
          {
            id: 'core-functionality',
            name: 'Core Functionality',
            description: 'Main features and user workflows',
            priority: 'high',
            complexity: 'moderate',
            category: 'core',
            estimatedHours: 12,
            userStory: 'As a user, I want to accomplish my primary goals'
          }
        ],
        techStack: {
          frontend: ['React', 'TypeScript'],
          styling: ['Tailwind CSS'],
          stateManagement: ['Zustand'],
          backend: ['Serverless Functions'],
          database: ['LocalStorage'],
          authentication: ['Optional'],
          deployment: ['Vercel']
        },
        timeline: [
          {
            phase: 'Phase 1: Foundation',
            features: ['Setup', 'Basic UI', 'Core Components'],
            estimatedDays: 3
          },
          {
            phase: 'Phase 2: Core Features',
            features: ['Main Functionality', 'Data Management'],
            estimatedDays: 5
          },
          {
            phase: 'Phase 3: Polish',
            features: ['User Experience', 'Testing', 'Deployment'],
            estimatedDays: 2
          }
        ],
        planMarkdown: `# ${extractAppName(prompt)}\n\n## Overview\n${prompt}\n\n## Features\n- Responsive Design\n- Core Functionality\n\n## Tech Stack\n- React + TypeScript\n- Tailwind CSS\n- Vercel Deployment`
      })
    }
  } catch (error) {
    console.error('Feature planning error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

function extractAppName(prompt: string): string {
  const words = prompt.split(' ').slice(0, 3)
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + ' App'
}