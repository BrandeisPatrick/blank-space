import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
} from '../types';

// Input/Output schemas
const FrameworkAdvisorInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  requirements: z.object({
    projectType: z.enum(['landing-page', 'web-app', 'dashboard', 'e-commerce', 'blog', 'portfolio', 'api']).optional(),
    complexity: z.enum(['simple', 'medium', 'complex']).optional(),
    timeline: z.enum(['urgent', 'normal', 'flexible']).optional(),
    team: z.object({
      experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
    }).optional(),
    performance: z.object({
      priority: z.enum(['low', 'medium', 'high']).optional(),
      seo: z.boolean().optional(),
      ssr: z.boolean().optional(),
    }).optional(),
    features: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  }).optional(),
  maxAlternatives: z.number().min(1).max(10).default(3),
});

const FrameworkRecommendationSchema = z.object({
  framework: z.object({
    name: z.string(),
    id: z.string(),
    category: z.string(),
    type: z.string(),
    description: z.string(),
  }),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
});

const FrameworkAdvisorOutputSchema = z.object({
  primary: FrameworkRecommendationSchema,
  alternatives: z.array(FrameworkRecommendationSchema),
  summary: z.string(),
  nextSteps: z.array(z.string()),
  considerations: z.array(z.string()),
  aiReasoning: z.string().optional(),
});

export type FrameworkAdvisorInput = z.infer<typeof FrameworkAdvisorInputSchema>;
export type FrameworkAdvisorOutput = z.infer<typeof FrameworkAdvisorOutputSchema>;

export class FrameworkAdvisorAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'framework-advisor',
      name: 'Framework Advisor Agent',
      description: 'AI-powered framework recommendation system with deep analysis and reasoning',
      version: '1.0.0',
      enabled: true,
      priority: 12,
      timeout: 45000, // 45 seconds
      retries: 3,
      dependencies: [],
      capabilities: [
        'framework-analysis',
        'project-requirements-analysis',
        'technology-recommendation',
        'architectural-guidance',
        'comparative-analysis'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<FrameworkAdvisorOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Generate framework recommendation
      const result = await this.generateFrameworkRecommendation(validatedInput, context);
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      FrameworkAdvisorInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return FrameworkAdvisorInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return FrameworkAdvisorOutputSchema;
  }

  private async generateFrameworkRecommendation(
    input: FrameworkAdvisorInput,
    context?: AgentContext
  ): Promise<FrameworkAdvisorOutput> {
    const systemPrompt = this.createFrameworkAdvisorPrompt(input, context);
    
    // Use JSON generation for structured output
    const result = await this.generateJSON(
      systemPrompt,
      FrameworkAdvisorOutputSchema,
      {
        temperature: 0.4, // Balanced for consistency and creativity
        maxTokens: 3000,
      },
      context
    );

    return result;
  }

  private createFrameworkAdvisorPrompt(
    input: FrameworkAdvisorInput,
    context?: AgentContext
  ): string {
    const { prompt, requirements, maxAlternatives } = input;
    
    const basePrompt = `You are a senior software architect and framework expert with 15+ years of experience. Analyze project requirements and provide comprehensive framework recommendations.

Available frameworks and their key characteristics:

**Frontend Frameworks:**
- React: Component-based, virtual DOM, large ecosystem, JSX syntax
- Vue.js: Progressive framework, template-based, easy learning curve, reactive data
- Angular: Full framework, TypeScript-first, enterprise-ready, steep learning curve
- Svelte: Compile-time optimization, no virtual DOM, excellent performance
- Next.js: React-based, SSR/SSG, full-stack capabilities, excellent DX

**Backend Frameworks:**
- Node.js/Express: JavaScript, fast development, large ecosystem
- Django: Python, batteries-included, admin interface, secure by default
- Ruby on Rails: Convention over configuration, rapid development
- Spring Boot: Java, enterprise-grade, microservices-ready
- FastAPI: Python, modern, automatic API docs, high performance

**Criteria for evaluation:**
1. Learning curve vs team experience
2. Development speed vs long-term maintainability  
3. Performance requirements vs development complexity
4. Ecosystem maturity vs innovation
5. Community support vs specific feature needs
6. Scalability requirements vs initial complexity

**Analysis Process:**
1. Parse project requirements from the user prompt
2. Identify explicit and implicit technology preferences
3. Evaluate each relevant framework against the criteria
4. Score frameworks (0-100) based on fit
5. Provide detailed reasoning for top recommendations

**User Request:** "${prompt}"

${requirements ? `
**Structured Requirements:**
- Project Type: ${requirements.projectType || 'Not specified'}
- Complexity: ${requirements.complexity || 'Not specified'}  
- Timeline: ${requirements.timeline || 'Not specified'}
- Team Experience: ${requirements.team?.experience || 'Not specified'}
- Team Size: ${requirements.team?.size || 'Not specified'}
- Performance Priority: ${requirements.performance?.priority || 'Not specified'}
- SEO Required: ${requirements.performance?.seo ? 'Yes' : 'No'}
- SSR Required: ${requirements.performance?.ssr ? 'Yes' : 'No'}
- Features: ${requirements.features?.join(', ') || 'Not specified'}
- Constraints: ${requirements.constraints?.join(', ') || 'Not specified'}
` : ''}

Return ONLY valid JSON in this exact format:
{
  "primary": {
    "framework": {
      "name": "Framework Name",
      "id": "framework-id", 
      "category": "frontend|backend|fullstack",
      "type": "library|framework|meta-framework",
      "description": "Brief description of the framework"
    },
    "score": 85,
    "reasoning": "Why this framework is the best fit for the requirements",
    "pros": ["Advantage 1", "Advantage 2", "Advantage 3"],
    "cons": ["Limitation 1", "Limitation 2"],
    "confidence": "high"
  },
  "alternatives": [
    {
      "framework": {
        "name": "Alternative Framework",
        "id": "alt-framework-id",
        "category": "frontend|backend|fullstack", 
        "type": "library|framework|meta-framework",
        "description": "Brief description"
      },
      "score": 75,
      "reasoning": "Why this is a good alternative",
      "pros": ["Alt advantage 1", "Alt advantage 2"],
      "cons": ["Alt limitation 1"],
      "confidence": "medium"
    }
  ],
  "summary": "Concise 2-3 sentence summary of the recommendation",
  "nextSteps": [
    "Specific actionable step 1",
    "Specific actionable step 2", 
    "Specific actionable step 3"
  ],
  "considerations": [
    "Important consideration 1",
    "Important consideration 2",
    "Important consideration 3"
  ],
  "aiReasoning": "Detailed technical analysis explaining the recommendation logic, trade-offs considered, and why this solution aligns with the project goals"
}

Provide up to ${maxAlternatives} alternatives. Focus on practical, actionable advice based on real-world experience.`;

    return this.createSystemPrompt(basePrompt, context);
  }

  // Enhanced methods for specific use cases
  async analyzeProjectFromPrompt(
    prompt: string,
    context?: AgentContext
  ): Promise<AgentResult<{
    projectType: string;
    complexity: string; 
    keyRequirements: string[];
    suggestedFrameworks: string[];
    confidence: number;
  }>> {
    const analysisPrompt = `Analyze this project description and extract key information:

"${prompt}"

Return JSON with:
{
  "projectType": "landing-page|web-app|dashboard|e-commerce|blog|portfolio|api",
  "complexity": "simple|medium|complex",
  "keyRequirements": ["requirement1", "requirement2", ...],
  "suggestedFrameworks": ["framework1", "framework2", ...],
  "confidence": 0.85
}

Focus on identifying:
- What type of project this is
- How complex it seems to be
- What key technical requirements are mentioned
- What frameworks would be suitable`;

    const result = await this.generateJSON(analysisPrompt, undefined, {
      temperature: 0.3,
      maxTokens: 500
    }, context);

    return {
      success: true,
      data: result,
      metadata: { agentId: this.config.id }
    };
  }

  async compareSpecificFrameworks(
    frameworks: string[],
    requirements: string,
    context?: AgentContext
  ): Promise<AgentResult<FrameworkAdvisorOutput>> {
    const comparisonInput: FrameworkAdvisorInput = {
      prompt: `Compare these frameworks for my project: ${frameworks.join(', ')}. Requirements: ${requirements}`,
      maxAlternatives: Math.min(frameworks.length - 1, 5)
    };

    return this.execute(comparisonInput, context);
  }

  async getFrameworkLearningPath(
    frameworkName: string,
    userExperience: 'beginner' | 'intermediate' | 'advanced',
    context?: AgentContext
  ): Promise<AgentResult<{
    framework: string;
    learningPath: Array<{
      phase: string;
      duration: string;
      topics: string[];
      resources: string[];
    }>;
    prerequisites: string[];
    totalTimeEstimate: string;
  }>> {
    const learningPrompt = `Create a detailed learning path for ${frameworkName} for a ${userExperience} developer.

Return JSON with:
{
  "framework": "${frameworkName}",
  "learningPath": [
    {
      "phase": "Phase name",
      "duration": "2-3 weeks", 
      "topics": ["Topic 1", "Topic 2"],
      "resources": ["Resource 1", "Resource 2"]
    }
  ],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "totalTimeEstimate": "8-12 weeks"
}

Tailor the path to the user's experience level and include practical projects.`;

    const result = await this.generateJSON(learningPrompt, undefined, {
      temperature: 0.4,
      maxTokens: 1500
    }, context);

    return {
      success: true,
      data: result,
      metadata: { agentId: this.config.id }
    };
  }

  // Migration analysis
  async analyzeMigrationPath(
    currentFramework: string,
    targetFramework: string,
    projectSize: 'small' | 'medium' | 'large',
    context?: AgentContext
  ): Promise<AgentResult<{
    feasibility: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    timeEstimate: string;
    migrationStrategy: string;
    phases: Array<{
      phase: string;
      description: string;
      effort: string;
      risks: string[];
    }>;
    alternatives: string[];
    recommendation: string;
  }>> {
    const migrationPrompt = `Analyze migrating from ${currentFramework} to ${targetFramework} for a ${projectSize} project.

Consider:
- Code reusability between frameworks
- Architecture differences
- Ecosystem compatibility 
- Team learning curve
- Business continuity

Return JSON with:
{
  "feasibility": "high",
  "effort": "medium", 
  "timeEstimate": "3-6 months",
  "migrationStrategy": "Detailed strategy description",
  "phases": [
    {
      "phase": "Phase 1: Planning",
      "description": "What happens in this phase",
      "effort": "2-3 weeks",
      "risks": ["Risk 1", "Risk 2"]
    }
  ],
  "alternatives": ["Alternative approach 1", "Alternative approach 2"],
  "recommendation": "Final recommendation with reasoning"
}`;

    const result = await this.generateJSON(migrationPrompt, undefined, {
      temperature: 0.3,
      maxTokens: 2000
    }, context);

    return {
      success: true,
      data: result,
      metadata: { agentId: this.config.id }
    };
  }

  // Performance analysis
  async analyzePerformanceImplications(
    frameworks: string[],
    performanceRequirements: {
      loadTime: string;
      interactivity: string;
      seoImportance: string;
      trafficExpected: string;
    },
    context?: AgentContext
  ): Promise<AgentResult<Array<{
    framework: string;
    performanceScore: number;
    bundleSize: string;
    renderingStrategy: string;
    seoCapabilities: string;
    scalabilityScore: number;
    optimizations: string[];
    tradeoffs: string[];
  }>>> {
    const performancePrompt = `Analyze performance characteristics of these frameworks: ${frameworks.join(', ')}

Requirements:
- Load time importance: ${performanceRequirements.loadTime}
- Interactivity importance: ${performanceRequirements.interactivity}
- SEO importance: ${performanceRequirements.seoImportance}
- Expected traffic: ${performanceRequirements.trafficExpected}

Return JSON array with detailed performance analysis for each framework.`;

    const result = await this.generateJSON(performancePrompt, undefined, {
      temperature: 0.3,
      maxTokens: 2500
    }, context);

    return {
      success: true,
      data: result,
      metadata: { agentId: this.config.id }
    };
  }
}