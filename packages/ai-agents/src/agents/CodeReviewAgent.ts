import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider
} from '../types';

// Input/Output schemas
const CodeReviewInputSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.enum(['html', 'css', 'javascript', 'typescript', 'jsx', 'tsx', 'json', 'markdown']),
  context: z.object({
    purpose: z.string().optional(), // What this code is supposed to do
    framework: z.string().optional(), // React, Vue, etc.
    environment: z.enum(['development', 'staging', 'production']).optional(),
    codeStandards: z.array(z.string()).optional(), // Specific standards to check
  }).optional(),
  reviewType: z.enum(['quick', 'thorough', 'security-focused', 'performance-focused']).default('thorough'),
  includeSuggestions: z.boolean().default(true),
});

const CodeIssueSchema = z.object({
  type: z.enum(['error', 'warning', 'suggestion', 'info']),
  category: z.enum([
    'syntax', 'logic', 'performance', 'security', 'accessibility', 
    'maintainability', 'best-practices', 'documentation', 'testing'
  ]),
  line: z.number().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  confidence: z.number().min(0).max(1),
});

const CodeReviewOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  issues: z.array(CodeIssueSchema),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  metrics: z.object({
    linesOfCode: z.number(),
    complexity: z.enum(['low', 'medium', 'high']),
    maintainabilityScore: z.number().min(0).max(100),
    securityScore: z.number().min(0).max(100),
    performanceScore: z.number().min(0).max(100),
  }),
  improvedCode: z.string().optional(),
});

export type CodeReviewInput = z.infer<typeof CodeReviewInputSchema>;
export type CodeReviewOutput = z.infer<typeof CodeReviewOutputSchema>;

export class CodeReviewAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'code-review',
      name: 'Code Review Agent',
      description: 'Analyzes code for quality, security, performance, and best practices',
      version: '1.0.0',
      enabled: true,
      priority: 11,
      timeout: 60000, // 1 minute
      retries: 2,
      dependencies: [],
      capabilities: [
        'code-analysis',
        'security-scanning',
        'performance-analysis',
        'best-practices-checking',
        'accessibility-review',
        'code-improvement',
        'documentation-analysis'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<CodeReviewOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Perform code review analysis
      const result = await this.performCodeReview(validatedInput, context);
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      CodeReviewInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return CodeReviewInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return CodeReviewOutputSchema;
  }

  private async performCodeReview(
    input: CodeReviewInput,
    context?: AgentContext
  ): Promise<CodeReviewOutput> {
    const systemPrompt = this.createCodeReviewPrompt(input, context);
    
    // Use JSON generation for structured review output
    const result = await this.generateJSON(
      systemPrompt,
      CodeReviewOutputSchema,
      {
        temperature: 0.3, // Lower temperature for consistent analysis
        maxTokens: 3500,
      },
      context
    );

    return result;
  }

  private createCodeReviewPrompt(
    input: CodeReviewInput,
    context?: AgentContext
  ): string {
    const { code, language, context: codeContext, reviewType, includeSuggestions } = input;

    const basePrompt = `You are a senior software engineer and code reviewer with 15+ years of experience. Perform a comprehensive code review focusing on quality, security, performance, and best practices.

**Review Guidelines:**

**Quality Criteria:**
1. **Syntax & Logic**: Correct syntax, logical flow, error handling
2. **Performance**: Efficient algorithms, minimal DOM manipulation, optimized queries
3. **Security**: Input validation, XSS prevention, secure coding practices  
4. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
5. **Maintainability**: Clean code, proper naming, modularity
6. **Best Practices**: Framework conventions, coding standards, documentation

**Issue Severity Levels:**
- **critical**: Security vulnerabilities, breaking errors
- **high**: Performance issues, accessibility violations
- **medium**: Maintainability concerns, minor bugs
- **low**: Style preferences, minor optimizations

**Review Type:** ${reviewType}
${reviewType === 'security-focused' ? '- Focus heavily on security vulnerabilities and input validation' : ''}
${reviewType === 'performance-focused' ? '- Prioritize performance optimization and efficiency' : ''}
${reviewType === 'quick' ? '- Focus on critical issues and obvious improvements' : ''}
${reviewType === 'thorough' ? '- Comprehensive analysis of all aspects' : ''}

**Language:** ${language}
**Framework:** ${codeContext?.framework || 'Not specified'}
**Environment:** ${codeContext?.environment || 'Not specified'}
**Purpose:** ${codeContext?.purpose || 'Not specified'}

${codeContext?.codeStandards ? `**Specific Standards to Check:** ${codeContext.codeStandards.join(', ')}` : ''}

**Code to Review:**
\`\`\`${language}
${code}
\`\`\`

**Analysis Instructions:**
1. Count lines of code (excluding blank lines and comments)
2. Assess complexity based on nesting, conditions, loops
3. Identify all issues with line numbers where applicable
4. Provide specific, actionable suggestions
5. Calculate scores based on issue severity and frequency
6. ${includeSuggestions ? 'Include improved code version if significant issues found' : 'Focus on analysis without code rewriting'}

Return ONLY valid JSON in this exact format:
{
  "overallScore": 85,
  "summary": "Brief 2-3 sentence summary of the code quality and main findings",
  "issues": [
    {
      "type": "warning",
      "category": "performance", 
      "line": 15,
      "message": "Specific description of the issue",
      "suggestion": "How to fix or improve this",
      "severity": "medium",
      "confidence": 0.9
    }
  ],
  "strengths": [
    "What the code does well",
    "Positive aspects found"
  ],
  "recommendations": [
    "High-level recommendation 1",
    "Strategic improvement suggestion 2"
  ],
  "metrics": {
    "linesOfCode": 42,
    "complexity": "medium",
    "maintainabilityScore": 78,
    "securityScore": 92,
    "performanceScore": 85
  },
  "improvedCode": "Optional: improved version if major issues found"
}

Focus on practical, actionable feedback that helps improve code quality.`;

    return this.createSystemPrompt(basePrompt, context);
  }

  // Specialized review methods for different focus areas

  async securityReview(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<CodeReviewOutput>> {
    return this.execute({
      code,
      language,
      reviewType: 'security-focused',
      context: {
        codeStandards: [
          'OWASP security guidelines',
          'Input validation requirements',
          'XSS prevention',
          'CSRF protection',
          'Secure authentication'
        ]
      }
    }, context);
  }

  async performanceReview(
    code: string,
    language: string,
    framework?: string,
    context?: AgentContext
  ): Promise<AgentResult<CodeReviewOutput>> {
    return this.execute({
      code,
      language,
      reviewType: 'performance-focused',
      context: {
        framework,
        codeStandards: [
          'Performance optimization',
          'Bundle size minimization',
          'Efficient DOM manipulation',
          'Memory leak prevention',
          'Lazy loading strategies'
        ]
      }
    }, context);
  }

  async accessibilityReview(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<CodeReviewOutput>> {
    return this.execute({
      code,
      language,
      reviewType: 'thorough',
      context: {
        codeStandards: [
          'WCAG 2.1 guidelines',
          'ARIA best practices',
          'Keyboard navigation',
          'Screen reader compatibility',
          'Color contrast requirements',
          'Semantic HTML structure'
        ]
      }
    }, context);
  }

  async quickHealthCheck(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<{
    healthy: boolean;
    criticalIssues: number;
    score: number;
    topConcerns: string[];
  }>> {
    const reviewResult = await this.execute({
      code,
      language,
      reviewType: 'quick',
      includeSuggestions: false
    }, context);

    if (!reviewResult.success || !reviewResult.data) {
      return {
        success: false,
        error: reviewResult.error,
        metadata: { agentId: this.config.id }
      };
    }

    const criticalIssues = reviewResult.data.issues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    const topConcerns = reviewResult.data.issues
      .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
      .slice(0, 3)
      .map(issue => issue.message);

    return {
      success: true,
      data: {
        healthy: criticalIssues === 0 && reviewResult.data.overallScore >= 70,
        criticalIssues,
        score: reviewResult.data.overallScore,
        topConcerns
      },
      metadata: { agentId: this.config.id }
    };
  }

  // Batch review for multiple files
  async reviewMultipleFiles(
    files: Array<{
      name: string;
      code: string;
      language: string;
    }>,
    context?: AgentContext
  ): Promise<AgentResult<{
    overallProjectScore: number;
    fileReviews: Array<{
      filename: string;
      review: CodeReviewOutput;
    }>;
    projectSummary: {
      totalIssues: number;
      criticalIssues: number;
      codebaseHealth: 'excellent' | 'good' | 'needs-improvement' | 'poor';
      recommendations: string[];
    };
  }>> {
    const fileReviews: Array<{
      filename: string;
      review: CodeReviewOutput;
    }> = [];

    let totalScore = 0;
    let totalIssues = 0;
    let criticalIssues = 0;

    // Review each file
    for (const file of files) {
      const result = await this.execute({
        code: file.code,
        language: file.language,
        reviewType: 'thorough'
      }, context);

      if (result.success && result.data) {
        fileReviews.push({
          filename: file.name,
          review: result.data
        });

        totalScore += result.data.overallScore;
        totalIssues += result.data.issues.length;
        criticalIssues += result.data.issues.filter(
          issue => issue.severity === 'critical' || issue.severity === 'high'
        ).length;
      }
    }

    const overallProjectScore = Math.round(totalScore / files.length);
    
    let codebaseHealth: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    if (overallProjectScore >= 90) codebaseHealth = 'excellent';
    else if (overallProjectScore >= 75) codebaseHealth = 'good'; 
    else if (overallProjectScore >= 60) codebaseHealth = 'needs-improvement';
    else codebaseHealth = 'poor';

    // Generate project-level recommendations
    const recommendations: string[] = [];
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical/high severity issues immediately`);
    }
    if (overallProjectScore < 75) {
      recommendations.push('Implement code quality standards and automated linting');
    }
    if (totalIssues / files.length > 5) {
      recommendations.push('Consider refactoring to reduce complexity and improve maintainability');
    }
    recommendations.push('Set up automated code review tools and CI/CD quality gates');
    recommendations.push('Establish regular code review practices for the team');

    return {
      success: true,
      data: {
        overallProjectScore,
        fileReviews,
        projectSummary: {
          totalIssues,
          criticalIssues,
          codebaseHealth,
          recommendations
        }
      },
      metadata: { 
        agentId: this.config.id,
        filesReviewed: files.length
      }
    };
  }
}