import { FrameworkAdvisor } from '@ui-grid-ai/framework-advisor';
import { AgentManager } from '../core/AgentManager';
import { FrameworkAdvisorAgent, FrameworkAdvisorInput } from '../agents/FrameworkAdvisorAgent';
import { AIProvider, AgentContext, AgentResult } from '../types';

/**
 * Bridge between the existing FrameworkAdvisor and the new AI-powered FrameworkAdvisorAgent
 * This allows gradual migration from rule-based to AI-powered recommendations
 */
export class FrameworkAdvisorBridge {
  private legacyAdvisor: FrameworkAdvisor;
  private agentManager: AgentManager;
  private useAI: boolean;

  constructor(
    agentManager: AgentManager,
    config?: {
      useAI?: boolean;
      enableAiReasoning?: boolean;
      maxAlternatives?: number;
      minScore?: number;
    }
  ) {
    this.agentManager = agentManager;
    this.useAI = config?.useAI ?? true;
    
    // Initialize legacy advisor as fallback
    this.legacyAdvisor = new FrameworkAdvisor({
      enableAiReasoning: config?.enableAiReasoning ?? true,
      maxAlternatives: config?.maxAlternatives ?? 3,
      minScore: config?.minScore ?? 20,
    });
  }

  /**
   * Recommend framework from prompt using AI agent (preferred) or legacy system
   */
  async recommendFromPrompt(
    prompt: string,
    context?: AgentContext,
    options?: {
      maxAlternatives?: number;
      fallbackToLegacy?: boolean;
    }
  ): Promise<any> {
    if (this.useAI) {
      try {
        // Use the new AI-powered agent
        const input: FrameworkAdvisorInput = {
          prompt,
          maxAlternatives: options?.maxAlternatives ?? 3
        };

        const result = await this.agentManager.executeAgent<any>(
          'framework-advisor',
          input,
          context
        );

        if (result.success) {
          // Convert agent output to legacy format for backward compatibility
          return this.convertAgentOutputToLegacyFormat(result.data);
        }

        // Fall back to legacy if AI fails and fallback is enabled
        if (options?.fallbackToLegacy !== false) {
          console.warn('AI agent failed, falling back to legacy advisor:', result.error);
          return await this.legacyAdvisor.recommendFromPrompt(prompt);
        }

        throw new Error(result.error || 'Framework recommendation failed');
      } catch (error) {
        // Fall back to legacy system on error
        if (options?.fallbackToLegacy !== false) {
          console.warn('AI recommendation failed, falling back to legacy:', error);
          return await this.legacyAdvisor.recommendFromPrompt(prompt);
        }
        throw error;
      }
    } else {
      // Use legacy system directly
      return await this.legacyAdvisor.recommendFromPrompt(prompt);
    }
  }

  /**
   * Compare multiple frameworks using AI analysis
   */
  async compareFrameworks(
    frameworkIds: string[],
    requirements: any,
    context?: AgentContext
  ): Promise<any> {
    if (this.useAI) {
      try {
        const agent = new FrameworkAdvisorAgent({} as AIProvider); // This should be properly injected
        const result = await agent.compareSpecificFrameworks(
          frameworkIds,
          typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
          context
        );

        if (result.success) {
          return this.convertAgentOutputToLegacyFormat(result.data);
        }
      } catch (error) {
        console.warn('AI comparison failed, falling back to legacy:', error);
      }
    }

    // Fall back to legacy system
    return await this.legacyAdvisor.compareFrameworks(frameworkIds, requirements);
  }

  /**
   * Get framework learning path using AI analysis
   */
  async getFrameworkLearningPath(
    frameworkName: string,
    userExperience: 'beginner' | 'intermediate' | 'advanced',
    context?: AgentContext
  ): Promise<any> {
    if (this.useAI) {
      try {
        const agent = new FrameworkAdvisorAgent({} as AIProvider); // This should be properly injected
        const result = await agent.getFrameworkLearningPath(
          frameworkName,
          userExperience,
          context
        );

        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.warn('AI learning path generation failed:', error);
      }
    }

    // Fallback: generate basic learning path
    return this.generateBasicLearningPath(frameworkName, userExperience);
  }

  /**
   * Analyze migration path between frameworks
   */
  async analyzeMigrationPath(
    currentFramework: string,
    targetFramework: string,
    projectSize: 'small' | 'medium' | 'large',
    context?: AgentContext
  ): Promise<any> {
    if (this.useAI) {
      try {
        const agent = new FrameworkAdvisorAgent({} as AIProvider); // This should be properly injected
        const result = await agent.analyzeMigrationPath(
          currentFramework,
          targetFramework,
          projectSize,
          context
        );

        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.warn('AI migration analysis failed:', error);
      }
    }

    // Fallback: basic migration analysis
    return this.generateBasicMigrationAnalysis(currentFramework, targetFramework, projectSize);
  }

  /**
   * Set whether to use AI or legacy system
   */
  setUseAI(useAI: boolean): void {
    this.useAI = useAI;
  }

  /**
   * Get current configuration
   */
  getConfig(): { useAI: boolean } {
    return { useAI: this.useAI };
  }

  // Private helper methods

  private convertAgentOutputToLegacyFormat(agentOutput: any): any {
    // Convert the new agent output format to the legacy format
    // for backward compatibility with existing code
    return {
      primary: agentOutput.primary,
      alternatives: agentOutput.alternatives,
      summary: agentOutput.summary,
      nextSteps: agentOutput.nextSteps,
      considerations: agentOutput.considerations,
      aiReasoning: agentOutput.aiReasoning
    };
  }

  private generateBasicLearningPath(
    frameworkName: string,
    userExperience: string
  ): any {
    // Basic learning path fallback
    const baseDuration = userExperience === 'beginner' ? '12-16 weeks' : 
                        userExperience === 'intermediate' ? '8-12 weeks' : '4-6 weeks';

    return {
      framework: frameworkName,
      learningPath: [
        {
          phase: 'Foundation',
          duration: userExperience === 'beginner' ? '3-4 weeks' : '1-2 weeks',
          topics: ['Basic concepts', 'Setup and tooling', 'Core syntax'],
          resources: ['Official documentation', 'Getting started guide']
        },
        {
          phase: 'Building',
          duration: userExperience === 'beginner' ? '4-6 weeks' : '2-4 weeks',
          topics: ['Components/modules', 'State management', 'Routing'],
          resources: ['Tutorials', 'Practice projects']
        },
        {
          phase: 'Advanced',
          duration: userExperience === 'beginner' ? '4-6 weeks' : '2-4 weeks',
          topics: ['Advanced patterns', 'Performance optimization', 'Testing'],
          resources: ['Advanced guides', 'Real-world projects']
        }
      ],
      prerequisites: ['HTML', 'CSS', 'JavaScript'],
      totalTimeEstimate: baseDuration
    };
  }

  private generateBasicMigrationAnalysis(
    currentFramework: string,
    targetFramework: string,
    projectSize: string
  ): any {
    const effortMultiplier = projectSize === 'small' ? 1 : projectSize === 'medium' ? 2 : 3;
    
    return {
      feasibility: 'medium',
      effort: projectSize === 'small' ? 'low' : 'medium',
      timeEstimate: `${effortMultiplier * 2}-${effortMultiplier * 4} months`,
      migrationStrategy: `Gradual migration from ${currentFramework} to ${targetFramework}`,
      phases: [
        {
          phase: 'Planning',
          description: 'Analyze current codebase and plan migration strategy',
          effort: '2-3 weeks',
          risks: ['Incomplete analysis', 'Underestimated complexity']
        },
        {
          phase: 'Setup',
          description: `Set up ${targetFramework} development environment`,
          effort: '1-2 weeks',
          risks: ['Tooling conflicts', 'Configuration issues']
        },
        {
          phase: 'Migration',
          description: 'Migrate components incrementally',
          effort: `${effortMultiplier * 2}-${effortMultiplier * 3} months`,
          risks: ['Breaking changes', 'Performance regression']
        }
      ],
      alternatives: ['Gradual component replacement', 'Complete rewrite', 'Hybrid approach'],
      recommendation: 'Proceed with caution and thorough planning'
    };
  }
}