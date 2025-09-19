/**
 * Feature Planning Service - Uses ChatGPT to analyze app requirements and suggest v1 features
 */

export interface Feature {
  id: string
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  complexity: 'simple' | 'moderate' | 'complex'
  category: 'core' | 'user-management' | 'ui-ux' | 'data' | 'integration'
  estimatedHours?: number
  dependencies?: string[]
  userStory?: string
}

export interface TechStackSuggestion {
  frontend: string[]
  styling: string[]
  stateManagement: string[]
  backend?: string[]
  database?: string[]
  authentication?: string[]
  deployment?: string[]
}

export interface AppAnalysis {
  appType: 'saas' | 'dashboard' | 'landing-page' | 'e-commerce' | 'blog' | 'portfolio' | 'tool' | 'game' | 'other'
  targetAudience: string
  primaryGoal: string
  keyFunctionalities: string[]
  businessModel?: string
  scalabilityNeeds: 'low' | 'medium' | 'high'
}

export interface ProjectPlan {
  id: string
  name: string
  description: string
  analysis: AppAnalysis
  features: Feature[]
  techStack: TechStackSuggestion
  timeline: {
    phase: string
    features: string[]
    estimatedDays: number
  }[]
  wireframes?: {
    page: string
    components: string[]
    layout: string
  }[]
  planMarkdown: string
  createdAt: number
}

export class FeaturePlanningService {
  private readonly baseUrl: string

  constructor() {
    // Use relative paths for Vercel deployment
    this.baseUrl = ''
  }

  /**
   * Analyze user requirements and suggest comprehensive v1 features
   */
  async analyzeAndPlanFeatures(userPrompt: string): Promise<ProjectPlan> {
    try {
      const response = await fetch(`${this.baseUrl}/api/plan-features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          includeAnalysis: true,
          includeFeatures: true,
          includeTechStack: true,
          includeTimeline: true
        })
      })

      if (!response.ok) {
        throw new Error(`Feature planning failed: ${response.status}`)
      }

      const result = await response.json()

      return {
        id: `plan_${Date.now()}`,
        name: result.name || this.extractAppName(userPrompt),
        description: result.description || userPrompt,
        analysis: result.analysis || this.createFallbackAnalysis(userPrompt),
        features: result.features || this.createFallbackFeatures(),
        techStack: result.techStack || this.createFallbackTechStack(),
        timeline: result.timeline || this.createFallbackTimeline(),
        wireframes: result.wireframes || [],
        planMarkdown: result.planMarkdown || this.generatePlanMarkdown(result),
        createdAt: Date.now()
      }

    } catch (error) {
      console.error('Feature planning API failed, using fallback:', error)
      return this.createFallbackPlan(userPrompt)
    }
  }

  /**
   * Quick feature suggestions without full analysis
   */
  async suggestQuickFeatures(appType: string, prompt: string): Promise<Feature[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/suggest-features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appType,
          prompt,
          maxFeatures: 8
        })
      })

      if (!response.ok) {
        throw new Error(`Quick feature suggestion failed: ${response.status}`)
      }

      const result = await response.json()
      return result.features || this.getDefaultFeatures(appType)

    } catch (error) {
      console.error('Quick feature suggestion failed:', error)
      return this.getDefaultFeatures(appType)
    }
  }

  /**
   * Get modern UI framework recommendations based on app type
   */
  getTechStackForAppType(appType: AppAnalysis['appType']): TechStackSuggestion {
    const techStacks: Record<string, TechStackSuggestion> = {
      'saas': {
        frontend: ['React', 'Next.js', 'TypeScript'],
        styling: ['Tailwind CSS', 'shadcn/ui', 'Lucide Icons'],
        stateManagement: ['Zustand', 'React Query'],
        backend: ['Supabase', 'Stripe'],
        database: ['PostgreSQL'],
        authentication: ['NextAuth.js', 'Supabase Auth'],
        deployment: ['Vercel', 'Railway']
      },
      'dashboard': {
        frontend: ['React', 'TypeScript'],
        styling: ['Ant Design', 'Chart.js', 'Recharts'],
        stateManagement: ['Redux Toolkit', 'React Query'],
        backend: ['Node.js', 'Express'],
        database: ['PostgreSQL', 'Redis'],
        authentication: ['Auth0', 'JWT'],
        deployment: ['Vercel', 'AWS']
      },
      'landing-page': {
        frontend: ['React', 'Next.js'],
        styling: ['Tailwind CSS', 'Framer Motion', 'Hero Icons'],
        stateManagement: ['useState', 'useContext'],
        backend: ['Serverless Functions'],
        database: ['Not Required'],
        authentication: ['Not Required'],
        deployment: ['Vercel', 'Netlify']
      },
      'e-commerce': {
        frontend: ['Next.js', 'TypeScript'],
        styling: ['Tailwind CSS', 'Headless UI'],
        stateManagement: ['Zustand', 'React Query'],
        backend: ['Shopify API', 'Stripe'],
        database: ['PostgreSQL'],
        authentication: ['NextAuth.js'],
        deployment: ['Vercel', 'Shopify']
      },
      'blog': {
        frontend: ['Next.js', 'TypeScript'],
        styling: ['Tailwind CSS', 'MDX'],
        stateManagement: ['Static Generation'],
        backend: ['Contentful', 'Sanity'],
        database: ['Headless CMS'],
        authentication: ['Optional'],
        deployment: ['Vercel', 'Netlify']
      },
      'portfolio': {
        frontend: ['React', 'Next.js'],
        styling: ['Tailwind CSS', 'Framer Motion'],
        stateManagement: ['useState'],
        backend: ['Static'],
        database: ['Not Required'],
        authentication: ['Not Required'],
        deployment: ['Vercel', 'GitHub Pages']
      },
      'tool': {
        frontend: ['React', 'TypeScript'],
        styling: ['Tailwind CSS', 'Radix UI'],
        stateManagement: ['Zustand'],
        backend: ['Optional API'],
        database: ['LocalStorage', 'IndexedDB'],
        authentication: ['Optional'],
        deployment: ['Vercel', 'Netlify']
      }
    }

    return techStacks[appType] || techStacks['tool']
  }

  /**
   * Generate plan.md content from project plan
   */
  generatePlanMarkdown(plan: Partial<ProjectPlan>): string {
    const features = plan.features || []
    const techStack = plan.techStack || this.createFallbackTechStack()
    const timeline = plan.timeline || []

    return `# ${plan.name || 'Web Application'} - Project Plan

## Overview
${plan.description || 'A modern web application built with React and contemporary development practices.'}

## App Analysis
- **Type**: ${plan.analysis?.appType || 'tool'}
- **Target Audience**: ${plan.analysis?.targetAudience || 'General users'}
- **Primary Goal**: ${plan.analysis?.primaryGoal || 'Provide useful functionality'}

## V1 Features

### Core Features
${features.filter(f => f.category === 'core').map(f => `- **${f.name}**: ${f.description}`).join('\n')}

### User Management
${features.filter(f => f.category === 'user-management').map(f => `- **${f.name}**: ${f.description}`).join('\n')}

### UI/UX Features
${features.filter(f => f.category === 'ui-ux').map(f => `- **${f.name}**: ${f.description}`).join('\n')}

### Data Management
${features.filter(f => f.category === 'data').map(f => `- **${f.name}**: ${f.description}`).join('\n')}

## Technical Stack

### Frontend
${techStack.frontend?.map(tech => `- ${tech}`).join('\n')}

### Styling & UI
${techStack.styling?.map(tech => `- ${tech}`).join('\n')}

### State Management
${techStack.stateManagement?.map(tech => `- ${tech}`).join('\n')}

${techStack.backend?.length ? `### Backend\n${techStack.backend.map(tech => `- ${tech}`).join('\n')}` : ''}

## Development Timeline
${timeline.map(phase => `
### ${phase.phase}
- **Features**: ${phase.features.join(', ')}
- **Estimated Time**: ${phase.estimatedDays} days
`).join('\n')}

## Success Metrics
- User engagement and retention
- Feature adoption rates
- Performance benchmarks
- Accessibility compliance

---
*Generated by Blank Space Feature Planning*
`
  }

  // Fallback methods for when API fails
  private createFallbackPlan(userPrompt: string): ProjectPlan {
    const appType = this.detectAppType(userPrompt)
    const features = this.getDefaultFeatures(appType)
    const techStack = this.getTechStackForAppType(appType)

    const plan: ProjectPlan = {
      id: `fallback_plan_${Date.now()}`,
      name: this.extractAppName(userPrompt),
      description: userPrompt,
      analysis: this.createFallbackAnalysis(userPrompt),
      features,
      techStack,
      timeline: this.createFallbackTimeline(),
      planMarkdown: '',
      createdAt: Date.now()
    }

    plan.planMarkdown = this.generatePlanMarkdown(plan)
    return plan
  }

  private createFallbackAnalysis(prompt: string): AppAnalysis {
    return {
      appType: this.detectAppType(prompt),
      targetAudience: 'General users',
      primaryGoal: 'Provide useful functionality to users',
      keyFunctionalities: this.extractFunctionalities(prompt),
      scalabilityNeeds: 'medium'
    }
  }

  private detectAppType(prompt: string): AppAnalysis['appType'] {
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin') || lowerPrompt.includes('analytics')) {
      return 'dashboard'
    }
    if (lowerPrompt.includes('landing') || lowerPrompt.includes('marketing') || lowerPrompt.includes('homepage')) {
      return 'landing-page'
    }
    if (lowerPrompt.includes('shop') || lowerPrompt.includes('store') || lowerPrompt.includes('ecommerce') || lowerPrompt.includes('buy')) {
      return 'e-commerce'
    }
    if (lowerPrompt.includes('blog') || lowerPrompt.includes('article') || lowerPrompt.includes('news')) {
      return 'blog'
    }
    if (lowerPrompt.includes('portfolio') || lowerPrompt.includes('showcase') || lowerPrompt.includes('personal')) {
      return 'portfolio'
    }
    if (lowerPrompt.includes('saas') || lowerPrompt.includes('subscription') || lowerPrompt.includes('service')) {
      return 'saas'
    }
    if (lowerPrompt.includes('game') || lowerPrompt.includes('play')) {
      return 'game'
    }

    return 'tool'
  }

  private extractAppName(prompt: string): string {
    // Simple extraction - could be enhanced with NLP
    const words = prompt.split(' ').slice(0, 3)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' App'
  }

  private extractFunctionalities(prompt: string): string[] {
    const functionalities: string[] = []
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes('user') || lowerPrompt.includes('login') || lowerPrompt.includes('account')) {
      functionalities.push('User authentication and management')
    }
    if (lowerPrompt.includes('data') || lowerPrompt.includes('save') || lowerPrompt.includes('store')) {
      functionalities.push('Data storage and retrieval')
    }
    if (lowerPrompt.includes('search') || lowerPrompt.includes('find') || lowerPrompt.includes('filter')) {
      functionalities.push('Search and filtering capabilities')
    }
    if (lowerPrompt.includes('mobile') || lowerPrompt.includes('responsive')) {
      functionalities.push('Mobile-responsive design')
    }

    return functionalities.length > 0 ? functionalities : ['Core functionality', 'User interface', 'Data management']
  }

  private getDefaultFeatures(appType: string): Feature[] {
    const commonFeatures: Feature[] = [
      {
        id: 'responsive-design',
        name: 'Responsive Design',
        description: 'Mobile-first responsive layout that works on all devices',
        priority: 'high',
        complexity: 'simple',
        category: 'ui-ux',
        estimatedHours: 4,
        userStory: 'As a user, I want the app to work seamlessly on my phone, tablet, and desktop'
      },
      {
        id: 'dark-mode',
        name: 'Dark Mode Toggle',
        description: 'Switch between light and dark themes',
        priority: 'medium',
        complexity: 'simple',
        category: 'ui-ux',
        estimatedHours: 2,
        userStory: 'As a user, I want to choose between light and dark themes for better visual comfort'
      },
      {
        id: 'loading-states',
        name: 'Loading States',
        description: 'Smooth loading animations and skeleton screens',
        priority: 'medium',
        complexity: 'simple',
        category: 'ui-ux',
        estimatedHours: 3,
        userStory: 'As a user, I want to see loading feedback when data is being fetched'
      }
    ]

    const typeSpecificFeatures: Record<string, Feature[]> = {
      'saas': [
        {
          id: 'user-auth',
          name: 'User Authentication',
          description: 'Sign up, login, logout, and password reset functionality',
          priority: 'high',
          complexity: 'moderate',
          category: 'user-management',
          estimatedHours: 8,
          userStory: 'As a user, I want to create an account and securely access my data'
        },
        {
          id: 'user-dashboard',
          name: 'User Dashboard',
          description: 'Personalized dashboard with key metrics and quick actions',
          priority: 'high',
          complexity: 'moderate',
          category: 'core',
          estimatedHours: 12,
          userStory: 'As a user, I want a central place to see my key information and perform common tasks'
        }
      ],
      'dashboard': [
        {
          id: 'data-visualization',
          name: 'Data Visualization',
          description: 'Interactive charts and graphs for data analysis',
          priority: 'high',
          complexity: 'complex',
          category: 'core',
          estimatedHours: 16,
          userStory: 'As a user, I want to visualize my data in charts and graphs for better insights'
        },
        {
          id: 'real-time-updates',
          name: 'Real-time Updates',
          description: 'Live data updates without page refresh',
          priority: 'medium',
          complexity: 'complex',
          category: 'core',
          estimatedHours: 12,
          userStory: 'As a user, I want to see live data updates without manually refreshing'
        }
      ],
      'tool': [
        {
          id: 'core-functionality',
          name: 'Core Tool Functionality',
          description: 'Main tool features and processing capabilities',
          priority: 'high',
          complexity: 'moderate',
          category: 'core',
          estimatedHours: 10,
          userStory: 'As a user, I want the tool to perform its primary function efficiently'
        },
        {
          id: 'data-import-export',
          name: 'Data Import/Export',
          description: 'Import data from files and export results',
          priority: 'medium',
          complexity: 'moderate',
          category: 'data',
          estimatedHours: 6,
          userStory: 'As a user, I want to import my data and export the results'
        }
      ]
    }

    return [...commonFeatures, ...(typeSpecificFeatures[appType] || typeSpecificFeatures['tool'])]
  }

  private createFallbackFeatures(): Feature[] {
    return this.getDefaultFeatures('tool')
  }

  private createFallbackTechStack(): TechStackSuggestion {
    return {
      frontend: ['React', 'TypeScript'],
      styling: ['Tailwind CSS', 'Lucide Icons'],
      stateManagement: ['Zustand', 'React Query'],
      backend: ['Serverless Functions'],
      database: ['LocalStorage'],
      authentication: ['NextAuth.js'],
      deployment: ['Vercel']
    }
  }

  private createFallbackTimeline() {
    return [
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
        phase: 'Phase 3: Enhancement',
        features: ['User Experience', 'Polish', 'Testing'],
        estimatedDays: 2
      }
    ]
  }
}

// Singleton instance
export const featurePlanningService = new FeaturePlanningService()
