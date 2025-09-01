import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { AgentManager } from '../core/AgentManager';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
  WorkflowStep,
  Workflow
} from '../types';

// Input/Output schemas
const WorkflowOrchestrationInputSchema = z.object({
  request: z.string().min(1, 'Request cannot be empty'),
  context: z.object({
    userExperience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    timeConstraints: z.enum(['urgent', 'normal', 'flexible']).optional(),
    projectScope: z.enum(['small', 'medium', 'large']).optional(),
    preferences: z.record(z.any()).optional(),
  }).optional(),
  maxSteps: z.number().min(1).max(20).default(10),
  executeWorkflow: z.boolean().default(false), // Whether to execute or just plan
});

const WorkflowPlanSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    agentId: z.string(),
    input: z.any(),
    dependencies: z.array(z.string()).default([]),
    estimatedDuration: z.string(),
    criticality: z.enum(['low', 'medium', 'high']),
  })),
  totalEstimatedTime: z.string(),
  complexity: z.enum(['simple', 'medium', 'complex']),
  requiredAgents: z.array(z.string()),
  successCriteria: z.array(z.string()),
  riskAssessment: z.array(z.string()),
});

const WorkflowOrchestrationOutputSchema = z.object({
  workflowPlan: WorkflowPlanSchema,
  executionSummary: z.object({
    executed: z.boolean(),
    completedSteps: z.number(),
    totalSteps: z.number(),
    results: z.record(z.any()).optional(),
    errors: z.array(z.string()).optional(),
  }).optional(),
  recommendations: z.array(z.string()),
  nextActions: z.array(z.string()),
});

export type WorkflowOrchestrationInput = z.infer<typeof WorkflowOrchestrationInputSchema>;
export type WorkflowOrchestrationOutput = z.infer<typeof WorkflowOrchestrationOutputSchema>;

export class WorkflowOrchestrationAgent extends BaseAgent {
  private agentManager?: AgentManager;

  constructor(provider: AIProvider, agentManager?: AgentManager) {
    const config: AgentConfig = {
      id: 'workflow-orchestration',
      name: 'Workflow Orchestration Agent',
      description: 'Plans and executes complex multi-step workflows by coordinating multiple specialized agents',
      version: '1.0.0',
      enabled: true,
      priority: 20, // Highest priority as it orchestrates others
      timeout: 120000, // 2 minutes
      retries: 2,
      dependencies: [],
      capabilities: [
        'workflow-planning',
        'agent-coordination',
        'task-decomposition',
        'execution-monitoring',
        'error-recovery',
        'progress-tracking'
      ]
    };

    super(config, provider);
    this.agentManager = agentManager;
  }

  setAgentManager(agentManager: AgentManager): void {
    this.agentManager = agentManager;
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<WorkflowOrchestrationOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Plan the workflow
      const workflowPlan = await this.planWorkflow(validatedInput, context);
      
      let executionSummary;
      if (validatedInput.executeWorkflow && this.agentManager) {
        // Execute the planned workflow
        executionSummary = await this.executeWorkflow(workflowPlan, context);
      }

      // Generate recommendations and next actions
      const result = await this.generateOrchestrationResult(
        workflowPlan, 
        executionSummary, 
        validatedInput, 
        context
      );
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      WorkflowOrchestrationInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return WorkflowOrchestrationInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return WorkflowOrchestrationOutputSchema;
  }

  private async planWorkflow(
    input: WorkflowOrchestrationInput,
    context?: AgentContext
  ): Promise<any> {
    const systemPrompt = this.createWorkflowPlanningPrompt(input, context);
    
    // Use JSON generation for structured workflow planning
    const workflowPlan = await this.generateJSON(
      systemPrompt,
      WorkflowPlanSchema,
      {
        temperature: 0.4, // Balance creativity with consistency
        maxTokens: 2500,
      },
      context
    );

    return workflowPlan;
  }

  private createWorkflowPlanningPrompt(
    input: WorkflowOrchestrationInput,
    context?: AgentContext
  ): string {
    const { request, context: userContext, maxSteps } = input;

    const basePrompt = `You are a senior technical project manager and architect. Break down complex software development requests into detailed, actionable workflows using specialized AI agents.

Available Agents and Their Capabilities:

1. **intent-classification** - Analyzes user intent and determines response strategies
   - Use for: Understanding what the user really wants to accomplish
   - Input: User messages and context
   - Output: Intent classification with confidence and recommendations

2. **framework-advisor** - Provides framework recommendations and architectural guidance  
   - Use for: Technology stack decisions, framework selection, migration planning
   - Input: Project requirements and constraints
   - Output: Framework recommendations with pros/cons and implementation guidance

3. **website-generation** - Generates complete websites from descriptions
   - Use for: Creating HTML/CSS/JS code, responsive layouts, specific components
   - Input: Website requirements, framework choice, device targets
   - Output: Complete website code with HTML, CSS, and JavaScript

4. **chat-assistant** - Provides friendly guidance and explanations
   - Use for: User communication, progress updates, guidance, and explanations
   - Input: Conversational requests and context
   - Output: Helpful responses and guidance

**Workflow Planning Guidelines:**

1. **Task Decomposition**: Break complex requests into logical, sequential steps
2. **Agent Selection**: Choose the most appropriate agent for each step
3. **Dependency Management**: Ensure steps that depend on others are sequenced correctly
4. **Input Chaining**: Design how outputs from one step become inputs to the next
5. **Error Handling**: Consider what happens if a step fails
6. **User Experience**: Include communication steps to keep users informed

**Step Criticality Levels:**
- **high**: Failure blocks entire workflow
- **medium**: Failure impacts quality but workflow can continue  
- **low**: Optional enhancement steps

**User Request:** "${request}"

${userContext ? `
**User Context:**
- Experience Level: ${userContext.userExperience || 'Not specified'}
- Time Constraints: ${userContext.timeConstraints || 'Not specified'}
- Project Scope: ${userContext.projectScope || 'Not specified'}
- Preferences: ${userContext.preferences ? JSON.stringify(userContext.preferences) : 'None specified'}
` : ''}

**Workflow Requirements:**
- Maximum ${maxSteps} steps
- Each step must use one of the available agents
- Include realistic time estimates
- Consider user experience level and constraints

Return ONLY valid JSON in this exact format:
{
  "steps": [
    {
      "id": "step-1",
      "name": "Analyze User Intent",
      "description": "Use intent classification to understand the user's goals and requirements",
      "agentId": "intent-classification", 
      "input": {
        "message": "User's request",
        "hasActiveCode": false,
        "responseMode": "explain-first"
      },
      "dependencies": [],
      "estimatedDuration": "30 seconds",
      "criticality": "high"
    },
    {
      "id": "step-2", 
      "name": "Framework Recommendation",
      "description": "Get technology stack recommendations based on requirements",
      "agentId": "framework-advisor",
      "input": {
        "prompt": "Project requirements extracted from step 1",
        "maxAlternatives": 3
      },
      "dependencies": ["step-1"],
      "estimatedDuration": "45 seconds",
      "criticality": "high"
    }
  ],
  "totalEstimatedTime": "2-3 minutes",
  "complexity": "medium",
  "requiredAgents": ["intent-classification", "framework-advisor", "website-generation"],
  "successCriteria": [
    "User intent clearly understood",
    "Appropriate technology stack selected", 
    "Functional code generated"
  ],
  "riskAssessment": [
    "Complex requirements may need clarification",
    "Generated code may need refinement",
    "Integration between components might require adjustment"
  ]
}

Focus on creating a practical, executable workflow that delivers value to the user.`;

    return this.createSystemPrompt(basePrompt, context);
  }

  private async executeWorkflow(
    workflowPlan: any,
    context?: AgentContext
  ): Promise<any> {
    if (!this.agentManager) {
      throw new Error('AgentManager required for workflow execution');
    }

    const results: Record<string, any> = {};
    const errors: string[] = [];
    let completedSteps = 0;

    try {
      // Convert to Workflow format for AgentManager
      const workflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: 'Orchestrated Workflow',
        description: 'Multi-agent workflow execution',
        steps: workflowPlan.steps.map((step: any) => ({
          id: step.id,
          agentId: step.agentId,
          input: step.input,
          onSuccess: this.getNextStepId(step.id, workflowPlan.steps),
          timeout: this.parseDuration(step.estimatedDuration)
        })),
        timeout: 300000, // 5 minutes total
        retries: 1
      };

      // Execute workflow through AgentManager
      const workflowResult = await this.agentManager.executeWorkflow(
        workflow,
        {},
        context
      );

      if (workflowResult.success && workflowResult.data) {
        Object.assign(results, workflowResult.data);
        completedSteps = Object.keys(workflowResult.data).length;
      } else {
        errors.push(workflowResult.error || 'Workflow execution failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      errors.push(errorMessage);
    }

    return {
      executed: true,
      completedSteps,
      totalSteps: workflowPlan.steps.length,
      results,
      errors
    };
  }

  private async generateOrchestrationResult(
    workflowPlan: any,
    executionSummary: any,
    input: WorkflowOrchestrationInput,
    context?: AgentContext
  ): Promise<WorkflowOrchestrationOutput> {
    // Generate recommendations based on workflow plan and execution
    const recommendations = await this.generateRecommendations(workflowPlan, executionSummary, input);
    const nextActions = await this.generateNextActions(workflowPlan, executionSummary, input);

    return {
      workflowPlan,
      executionSummary,
      recommendations,
      nextActions
    };
  }

  private async generateRecommendations(
    workflowPlan: any,
    executionSummary: any,
    input: WorkflowOrchestrationInput
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Base recommendations on complexity and execution results
    if (workflowPlan.complexity === 'complex') {
      recommendations.push('Consider breaking this into smaller phases for better manageability');
    }

    if (executionSummary?.errors?.length > 0) {
      recommendations.push('Review and address execution errors before proceeding');
      recommendations.push('Consider adding validation steps to catch issues early');
    }

    if (input.context?.userExperience === 'beginner') {
      recommendations.push('Include additional explanation and documentation steps');
      recommendations.push('Consider providing learning resources for the chosen technologies');
    }

    if (input.context?.timeConstraints === 'urgent') {
      recommendations.push('Focus on core functionality first, add enhancements later');
      recommendations.push('Consider using more established frameworks for faster development');
    }

    recommendations.push('Test each component thoroughly before integration');
    recommendations.push('Set up proper error handling and monitoring from the start');

    return recommendations;
  }

  private async generateNextActions(
    workflowPlan: any,
    executionSummary: any,
    input: WorkflowOrchestrationInput
  ): Promise<string[]> {
    const nextActions: string[] = [];

    if (executionSummary?.executed) {
      if (executionSummary.completedSteps === executionSummary.totalSteps) {
        nextActions.push('Review generated code and test functionality');
        nextActions.push('Deploy to a test environment for validation');
        nextActions.push('Gather feedback and iterate on the implementation');
      } else {
        nextActions.push(`Complete remaining ${executionSummary.totalSteps - executionSummary.completedSteps} workflow steps`);
        nextActions.push('Address any errors that occurred during execution');
      }
    } else {
      nextActions.push('Execute the planned workflow to generate your project');
      nextActions.push('Review the workflow plan and make any necessary adjustments');
    }

    nextActions.push('Consider setting up automated testing and CI/CD');
    nextActions.push('Plan for ongoing maintenance and updates');

    return nextActions;
  }

  // Helper methods
  private getNextStepId(currentStepId: string, steps: any[]): string | undefined {
    const currentIndex = steps.findIndex(step => step.id === currentStepId);
    const nextStep = steps[currentIndex + 1];
    return nextStep?.id;
  }

  private parseDuration(duration: string): number {
    // Convert human-readable duration to milliseconds
    const match = duration.match(/(\d+)\s*(second|minute|hour)s?/i);
    if (!match) return 30000; // Default 30 seconds

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'second': return value * 1000;
      case 'minute': return value * 60 * 1000;
      case 'hour': return value * 60 * 60 * 1000;
      default: return 30000;
    }
  }

  // Specialized workflow templates for common use cases
  async planECommerceWorkflow(
    requirements: {
      features: string[];
      budget: string;
      timeline: string;
      experience: string;
    },
    context?: AgentContext
  ): Promise<AgentResult<any>> {
    const ecommerceRequest = `Build an e-commerce website with these features: ${requirements.features.join(', ')}. 
    Budget: ${requirements.budget}, Timeline: ${requirements.timeline}, Experience: ${requirements.experience}`;

    return this.execute({
      request: ecommerceRequest,
      context: {
        userExperience: requirements.experience as any,
        timeConstraints: this.mapTimelineToConstraints(requirements.timeline),
        projectScope: 'large'
      },
      executeWorkflow: false
    }, context);
  }

  async planPortfolioWorkflow(
    requirements: {
      profession: string;
      sections: string[];
      style: string;
    },
    context?: AgentContext
  ): Promise<AgentResult<any>> {
    const portfolioRequest = `Create a ${requirements.profession} portfolio website with sections: ${requirements.sections.join(', ')}. 
    Style: ${requirements.style}`;

    return this.execute({
      request: portfolioRequest,
      context: {
        projectScope: 'medium'
      },
      executeWorkflow: false
    }, context);
  }

  async planLandingPageWorkflow(
    requirements: {
      product: string;
      audience: string;
      goals: string[];
    },
    context?: AgentContext
  ): Promise<AgentResult<any>> {
    const landingPageRequest = `Build a landing page for ${requirements.product} targeting ${requirements.audience}. 
    Goals: ${requirements.goals.join(', ')}`;

    return this.execute({
      request: landingPageRequest,
      context: {
        projectScope: 'small',
        timeConstraints: 'normal'
      },
      executeWorkflow: false
    }, context);
  }

  private mapTimelineToConstraints(timeline: string): 'urgent' | 'normal' | 'flexible' {
    const lowerTimeline = timeline.toLowerCase();
    if (lowerTimeline.includes('urgent') || lowerTimeline.includes('asap') || lowerTimeline.includes('week')) {
      return 'urgent';
    } else if (lowerTimeline.includes('flexible') || lowerTimeline.includes('month')) {
      return 'flexible';
    }
    return 'normal';
  }
}