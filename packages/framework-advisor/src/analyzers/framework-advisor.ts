import { ProjectRequirements, Recommendation, Config, AnalysisCriteria } from '../types';
import { PromptAnalyzer } from './prompt-analyzer';
import { ScoringEngine } from './scoring-engine';
import { FRAMEWORKS } from '../utils/frameworks';

export class FrameworkAdvisor {
  private promptAnalyzer: PromptAnalyzer;
  private scoringEngine: ScoringEngine;
  private config: Config;
  
  constructor(config?: Partial<Config>) {
    this.config = {
      enableAiReasoning: config?.enableAiReasoning ?? true,
      maxAlternatives: config?.maxAlternatives ?? 3,
      minScore: config?.minScore ?? 20,
      ...config
    };
    
    this.promptAnalyzer = new PromptAnalyzer();
    this.scoringEngine = new ScoringEngine(this.config.defaultCriteria);
  }
  
  /**
   * Analyze a user prompt and recommend the best framework
   */
  async recommendFromPrompt(prompt: string): Promise<Recommendation> {
    // Analyze the prompt to extract requirements
    const promptAnalysis = this.promptAnalyzer.analyze(prompt);
    
    // Convert prompt analysis to structured requirements
    const requirements: ProjectRequirements = {
      description: prompt,
      projectType: promptAnalysis.projectType as any,
      complexity: promptAnalysis.complexity,
      explicitFramework: promptAnalysis.explicitFramework,
      team: {
        experience: this.inferExperience(prompt),
      },
      performance: {
        priority: this.inferPerformancePriority(prompt),
        seo: prompt.toLowerCase().includes('seo'),
        ssr: prompt.toLowerCase().includes('ssr') || prompt.toLowerCase().includes('server-side'),
      },
      timeline: this.inferTimeline(prompt),
      features: promptAnalysis.requirements,
      constraints: promptAnalysis.constraints,
    };
    
    return this.recommend(requirements);
  }
  
  /**
   * Recommend frameworks based on structured requirements
   */
  async recommend(requirements: ProjectRequirements): Promise<Recommendation> {
    // Score all frameworks
    const scoredFrameworks = FRAMEWORKS
      .map(framework => this.scoringEngine.scoreFramework(framework, requirements))
      .filter(result => result.score >= this.config.minScore)
      .sort((a, b) => b.score - a.score);
    
    if (scoredFrameworks.length === 0) {
      throw new Error('No suitable frameworks found for the given requirements');
    }
    
    const primary = scoredFrameworks[0];
    const alternatives = scoredFrameworks.slice(1, this.config.maxAlternatives + 1);
    
    const summary = this.generateSummary(primary, alternatives, requirements);
    const nextSteps = this.generateNextSteps(primary, requirements);
    const considerations = this.generateConsiderations(primary, requirements);
    
    let aiReasoning: string | undefined;
    if (this.config.enableAiReasoning) {
      aiReasoning = await this.generateAiReasoning(primary, requirements);
    }
    
    return {
      primary,
      alternatives,
      summary,
      nextSteps,
      considerations,
      aiReasoning
    };
  }
  
  /**
   * Get framework recommendation with custom criteria weights
   */
  async recommendWithCriteria(
    requirements: ProjectRequirements, 
    criteria: AnalysisCriteria
  ): Promise<Recommendation> {
    const customScoringEngine = new ScoringEngine(criteria);
    const originalEngine = this.scoringEngine;
    this.scoringEngine = customScoringEngine;
    
    try {
      return await this.recommend(requirements);
    } finally {
      this.scoringEngine = originalEngine;
    }
  }
  
  /**
   * Compare multiple frameworks for given requirements
   */
  async compareFrameworks(
    frameworkIds: string[], 
    requirements: ProjectRequirements
  ): Promise<Recommendation> {
    const frameworks = FRAMEWORKS.filter(f => frameworkIds.includes(f.id));
    
    if (frameworks.length === 0) {
      throw new Error('No valid frameworks found for comparison');
    }
    
    const scoredFrameworks = frameworks
      .map(framework => this.scoringEngine.scoreFramework(framework, requirements))
      .sort((a, b) => b.score - a.score);
    
    const primary = scoredFrameworks[0];
    const alternatives = scoredFrameworks.slice(1);
    
    const summary = `Comparison of ${frameworks.map(f => f.name).join(', ')} for your project requirements. ${primary.framework.name} scored highest with ${primary.score}/100.`;
    
    return {
      primary,
      alternatives,
      summary,
      nextSteps: this.generateNextSteps(primary, requirements),
      considerations: this.generateConsiderations(primary, requirements)
    };
  }
  
  private inferExperience(prompt: string): 'beginner' | 'intermediate' | 'advanced' | undefined {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('beginner') || lowerPrompt.includes('new to') || lowerPrompt.includes('learning')) {
      return 'beginner';
    }
    
    if (lowerPrompt.includes('advanced') || lowerPrompt.includes('expert') || lowerPrompt.includes('senior')) {
      return 'advanced';
    }
    
    return undefined;
  }
  
  private inferPerformancePriority(prompt: string): 'low' | 'medium' | 'high' | undefined {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('performance') || lowerPrompt.includes('fast') || lowerPrompt.includes('speed')) {
      return 'high';
    }
    
    return undefined;
  }
  
  private inferTimeline(prompt: string): 'urgent' | 'normal' | 'flexible' | undefined {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('urgent') || lowerPrompt.includes('asap') || lowerPrompt.includes('quickly')) {
      return 'urgent';
    }
    
    if (lowerPrompt.includes('flexible') || lowerPrompt.includes('no rush')) {
      return 'flexible';
    }
    
    return undefined;
  }
  
  private generateSummary(primary: any, alternatives: any[], requirements: ProjectRequirements): string {
    const frameworkName = primary.framework.name;
    const score = primary.score;
    
    let summary = `Based on your requirements, **${frameworkName}** is the recommended framework with a score of ${score}/100.`;
    
    if (requirements.explicitFramework === primary.framework.id) {
      summary += ` This aligns with your explicit preference for ${frameworkName}.`;
    }
    
    if (alternatives.length > 0) {
      const altNames = alternatives.slice(0, 2).map(a => a.framework.name).join(' and ');
      summary += ` ${altNames} ${alternatives.length > 1 ? 'are' : 'is'} viable alternative${alternatives.length > 1 ? 's' : ''}.`;
    }
    
    return summary;
  }
  
  private generateNextSteps(primary: any, requirements: ProjectRequirements): string[] {
    const steps: string[] = [];
    const framework = primary.framework;
    
    steps.push(`Set up a ${framework.name} development environment`);
    
    if (framework.ecosystem.uiLibraries.length > 0) {
      steps.push(`Choose a UI library (consider ${framework.ecosystem.uiLibraries[0]})`);
    }
    
    if (requirements.performance?.ssr && framework.category === 'frontend') {
      if (framework.id === 'react') {
        steps.push('Consider Next.js for server-side rendering capabilities');
      } else if (framework.id === 'vue') {
        steps.push('Consider Nuxt.js for server-side rendering capabilities');
      }
    }
    
    if (framework.ecosystem.stateManagement.length > 0) {
      steps.push(`Plan state management approach (${framework.ecosystem.stateManagement[0]} recommended)`);
    }
    
    steps.push('Create project structure and initial components');
    steps.push('Set up testing environment');
    
    return steps;
  }
  
  private generateConsiderations(primary: any, requirements: ProjectRequirements): string[] {
    const considerations: string[] = [];
    const framework = primary.framework;
    
    if (framework.learningCurve === 'steep' && requirements.timeline === 'urgent') {
      considerations.push('Consider the learning curve impact on your timeline');
    }
    
    if (!framework.enterpriseSupport && requirements.team?.size === 'large') {
      considerations.push('Evaluate long-term support options for enterprise use');
    }
    
    if (framework.performance.bundleSize === 'large' && requirements.performance?.priority === 'high') {
      considerations.push('Plan for bundle optimization strategies');
    }
    
    if (framework.communitySize === 'small') {
      considerations.push('Factor in smaller community size for support and resources');
    }
    
    considerations.push('Evaluate hosting and deployment options');
    considerations.push('Consider long-term maintenance and upgrade paths');
    
    return considerations;
  }
  
  private async generateAiReasoning(primary: any, requirements: ProjectRequirements): Promise<string> {
    // This would integrate with the AI provider system
    // For now, return a placeholder that could be enhanced with actual AI calls
    return `As a senior engineer, I recommend ${primary.framework.name} because it balances your project requirements effectively. ${primary.reasoning}`;
  }
}