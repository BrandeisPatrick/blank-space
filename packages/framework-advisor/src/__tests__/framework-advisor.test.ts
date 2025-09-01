import { FrameworkAdvisor } from '../analyzers/framework-advisor';
import { PromptAnalyzer } from '../analyzers/prompt-analyzer';
import { ScoringEngine } from '../analyzers/scoring-engine';
import { FRAMEWORKS } from '../utils/frameworks';

describe('FrameworkAdvisor', () => {
  let advisor: FrameworkAdvisor;

  beforeEach(() => {
    advisor = new FrameworkAdvisor();
  });

  describe('recommendFromPrompt', () => {
    it('should recommend React for React-specific prompts', async () => {
      const recommendation = await advisor.recommendFromPrompt(
        'I want to build a React application with hooks and components'
      );

      expect(recommendation.primary.framework.id).toBe('react');
      expect(recommendation.primary.score).toBeGreaterThan(80);
    });

    it('should recommend Vue for Vue-specific prompts', async () => {
      const recommendation = await advisor.recommendFromPrompt(
        'Build a Vue.js app with templates and reactive data'
      );

      expect(recommendation.primary.framework.id).toBe('vue');
      expect(recommendation.primary.score).toBeGreaterThan(70);
    });

    it('should recommend Next.js for SEO-critical projects', async () => {
      const recommendation = await advisor.recommendFromPrompt(
        'I need to build an e-commerce site with great SEO and server-side rendering'
      );

      expect(['nextjs', 'react'].includes(recommendation.primary.framework.id)).toBe(true);
    });

    it('should recommend simpler frameworks for beginners', async () => {
      const recommendation = await advisor.recommendFromPrompt(
        'I am a beginner developer who wants to build a simple portfolio website'
      );

      expect(['vue', 'vanilla'].includes(recommendation.primary.framework.id)).toBe(true);
    });
  });

  describe('compareFrameworks', () => {
    it('should compare multiple frameworks', async () => {
      const comparison = await advisor.compareFrameworks(
        ['react', 'vue', 'angular'],
        {
          description: 'Build a medium complexity web application',
          projectType: 'web-app',
          complexity: 'medium'
        }
      );

      expect(comparison.primary).toBeDefined();
      expect(comparison.alternatives).toHaveLength(2);
      expect(comparison.summary).toContain('comparison');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid framework comparison', async () => {
      await expect(
        advisor.compareFrameworks(['invalid-framework'], {
          description: 'test'
        })
      ).rejects.toThrow();
    });
  });
});

describe('PromptAnalyzer', () => {
  let analyzer: PromptAnalyzer;

  beforeEach(() => {
    analyzer = new PromptAnalyzer();
  });

  it('should detect explicit framework mentions', () => {
    const analysis = analyzer.analyze('I want to use React for my project');
    expect(analysis.explicitFramework).toBe('react');
  });

  it('should detect implicit framework cues', () => {
    const analysis = analyzer.analyze('I need hooks and JSX components');
    expect(analysis.implicitFramework).toBe('react');
  });

  it('should detect project types', () => {
    const analysis = analyzer.analyze('Build an e-commerce store');
    expect(analysis.projectType).toBe('e-commerce');
  });

  it('should extract requirements', () => {
    const analysis = analyzer.analyze('Need SEO optimization and mobile responsiveness');
    expect(analysis.requirements).toContain('SEO optimization');
    expect(analysis.requirements).toContain('Mobile responsiveness');
  });

  it('should determine complexity', () => {
    const simpleAnalysis = analyzer.analyze('Build a simple landing page');
    expect(simpleAnalysis.complexity).toBe('simple');

    const complexAnalysis = analyzer.analyze('Build a complex enterprise application with microservices');
    expect(complexAnalysis.complexity).toBe('complex');
  });
});

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;

  beforeEach(() => {
    scoringEngine = new ScoringEngine();
  });

  it('should score React highly for React projects', () => {
    const reactFramework = FRAMEWORKS.find(f => f.id === 'react')!;
    const result = scoringEngine.scoreFramework(reactFramework, {
      description: 'Build a React application',
      explicitFramework: 'react'
    });

    expect(result.score).toBeGreaterThan(90);
  });

  it('should score based on performance requirements', () => {
    const svelteFramework = FRAMEWORKS.find(f => f.id === 'svelte')!;
    const result = scoringEngine.scoreFramework(svelteFramework, {
      description: 'High performance application',
      performance: { priority: 'high' }
    });

    expect(result.score).toBeGreaterThan(60);
  });

  it('should penalize complex frameworks for beginners', () => {
    const angularFramework = FRAMEWORKS.find(f => f.id === 'angular')!;
    const result = scoringEngine.scoreFramework(angularFramework, {
      description: 'Simple project for beginner',
      team: { experience: 'beginner' },
      complexity: 'simple'
    });

    expect(result.score).toBeLessThan(70);
  });

  it('should provide reasoning for scores', () => {
    const reactFramework = FRAMEWORKS.find(f => f.id === 'react')!;
    const result = scoringEngine.scoreFramework(reactFramework, {
      description: 'Build a web application',
      projectType: 'web-app'
    });

    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('should provide pros and cons', () => {
    const vueFramework = FRAMEWORKS.find(f => f.id === 'vue')!;
    const result = scoringEngine.scoreFramework(vueFramework, {
      description: 'Build a web application'
    });

    expect(result.pros.length).toBeGreaterThan(0);
    expect(result.cons.length).toBeGreaterThan(0);
  });
});

describe('Framework Database', () => {
  it('should contain all expected frameworks', () => {
    const expectedFrameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'vanilla'];
    
    expectedFrameworks.forEach(frameworkId => {
      const framework = FRAMEWORKS.find(f => f.id === frameworkId);
      expect(framework).toBeDefined();
      expect(framework?.name).toBeDefined();
      expect(framework?.strengths.length).toBeGreaterThan(0);
      expect(framework?.bestFor.length).toBeGreaterThan(0);
    });
  });

  it('should have valid framework data structure', () => {
    FRAMEWORKS.forEach(framework => {
      expect(framework.id).toBeDefined();
      expect(framework.name).toBeDefined();
      expect(framework.category).toMatch(/^(frontend|fullstack|backend|mobile|desktop)$/);
      expect(framework.type).toMatch(/^(library|framework|meta-framework)$/);
      expect(framework.learningCurve).toMatch(/^(easy|moderate|steep)$/);
      expect(framework.performance).toBeDefined();
      expect(framework.strengths).toBeInstanceOf(Array);
      expect(framework.weaknesses).toBeInstanceOf(Array);
      expect(framework.ecosystem).toBeDefined();
    });
  });
});