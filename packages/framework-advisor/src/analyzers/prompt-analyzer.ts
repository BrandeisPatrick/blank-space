import { PromptAnalysis } from '../types';

interface FrameworkKeywords {
  [key: string]: {
    explicit: string[];
    implicit: string[];
    strength: number;
  };
}

const FRAMEWORK_KEYWORDS: FrameworkKeywords = {
  react: {
    explicit: ['react', 'react.js', 'reactjs'],
    implicit: ['jsx', 'hooks', 'component', 'virtual dom', 'state management', 'redux', 'next.js', 'gatsby'],
    strength: 0.9
  },
  vue: {
    explicit: ['vue', 'vue.js', 'vuejs'],
    implicit: ['template', 'directive', 'reactive', 'composition api', 'nuxt', 'vuex'],
    strength: 0.8
  },
  angular: {
    explicit: ['angular', 'angularjs'],
    implicit: ['typescript', 'dependency injection', 'rxjs', 'observable', 'decorator'],
    strength: 0.8
  },
  svelte: {
    explicit: ['svelte', 'sveltekit'],
    implicit: ['reactive programming', 'compile time', 'no virtual dom'],
    strength: 0.9
  },
  nextjs: {
    explicit: ['next.js', 'nextjs', 'next'],
    implicit: ['ssr', 'server side rendering', 'static generation', 'ssg'],
    strength: 0.8
  },
  vanilla: {
    explicit: ['vanilla', 'vanilla javascript', 'plain javascript'],
    implicit: ['no framework', 'lightweight', 'minimal', 'simple'],
    strength: 0.7
  }
};

const PROJECT_TYPE_KEYWORDS = {
  'landing-page': ['landing', 'marketing', 'promotional', 'static'],
  'web-app': ['application', 'app', 'interactive', 'dynamic'],
  'dashboard': ['dashboard', 'admin', 'analytics', 'data visualization'],
  'e-commerce': ['shop', 'store', 'ecommerce', 'cart', 'payment'],
  'blog': ['blog', 'cms', 'content', 'articles'],
  'portfolio': ['portfolio', 'showcase', 'personal site'],
  'api': ['api', 'backend', 'server', 'endpoint']
};

const COMPLEXITY_KEYWORDS = {
  simple: ['simple', 'basic', 'minimal', 'quick', 'small'],
  medium: ['medium', 'moderate', 'standard', 'typical'],
  complex: ['complex', 'advanced', 'large', 'enterprise', 'scalable']
};

const REQUIREMENT_PATTERNS = [
  { pattern: /seo|search engine optimization/i, requirement: 'SEO optimization' },
  { pattern: /mobile|responsive/i, requirement: 'Mobile responsiveness' },
  { pattern: /performance|fast|speed/i, requirement: 'High performance' },
  { pattern: /real.?time|websocket/i, requirement: 'Real-time features' },
  { pattern: /auth|login|user/i, requirement: 'User authentication' },
  { pattern: /database|data|crud/i, requirement: 'Data management' },
  { pattern: /api|backend|server/i, requirement: 'Backend integration' },
  { pattern: /test|testing/i, requirement: 'Testing capabilities' },
  { pattern: /deployment|hosting/i, requirement: 'Deployment considerations' },
  { pattern: /team|collaboration/i, requirement: 'Team collaboration' }
];

const CONSTRAINT_PATTERNS = [
  { pattern: /budget|cheap|free/i, constraint: 'Budget constraints' },
  { pattern: /time|deadline|urgent/i, constraint: 'Time constraints' },
  { pattern: /beginner|new to|learning/i, constraint: 'Learning curve' },
  { pattern: /maintenance|support/i, constraint: 'Long-term maintenance' },
  { pattern: /legacy|existing|migration/i, constraint: 'Legacy system integration' }
];

export class PromptAnalyzer {
  analyze(prompt: string): PromptAnalysis {
    const normalizedPrompt = prompt.toLowerCase();
    
    const explicitFramework = this.findExplicitFramework(normalizedPrompt);
    const implicitFramework = this.findImplicitFramework(normalizedPrompt);
    const projectType = this.findProjectType(normalizedPrompt);
    const complexity = this.findComplexity(normalizedPrompt);
    const keyTerms = this.extractKeyTerms(prompt);
    const requirements = this.extractRequirements(normalizedPrompt);
    const constraints = this.extractConstraints(normalizedPrompt);
    
    // Calculate confidence based on available information
    let confidence = 0.5; // Base confidence
    
    if (explicitFramework) confidence += 0.4;
    if (implicitFramework) confidence += 0.2;
    if (projectType) confidence += 0.1;
    if (complexity) confidence += 0.1;
    if (requirements.length > 0) confidence += 0.1;
    
    confidence = Math.min(confidence, 1.0);
    
    return {
      explicitFramework,
      implicitFramework,
      projectType,
      complexity,
      keyTerms,
      requirements,
      constraints,
      confidence
    };
  }
  
  private findExplicitFramework(prompt: string): string | undefined {
    for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
      for (const keyword of keywords.explicit) {
        if (prompt.includes(keyword)) {
          return framework;
        }
      }
    }
    return undefined;
  }
  
  private findImplicitFramework(prompt: string): string | undefined {
    const frameworkScores: Record<string, number> = {};
    
    for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords.implicit) {
        if (prompt.includes(keyword)) {
          score += keywords.strength;
        }
      }
      if (score > 0) {
        frameworkScores[framework] = score;
      }
    }
    
    // Return framework with highest score if above threshold
    const topFramework = Object.entries(frameworkScores)
      .sort(([, a], [, b]) => b - a)[0];
    
    return topFramework && topFramework[1] > 0.5 ? topFramework[0] : undefined;
  }
  
  private findProjectType(prompt: string): string | undefined {
    for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          return type;
        }
      }
    }
    return undefined;
  }
  
  private findComplexity(prompt: string): 'simple' | 'medium' | 'complex' | undefined {
    for (const [complexity, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          return complexity as 'simple' | 'medium' | 'complex';
        }
      }
    }
    
    // Infer complexity from prompt length and technical terms
    const technicalTerms = [
      'microservices', 'scalability', 'performance', 'optimization',
      'database', 'api', 'authentication', 'authorization', 'testing',
      'deployment', 'ci/cd', 'monitoring', 'logging'
    ];
    
    const technicalTermCount = technicalTerms.filter(term => 
      prompt.includes(term)
    ).length;
    
    if (prompt.length < 50 && technicalTermCount === 0) return 'simple';
    if (prompt.length > 200 || technicalTermCount > 3) return 'complex';
    
    return 'medium';
  }
  
  private extractKeyTerms(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Common technical terms that might be relevant
    const technicalTerms = [
      'react', 'vue', 'angular', 'svelte', 'javascript', 'typescript',
      'component', 'responsive', 'mobile', 'performance', 'seo',
      'database', 'api', 'authentication', 'testing', 'deployment'
    ];
    
    return words.filter(word => technicalTerms.includes(word));
  }
  
  private extractRequirements(prompt: string): string[] {
    const requirements: string[] = [];
    
    for (const { pattern, requirement } of REQUIREMENT_PATTERNS) {
      if (pattern.test(prompt)) {
        requirements.push(requirement);
      }
    }
    
    return requirements;
  }
  
  private extractConstraints(prompt: string): string[] {
    const constraints: string[] = [];
    
    for (const { pattern, constraint } of CONSTRAINT_PATTERNS) {
      if (pattern.test(prompt)) {
        constraints.push(constraint);
      }
    }
    
    return constraints;
  }
}