import { AgentManager } from '../core/AgentManager';
import { ContextManager } from '../core/ContextManager';
import { Workflow, WorkflowStep, AgentContext } from '../types';

/**
 * Example multi-agent workflows demonstrating complex task orchestration
 * These workflows show how different agents can work together to accomplish sophisticated tasks
 */

/**
 * E-Commerce Website Creation Workflow
 * 
 * This workflow demonstrates building a complete e-commerce site by:
 * 1. Understanding user requirements
 * 2. Recommending appropriate technology stack
 * 3. Generating the website code
 * 4. Reviewing code quality
 * 5. Creating comprehensive documentation
 */
export const createECommerceWorkflow = (userRequest: string): Workflow => ({
  id: 'ecommerce-website-creation',
  name: 'E-Commerce Website Creation',
  description: 'Complete workflow to build an e-commerce website from requirements to documentation',
  timeout: 600000, // 10 minutes
  retries: 1,
  steps: [
    {
      id: 'analyze-intent',
      agentId: 'intent-classification',
      input: {
        message: userRequest,
        hasActiveCode: false,
        responseMode: 'explain-first'
      },
      onSuccess: 'framework-recommendation',
      timeout: 15000
    },
    {
      id: 'framework-recommendation',
      agentId: 'framework-advisor',
      input: {
        prompt: '${analyze-intent}', // Will be resolved from previous step
        requirements: {
          projectType: 'e-commerce',
          complexity: 'medium',
          performance: {
            priority: 'high',
            seo: true,
            ssr: true
          },
          features: ['shopping-cart', 'user-authentication', 'payment-processing', 'product-catalog']
        },
        maxAlternatives: 2
      },
      onSuccess: 'generate-website',
      timeout: 45000
    },
    {
      id: 'generate-website',
      agentId: 'website-generation',
      input: {
        prompt: 'Create an e-commerce website based on the framework recommendation from the previous step: ${framework-recommendation}',
        device: 'desktop',
        framework: 'react', // This could be dynamic based on framework recommendation
        context: 'E-commerce site with product catalog, shopping cart, and user authentication'
      },
      onSuccess: 'review-code',
      timeout: 60000
    },
    {
      id: 'review-code',
      agentId: 'code-review',
      input: {
        code: '${generate-website.html}${generate-website.css}${generate-website.js}',
        language: 'javascript',
        context: {
          purpose: 'E-commerce website with security and performance requirements',
          framework: '${framework-recommendation.primary.framework.name}',
          environment: 'production',
          codeStandards: ['security-best-practices', 'performance-optimization', 'accessibility-compliance']
        },
        reviewType: 'thorough'
      },
      onSuccess: 'create-documentation',
      timeout: 60000
    },
    {
      id: 'create-documentation',
      agentId: 'documentation',
      input: {
        projectInfo: {
          name: 'E-Commerce Website',
          description: 'Modern e-commerce website with shopping cart and user authentication',
          version: '1.0.0'
        },
        codebase: {
          technologies: ['${framework-recommendation.primary.framework.name}', 'HTML', 'CSS', 'JavaScript'],
          framework: '${framework-recommendation.primary.framework.name}'
        },
        documentationType: 'readme',
        audience: 'mixed',
        includeCodeExamples: true
      },
      onSuccess: 'user-communication',
      timeout: 90000
    },
    {
      id: 'user-communication',
      agentId: 'chat-assistant',
      input: {
        message: 'Provide a summary of the completed e-commerce website project including framework choice, code quality, and next steps',
        context: {
          hasActiveCode: true,
          responseMode: 'explain-first'
        }
      },
      timeout: 30000
    }
  ]
});

/**
 * Code Quality Improvement Workflow
 * 
 * This workflow takes existing code and improves it through:
 * 1. Comprehensive code review
 * 2. Generating improved version based on issues found
 * 3. Documentation of changes made
 * 4. Final quality validation
 */
export const createCodeQualityWorkflow = (
  code: string, 
  language: string, 
  projectName: string
): Workflow => ({
  id: 'code-quality-improvement',
  name: 'Code Quality Improvement',
  description: 'Analyze and improve code quality with documentation',
  timeout: 300000, // 5 minutes
  retries: 1,
  steps: [
    {
      id: 'initial-review',
      agentId: 'code-review',
      input: {
        code,
        language,
        reviewType: 'thorough',
        includeSuggestions: true,
        context: {
          purpose: 'Code quality improvement and optimization',
          environment: 'production'
        }
      },
      onSuccess: 'security-review',
      timeout: 60000
    },
    {
      id: 'security-review',
      agentId: 'code-review',
      input: {
        code,
        language,
        reviewType: 'security-focused',
        context: {
          codeStandards: [
            'OWASP security guidelines',
            'Input validation',
            'XSS prevention',
            'Authentication security'
          ]
        }
      },
      onSuccess: 'performance-review',
      timeout: 60000
    },
    {
      id: 'performance-review', 
      agentId: 'code-review',
      input: {
        code,
        language,
        reviewType: 'performance-focused',
        context: {
          codeStandards: [
            'Performance optimization',
            'Memory efficiency',
            'Algorithm optimization'
          ]
        }
      },
      onSuccess: 'generate-changelog',
      timeout: 60000
    },
    {
      id: 'generate-changelog',
      agentId: 'documentation',
      input: {
        projectInfo: {
          name: projectName,
          description: 'Code quality improvements and optimizations',
          version: '1.1.0'
        },
        codebase: {
          technologies: [language],
        },
        documentationType: 'changelog',
        audience: 'developers'
      },
      onSuccess: 'improvement-summary',
      timeout: 60000
    },
    {
      id: 'improvement-summary',
      agentId: 'chat-assistant',
      input: {
        message: `Summarize the code quality improvements made. Original score: \${initial-review.overallScore}, Security score: \${security-review.securityScore}, Performance score: \${performance-review.performanceScore}`,
        context: {
          hasActiveCode: true,
          responseMode: 'explain-first'
        }
      },
      timeout: 30000
    }
  ]
});

/**
 * Complete Project Setup Workflow
 * 
 * This workflow creates a complete project from scratch:
 * 1. Analyzes user requirements
 * 2. Recommends technology stack
 * 3. Generates project structure and code
 * 4. Creates comprehensive documentation
 * 5. Reviews everything for quality
 * 6. Provides deployment guidance
 */
export const createCompleteProjectWorkflow = (projectDescription: string): Workflow => ({
  id: 'complete-project-setup',
  name: 'Complete Project Setup',
  description: 'End-to-end project creation from requirements to deployment-ready code',
  timeout: 900000, // 15 minutes
  retries: 1,
  steps: [
    {
      id: 'requirements-analysis',
      agentId: 'workflow-orchestration',
      input: {
        request: projectDescription,
        executeWorkflow: false, // Just plan, don't execute
        maxSteps: 8
      },
      onSuccess: 'intent-analysis',
      timeout: 120000
    },
    {
      id: 'intent-analysis',
      agentId: 'intent-classification',
      input: {
        message: projectDescription,
        responseMode: 'show-options'
      },
      onSuccess: 'framework-selection',
      timeout: 15000
    },
    {
      id: 'framework-selection',
      agentId: 'framework-advisor',
      input: {
        prompt: projectDescription,
        maxAlternatives: 3
      },
      onSuccess: 'code-generation',
      timeout: 45000
    },
    {
      id: 'code-generation',
      agentId: 'website-generation',
      input: {
        prompt: `${projectDescription} using \${framework-selection.primary.framework.name}`,
        framework: '${framework-selection.primary.framework.id}',
        device: 'desktop'
      },
      onSuccess: 'quality-review',
      timeout: 60000
    },
    {
      id: 'quality-review',
      agentId: 'code-review',
      input: {
        code: '${code-generation.html}${code-generation.css}${code-generation.js}',
        language: 'javascript',
        reviewType: 'thorough',
        context: {
          framework: '${framework-selection.primary.framework.name}',
          purpose: projectDescription
        }
      },
      onSuccess: 'readme-generation',
      timeout: 60000
    },
    {
      id: 'readme-generation',
      agentId: 'documentation',
      input: {
        projectInfo: {
          name: 'Generated Project',
          description: projectDescription,
          version: '1.0.0'
        },
        codebase: {
          technologies: ['${framework-selection.primary.framework.name}', 'HTML', 'CSS', 'JavaScript'],
          framework: '${framework-selection.primary.framework.name}'
        },
        documentationType: 'readme',
        audience: 'mixed'
      },
      onSuccess: 'deployment-guide',
      timeout: 90000
    },
    {
      id: 'deployment-guide',
      agentId: 'documentation',
      input: {
        projectInfo: {
          name: 'Generated Project',
          description: projectDescription,
          version: '1.0.0'
        },
        codebase: {
          technologies: ['${framework-selection.primary.framework.name}'],
          framework: '${framework-selection.primary.framework.name}'
        },
        documentationType: 'deployment-guide',
        audience: 'developers'
      },
      onSuccess: 'project-summary',
      timeout: 90000
    },
    {
      id: 'project-summary',
      agentId: 'chat-assistant',
      input: {
        message: `Provide a comprehensive project summary including framework choice (\${framework-selection.primary.framework.name}), code quality score (\${quality-review.overallScore}), and next steps for deployment`,
        context: {
          hasActiveCode: true,
          responseMode: 'explain-first'
        }
      },
      timeout: 30000
    }
  ]
});

/**
 * Portfolio Website Workflow
 * 
 * Specialized workflow for creating portfolio websites:
 * 1. Understands portfolio requirements
 * 2. Selects appropriate design framework
 * 3. Generates portfolio structure
 * 4. Reviews for accessibility and performance
 * 5. Creates user guide for content management
 */
export const createPortfolioWorkflow = (
  profession: string, 
  sections: string[], 
  style: string
): Workflow => ({
  id: 'portfolio-website-creation',
  name: 'Portfolio Website Creation',
  description: 'Create a professional portfolio website with optimal design and performance',
  timeout: 450000, // 7.5 minutes
  retries: 1,
  steps: [
    {
      id: 'portfolio-planning',
      agentId: 'workflow-orchestration',
      input: {
        request: `Create a ${profession} portfolio website with sections: ${sections.join(', ')}. Style: ${style}`,
        context: {
          projectScope: 'medium',
          userExperience: 'intermediate'
        },
        executeWorkflow: false
      },
      onSuccess: 'framework-recommendation',
      timeout: 120000
    },
    {
      id: 'framework-recommendation',
      agentId: 'framework-advisor',
      input: {
        prompt: `Recommend framework for a ${profession} portfolio website. Requirements: ${style} design, ${sections.join(', ')} sections, SEO-optimized, fast loading`,
        requirements: {
          projectType: 'portfolio',
          complexity: 'medium',
          performance: {
            priority: 'high',
            seo: true
          },
          features: sections
        }
      },
      onSuccess: 'generate-portfolio',
      timeout: 45000
    },
    {
      id: 'generate-portfolio',
      agentId: 'website-generation',
      input: {
        prompt: `Create a ${profession} portfolio website with ${style} design. Include sections: ${sections.join(', ')}. Make it responsive and professional.`,
        framework: '${framework-recommendation.primary.framework.id}',
        device: 'desktop'
      },
      onSuccess: 'accessibility-review',
      timeout: 60000
    },
    {
      id: 'accessibility-review',
      agentId: 'code-review',
      input: {
        code: '${generate-portfolio.html}${generate-portfolio.css}',
        language: 'html',
        context: {
          purpose: 'Portfolio website requiring high accessibility standards',
          codeStandards: [
            'WCAG 2.1 guidelines',
            'ARIA best practices',
            'Semantic HTML',
            'Color contrast compliance'
          ]
        },
        reviewType: 'thorough'
      },
      onSuccess: 'user-guide',
      timeout: 60000
    },
    {
      id: 'user-guide',
      agentId: 'documentation',
      input: {
        projectInfo: {
          name: `${profession} Portfolio`,
          description: `Professional portfolio website for ${profession}`,
          version: '1.0.0'
        },
        codebase: {
          technologies: ['${framework-recommendation.primary.framework.name}', 'HTML', 'CSS'],
          framework: '${framework-recommendation.primary.framework.name}'
        },
        documentationType: 'user-guide',
        audience: 'end-users'
      },
      onSuccess: 'launch-guidance',
      timeout: 90000
    },
    {
      id: 'launch-guidance',
      agentId: 'chat-assistant',
      input: {
        message: `Provide launch guidance for the ${profession} portfolio website. Include SEO tips, hosting recommendations, and content update strategies. Accessibility score: \${accessibility-review.overallScore}`,
        context: {
          hasActiveCode: true,
          responseMode: 'show-options'
        }
      },
      timeout: 30000
    }
  ]
});

/**
 * Utility class for managing and executing example workflows
 */
export class ExampleWorkflowManager {
  constructor(
    private agentManager: AgentManager,
    private contextManager: ContextManager
  ) {}

  /**
   * Execute the e-commerce workflow with progress tracking
   */
  async executeECommerceWorkflow(
    userRequest: string,
    userId?: string,
    progressCallback?: (step: string, progress: number) => void
  ) {
    const workflow = createECommerceWorkflow(userRequest);
    const context = await this.contextManager.createContext(undefined, {
      workflowType: 'ecommerce',
      userId,
      startTime: new Date()
    });

    // Set up progress tracking
    if (progressCallback) {
      this.setupProgressTracking(workflow, progressCallback);
    }

    return await this.agentManager.executeWorkflow(workflow, {}, context);
  }

  /**
   * Execute code quality improvement workflow
   */
  async executeCodeQualityWorkflow(
    code: string,
    language: string,
    projectName: string,
    progressCallback?: (step: string, progress: number) => void
  ) {
    const workflow = createCodeQualityWorkflow(code, language, projectName);
    const context = await this.contextManager.createContext(undefined, {
      workflowType: 'code-quality',
      originalCode: code,
      language,
      startTime: new Date()
    });

    if (progressCallback) {
      this.setupProgressTracking(workflow, progressCallback);
    }

    return await this.agentManager.executeWorkflow(workflow, { code, language }, context);
  }

  /**
   * Execute complete project setup workflow
   */
  async executeCompleteProjectWorkflow(
    projectDescription: string,
    progressCallback?: (step: string, progress: number) => void
  ) {
    const workflow = createCompleteProjectWorkflow(projectDescription);
    const context = await this.contextManager.createContext(undefined, {
      workflowType: 'complete-project',
      description: projectDescription,
      startTime: new Date()
    });

    if (progressCallback) {
      this.setupProgressTracking(workflow, progressCallback);
    }

    return await this.agentManager.executeWorkflow(workflow, {}, context);
  }

  /**
   * Execute portfolio creation workflow
   */
  async executePortfolioWorkflow(
    profession: string,
    sections: string[],
    style: string,
    progressCallback?: (step: string, progress: number) => void
  ) {
    const workflow = createPortfolioWorkflow(profession, sections, style);
    const context = await this.contextManager.createContext(undefined, {
      workflowType: 'portfolio',
      profession,
      sections,
      style,
      startTime: new Date()
    });

    if (progressCallback) {
      this.setupProgressTracking(workflow, progressCallback);
    }

    return await this.agentManager.executeWorkflow(workflow, {}, context);
  }

  /**
   * Set up progress tracking for workflows
   */
  private setupProgressTracking(
    workflow: Workflow,
    callback: (step: string, progress: number) => void
  ) {
    const totalSteps = workflow.steps.length;
    let completedSteps = 0;

    this.agentManager.on('workflow.step.started', (event) => {
      if (event.workflowId === workflow.id) {
        callback(event.stepId || 'Unknown Step', Math.round((completedSteps / totalSteps) * 100));
      }
    });

    this.agentManager.on('workflow.step.completed', (event) => {
      if (event.workflowId === workflow.id) {
        completedSteps++;
        callback(event.stepId || 'Unknown Step', Math.round((completedSteps / totalSteps) * 100));
      }
    });
  }

  /**
   * Get available workflow templates
   */
  getAvailableWorkflows(): Array<{
    id: string;
    name: string;
    description: string;
    estimatedTime: string;
    complexity: 'simple' | 'medium' | 'complex';
  }> {
    return [
      {
        id: 'ecommerce-website-creation',
        name: 'E-Commerce Website Creation',
        description: 'Complete e-commerce website with framework selection, code generation, quality review, and documentation',
        estimatedTime: '8-12 minutes',
        complexity: 'complex'
      },
      {
        id: 'code-quality-improvement',
        name: 'Code Quality Improvement',
        description: 'Comprehensive code review with security, performance analysis and improvement suggestions',
        estimatedTime: '4-6 minutes',
        complexity: 'medium'
      },
      {
        id: 'complete-project-setup',
        name: 'Complete Project Setup',
        description: 'End-to-end project creation from requirements analysis to deployment-ready code',
        estimatedTime: '12-18 minutes',
        complexity: 'complex'
      },
      {
        id: 'portfolio-website-creation',
        name: 'Portfolio Website Creation',
        description: 'Professional portfolio website with accessibility review and user guide',
        estimatedTime: '6-8 minutes',
        complexity: 'medium'
      }
    ];
  }
}