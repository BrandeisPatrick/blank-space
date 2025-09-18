import { VercelRequest, VercelResponse } from '@vercel/node'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

// Define schemas for structured output
const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  category: z.enum(['core', 'user-management', 'ui-ux', 'data', 'integration']),
  estimatedHours: z.number().optional(),
  userStory: z.string().optional()
})

const AppAnalysisSchema = z.object({
  appType: z.enum(['saas', 'dashboard', 'landing-page', 'e-commerce', 'blog', 'portfolio', 'tool', 'game', 'other']),
  targetAudience: z.string(),
  primaryGoal: z.string(),
  keyFunctionalities: z.array(z.string()),
  businessModel: z.string().optional(),
  scalabilityNeeds: z.enum(['low', 'medium', 'high'])
})

const TechStackSchema = z.object({
  frontend: z.array(z.string()),
  styling: z.array(z.string()),
  stateManagement: z.array(z.string()),
  backend: z.array(z.string()).optional(),
  database: z.array(z.string()).optional(),
  authentication: z.array(z.string()).optional(),
  deployment: z.array(z.string()).optional()
})

const TimelinePhaseSchema = z.object({
  phase: z.string(),
  features: z.array(z.string()),
  estimatedDays: z.number()
})

const ProjectPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  analysis: AppAnalysisSchema,
  features: z.array(FeatureSchema),
  techStack: TechStackSchema,
  timeline: z.array(TimelinePhaseSchema),
  planMarkdown: z.string().optional()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' })
    }

    // Use OpenAI to generate structured project plan
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ProjectPlanSchema,
      prompt: `
You are an expert product manager and software architect. Analyze the following user request and create a comprehensive v1 project plan for a modern web application.

User Request: "${prompt}"

Generate a complete project plan including:

1. **App Analysis**: Determine the app type, target audience, and primary goals
2. **V1 Features**: List 6-12 essential features for a minimum viable product, categorized by:
   - core: Main functionality
   - user-management: Authentication, profiles, etc.
   - ui-ux: Interface and experience features
   - data: Storage, CRUD operations, etc.
   - integration: Third-party services, APIs, etc.

3. **Modern Tech Stack**: Select contemporary, production-ready technologies:
   - For SaaS apps: React, Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase
   - For dashboards: React, TypeScript, Ant Design or Material-UI, Chart.js, PostgreSQL
   - For landing pages: Next.js, Tailwind CSS, Framer Motion, Vercel
   - For e-commerce: Next.js, TypeScript, Tailwind CSS, Stripe, Shopify
   - For tools: React, TypeScript, Tailwind CSS, Zustand, LocalStorage

4. **Development Timeline**: Break into 2-4 phases with realistic time estimates

**Important Requirements:**
- Every app MUST include: responsive design, loading states, error handling, accessibility
- Use modern UI frameworks (Tailwind CSS + component library)
- Include proper state management
- Consider user authentication if relevant
- Prioritize features by user value
- Estimate development time realistically
- Write clear user stories

Make the app production-ready with modern UX patterns, not just a basic prototype.
      `,
      temperature: 0.7,
    })

    // Generate plan.md content
    const planMarkdown = generatePlanMarkdown(result.object)

    const response = {
      ...result.object,
      planMarkdown
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Feature planning error:', error)

    // Provide fallback response
    const fallbackPlan = {
      name: extractAppName(req.body.prompt || ''),
      description: req.body.prompt || 'A modern web application',
      analysis: {
        appType: 'tool' as const,
        targetAudience: 'General users',
        primaryGoal: 'Provide useful functionality',
        keyFunctionalities: ['Core functionality', 'User interface'],
        scalabilityNeeds: 'medium' as const
      },
      features: getDefaultFeatures(),
      techStack: {
        frontend: ['React', 'TypeScript'],
        styling: ['Tailwind CSS', 'Lucide Icons'],
        stateManagement: ['Zustand']
      },
      timeline: [
        {
          phase: 'Phase 1: Foundation',
          features: ['Setup', 'Basic UI'],
          estimatedDays: 3
        },
        {
          phase: 'Phase 2: Core Features',
          features: ['Main functionality'],
          estimatedDays: 5
        }
      ]
    }

    fallbackPlan.planMarkdown = generatePlanMarkdown(fallbackPlan)

    res.status(200).json(fallbackPlan)
  }
}

function generatePlanMarkdown(plan: any): string {
  return `# ${plan.name} - Project Plan

## Overview
${plan.description}

## App Analysis
- **Type**: ${plan.analysis.appType}
- **Target Audience**: ${plan.analysis.targetAudience}
- **Primary Goal**: ${plan.analysis.primaryGoal}

## V1 Features

### Core Features
${plan.features.filter((f: any) => f.category === 'core').map((f: any) => `- **${f.name}**: ${f.description}`).join('\n')}

### User Management
${plan.features.filter((f: any) => f.category === 'user-management').map((f: any) => `- **${f.name}**: ${f.description}`).join('\n')}

### UI/UX Features
${plan.features.filter((f: any) => f.category === 'ui-ux').map((f: any) => `- **${f.name}**: ${f.description}`).join('\n')}

### Data Management
${plan.features.filter((f: any) => f.category === 'data').map((f: any) => `- **${f.name}**: ${f.description}`).join('\n')}

## Technical Stack

### Frontend
${plan.techStack.frontend?.map((tech: string) => `- ${tech}`).join('\n')}

### Styling & UI
${plan.techStack.styling?.map((tech: string) => `- ${tech}`).join('\n')}

### State Management
${plan.techStack.stateManagement?.map((tech: string) => `- ${tech}`).join('\n')}

## Development Timeline
${plan.timeline.map((phase: any) => `
### ${phase.phase}
- **Features**: ${phase.features.join(', ')}
- **Estimated Time**: ${phase.estimatedDays} days
`).join('\n')}

---
*Generated by Blank Space Feature Planning*
`
}

function extractAppName(prompt: string): string {
  const words = prompt.split(' ').slice(0, 3)
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' App'
}

function getDefaultFeatures() {
  return [
    {
      id: 'responsive-design',
      name: 'Responsive Design',
      description: 'Mobile-first responsive layout that works on all devices',
      priority: 'high' as const,
      complexity: 'simple' as const,
      category: 'ui-ux' as const,
      estimatedHours: 4,
      userStory: 'As a user, I want the app to work seamlessly on my phone, tablet, and desktop'
    },
    {
      id: 'core-functionality',
      name: 'Core Functionality',
      description: 'Main application features and user interactions',
      priority: 'high' as const,
      complexity: 'moderate' as const,
      category: 'core' as const,
      estimatedHours: 12,
      userStory: 'As a user, I want to access the main features of the application'
    },
    {
      id: 'modern-ui',
      name: 'Modern UI Components',
      description: 'Clean, accessible UI components with consistent styling',
      priority: 'high' as const,
      complexity: 'moderate' as const,
      category: 'ui-ux' as const,
      estimatedHours: 8,
      userStory: 'As a user, I want an intuitive and visually appealing interface'
    }
  ]
}