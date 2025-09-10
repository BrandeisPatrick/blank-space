import { Framework, ProjectRequirements, AnalysisCriteria, AnalysisResult } from '../types';

export class ScoringEngine {
  private criteria: AnalysisCriteria;
  
  constructor(criteria?: Partial<AnalysisCriteria>) {
    this.criteria = {
      performance: criteria?.performance ?? 0.2,
      learningCurve: criteria?.learningCurve ?? 0.15,
      community: criteria?.community ?? 0.1,
      ecosystem: criteria?.ecosystem ?? 0.15,
      maintenance: criteria?.maintenance ?? 0.1,
      projectFit: criteria?.projectFit ?? 0.3
    };
  }
  
  scoreFramework(framework: Framework, requirements: ProjectRequirements): AnalysisResult {
    const performanceScore = this.scorePerformance(framework, requirements);
    const learningCurveScore = this.scoreLearningCurve(framework, requirements);
    const communityScore = this.scoreCommunity(framework);
    const ecosystemScore = this.scoreEcosystem(framework, requirements);
    const maintenanceScore = this.scoreMaintenance(framework, requirements);
    const projectFitScore = this.scoreProjectFit(framework, requirements);
    
    const totalScore = 
      performanceScore * this.criteria.performance +
      learningCurveScore * this.criteria.learningCurve +
      communityScore * this.criteria.community +
      ecosystemScore * this.criteria.ecosystem +
      maintenanceScore * this.criteria.maintenance +
      projectFitScore * this.criteria.projectFit;
    
    const reasoning = this.generateReasoning(framework, requirements, {
      performance: performanceScore,
      learningCurve: learningCurveScore,
      community: communityScore,
      ecosystem: ecosystemScore,
      maintenance: maintenanceScore,
      projectFit: projectFitScore
    });
    
    const pros = this.generatePros(framework, requirements);
    const cons = this.generateCons(framework, requirements);
    const confidence = this.calculateConfidence(totalScore, requirements);
    const alternatives = this.generateAlternatives(framework, requirements);
    
    return {
      framework,
      score: Math.round(totalScore),
      reasoning,
      pros,
      cons,
      confidence,
      alternatives
    };
  }
  
  private scorePerformance(framework: Framework, requirements: ProjectRequirements): number {
    let score = 50; // Base score
    
    // Bundle size scoring
    switch (framework.performance.bundleSize) {
      case 'small': score += 20; break;
      case 'medium': score += 10; break;
      case 'large': score -= 10; break;
    }
    
    // Runtime performance
    switch (framework.performance.runtime) {
      case 'fast': score += 15; break;
      case 'moderate': score += 5; break;
      case 'slow': score -= 15; break;
    }
    
    // Build time
    switch (framework.performance.buildTime) {
      case 'fast': score += 10; break;
      case 'moderate': score += 0; break;
      case 'slow': score -= 10; break;
    }
    
    // Adjust based on performance requirements
    if (requirements.performance?.priority === 'high') {
      if (framework.performance.runtime === 'fast' && framework.performance.bundleSize === 'small') {
        score += 20;
      }
    }
    
    // SEO requirements
    if (requirements.performance?.seo && framework.features.includes('Server-side rendering')) {
      score += 15;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private scoreLearningCurve(framework: Framework, requirements: ProjectRequirements): number {
    let score = 50;
    
    switch (framework.learningCurve) {
      case 'easy': score += 30; break;
      case 'moderate': score += 10; break;
      case 'steep': score -= 20; break;
    }
    
    // Adjust based on team experience
    if (requirements.team?.experience === 'beginner') {
      if (framework.learningCurve === 'easy') score += 20;
      if (framework.learningCurve === 'steep') score -= 30;
    }
    
    if (requirements.team?.experience === 'advanced') {
      if (framework.learningCurve === 'steep') score += 10; // Advanced teams can handle complexity
    }
    
    // Timeline considerations
    if (requirements.timeline === 'urgent' && framework.learningCurve === 'steep') {
      score -= 25;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private scoreCommunity(framework: Framework): number {
    let score = 50;
    
    switch (framework.communitySize) {
      case 'large': score += 25; break;
      case 'medium': score += 10; break;
      case 'small': score -= 15; break;
    }
    
    switch (framework.maturity) {
      case 'mature': score += 20; break;
      case 'stable': score += 10; break;
      case 'experimental': score -= 25; break;
    }
    
    switch (framework.documentation) {
      case 'excellent': score += 15; break;
      case 'good': score += 5; break;
      case 'poor': score -= 20; break;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private scoreEcosystem(framework: Framework, requirements: ProjectRequirements): number {
    let score = 50;
    
    // UI library availability
    if (framework.ecosystem.uiLibraries.length > 3) score += 15;
    else if (framework.ecosystem.uiLibraries.length > 1) score += 5;
    else score -= 10;
    
    // State management options
    if (framework.ecosystem.stateManagement.length > 2) score += 10;
    else if (framework.ecosystem.stateManagement.length === 0) score -= 15;
    
    // Testing ecosystem
    if (framework.ecosystem.testing.length > 2) score += 10;
    
    // Project type specific adjustments
    if (requirements.projectType === 'e-commerce') {
      // E-commerce needs rich ecosystem
      if (framework.id === 'react' || framework.id === 'nextjs') score += 15;
    }
    
    if (requirements.projectType === 'dashboard') {
      // Dashboards benefit from rich UI libraries
      if (framework.ecosystem.uiLibraries.length > 3) score += 10;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private scoreMaintenance(framework: Framework, requirements: ProjectRequirements): number {
    let score = 50;
    
    // Enterprise support
    if (framework.enterpriseSupport) score += 20;
    
    // Maturity
    switch (framework.maturity) {
      case 'mature': score += 15; break;
      case 'stable': score += 5; break;
      case 'experimental': score -= 25; break;
    }
    
    // Community size affects long-term support
    switch (framework.communitySize) {
      case 'large': score += 10; break;
      case 'medium': score += 0; break;
      case 'small': score -= 15; break;
    }
    
    // Maintenance requirements
    if (requirements.maintenance === 'extensive') {
      if (framework.enterpriseSupport) score += 15;
      if (framework.maturity === 'mature') score += 10;
    }
    
    if (requirements.maintenance === 'minimal') {
      if (framework.id === 'vanilla') score += 20; // No dependencies to maintain
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private scoreProjectFit(framework: Framework, requirements: ProjectRequirements): number {
    let score = 50;
    
    // Explicit framework match
    if (requirements.explicitFramework === framework.id) {
      return 100; // Perfect match
    }
    
    // Project type fit
    if (requirements.projectType) {
      if (framework.bestFor.includes(requirements.projectType)) {
        score += 30;
      }
      if (framework.notRecommendedFor.includes(requirements.projectType)) {
        score -= 40;
      }
    }
    
    // Complexity fit
    if (requirements.complexity) {
      switch (requirements.complexity) {
        case 'simple':
          if (framework.id === 'vanilla' || framework.learningCurve === 'easy') score += 20;
          if (framework.id === 'angular') score -= 25;
          break;
        case 'complex':
          if (framework.id === 'angular' || framework.id === 'react') score += 20;
          if (framework.id === 'vanilla') score -= 20;
          break;
      }
    }
    
    // Team size considerations
    if (requirements.team?.size === 'large' && framework.enterpriseSupport) {
      score += 15;
    }
    
    // Performance requirements
    if (requirements.performance?.priority === 'high') {
      if (framework.performance.runtime === 'fast') score += 15;
    }
    
    // SEO requirements
    if (requirements.performance?.seo) {
      if (framework.category === 'fullstack' || framework.features.includes('Server-side rendering')) {
        score += 20;
      }
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  private generateReasoning(
    framework: Framework, 
    requirements: ProjectRequirements,
    scores: Record<string, number>
  ): string {
    const reasons: string[] = [];
    
    if (requirements.explicitFramework === framework.id) {
      reasons.push(`You explicitly requested ${framework.name}`);
    }
    
    if (scores.projectFit > 70) {
      reasons.push(`${framework.name} is well-suited for ${requirements.projectType || 'this type of project'}`);
    }
    
    if (scores.performance > 75) {
      reasons.push(`Excellent performance characteristics with ${framework.performance.runtime} runtime`);
    }
    
    if (scores.learningCurve > 75) {
      reasons.push(`${framework.learningCurve} learning curve makes it accessible`);
    }
    
    if (scores.ecosystem > 75) {
      reasons.push(`Rich ecosystem with extensive third-party libraries`);
    }
    
    if (framework.enterpriseSupport && requirements.team?.size === 'large') {
      reasons.push(`Enterprise support available for large team projects`);
    }
    
    return reasons.join('. ') || `${framework.name} provides a solid foundation for your project requirements`;
  }
  
  private generatePros(framework: Framework, requirements: ProjectRequirements): string[] {
    const pros: string[] = [...framework.strengths];
    
    // Add context-specific pros
    if (requirements.performance?.priority === 'high' && framework.performance.runtime === 'fast') {
      pros.push('High-performance runtime optimized for your needs');
    }
    
    if (requirements.team?.experience === 'beginner' && framework.learningCurve === 'easy') {
      pros.push('Beginner-friendly with gentle learning curve');
    }
    
    return pros.slice(0, 5); // Limit to top 5
  }
  
  private generateCons(framework: Framework, requirements: ProjectRequirements): string[] {
    const cons: string[] = [...framework.weaknesses];
    
    // Add context-specific cons
    if (requirements.timeline === 'urgent' && framework.learningCurve === 'steep') {
      cons.push('May slow development due to learning curve given urgent timeline');
    }
    
    if (requirements.maintenance === 'minimal' && framework.ecosystem.stateManagement.length > 3) {
      cons.push('Complex ecosystem may require ongoing maintenance');
    }
    
    return cons.slice(0, 4); // Limit to top 4
  }
  
  private calculateConfidence(score: number, requirements: ProjectRequirements): 'low' | 'medium' | 'high' {
    let confidence = 0.5;
    
    // Higher confidence with explicit framework choice
    if (requirements.explicitFramework) confidence += 0.3;
    
    // Higher confidence with clear project type
    if (requirements.projectType) confidence += 0.2;
    
    // Higher confidence with high score
    if (score > 75) confidence += 0.2;
    else if (score < 40) confidence -= 0.2;
    
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }
  
  private generateAlternatives(_framework: Framework, _requirements: ProjectRequirements): Array<{ framework: Framework; reason: string }> {
    // This would typically involve scoring other frameworks
    // For now, return empty array - this would be implemented with the full framework list
    return [];
  }
}