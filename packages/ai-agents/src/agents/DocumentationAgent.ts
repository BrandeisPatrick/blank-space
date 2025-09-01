import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider
} from '../types';

// Input/Output schemas
const DocumentationInputSchema = z.object({
  projectInfo: z.object({
    name: z.string(),
    description: z.string(),
    version: z.string().optional(),
    author: z.string().optional(),
    repository: z.string().optional(),
  }),
  codebase: z.object({
    files: z.array(z.object({
      name: z.string(),
      path: z.string(),
      code: z.string(),
      language: z.string(),
    })).optional(),
    structure: z.string().optional(), // Directory tree
    technologies: z.array(z.string()),
    framework: z.string().optional(),
  }),
  documentationType: z.enum([
    'readme', 'api-docs', 'user-guide', 'developer-guide', 
    'deployment-guide', 'contributing-guide', 'changelog'
  ]),
  audience: z.enum(['end-users', 'developers', 'contributors', 'maintainers', 'mixed']),
  includeCodeExamples: z.boolean().default(true),
  includeScreenshots: z.boolean().default(false), // Placeholders for screenshots
});

const DocumentationOutputSchema = z.object({
  title: z.string(),
  content: z.string(), // Markdown content
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    subsections: z.array(z.string()).optional(),
  })),
  metadata: z.object({
    wordCount: z.number(),
    estimatedReadTime: z.string(),
    completeness: z.number().min(0).max(100),
    suggestions: z.array(z.string()),
  }),
  additionalFiles: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    purpose: z.string(),
  })).optional(),
});

export type DocumentationInput = z.infer<typeof DocumentationInputSchema>;
export type DocumentationOutput = z.infer<typeof DocumentationOutputSchema>;

export class DocumentationAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'documentation',
      name: 'Documentation Agent',
      description: 'Generates comprehensive documentation for software projects',
      version: '1.0.0',
      enabled: true,
      priority: 9,
      timeout: 90000, // 1.5 minutes
      retries: 2,
      dependencies: [],
      capabilities: [
        'readme-generation',
        'api-documentation',
        'user-guides',
        'developer-documentation',
        'deployment-guides',
        'code-analysis',
        'markdown-formatting'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<DocumentationOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Generate documentation
      const result = await this.generateDocumentation(validatedInput, context);
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      DocumentationInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return DocumentationInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return DocumentationOutputSchema;
  }

  private async generateDocumentation(
    input: DocumentationInput,
    context?: AgentContext
  ): Promise<DocumentationOutput> {
    const systemPrompt = this.createDocumentationPrompt(input, context);
    
    // Use JSON generation for structured documentation
    const result = await this.generateJSON(
      systemPrompt,
      DocumentationOutputSchema,
      {
        temperature: 0.4, // Balance creativity with consistency
        maxTokens: 4000,
      },
      context
    );

    return result;
  }

  private createDocumentationPrompt(
    input: DocumentationInput,
    context?: AgentContext
  ): string {
    const { projectInfo, codebase, documentationType, audience, includeCodeExamples } = input;

    const basePrompt = `You are a technical writer and documentation specialist. Create comprehensive, well-structured documentation that is clear, accurate, and helpful for the target audience.

**Project Information:**
- Name: ${projectInfo.name}
- Description: ${projectInfo.description}
- Version: ${projectInfo.version || 'Not specified'}
- Author: ${projectInfo.author || 'Not specified'}
- Repository: ${projectInfo.repository || 'Not specified'}

**Technology Stack:**
- Framework: ${codebase.framework || 'Not specified'}
- Technologies: ${codebase.technologies.join(', ')}
- Project Structure: ${codebase.structure || 'Not provided'}

${codebase.files && codebase.files.length > 0 ? `
**Code Files Analysis:**
${codebase.files.map(file => `
- **${file.name}** (${file.language}):
  \`\`\`${file.language}
  ${file.code.substring(0, 500)}${file.code.length > 500 ? '...' : ''}
  \`\`\`
`).join('\n')}
` : ''}

**Documentation Requirements:**
- Type: ${documentationType}
- Audience: ${audience}
- Include Code Examples: ${includeCodeExamples ? 'Yes' : 'No'}
- Include Screenshot Placeholders: ${input.includeScreenshots ? 'Yes' : 'No'}

**Documentation Standards:**

**${documentationType.toUpperCase()} Guidelines:**

${this.getDocumentationTypeGuidelines(documentationType, audience)}

**Writing Standards:**
- Use clear, concise language appropriate for ${audience}
- Include proper heading hierarchy (H1, H2, H3)
- Use code blocks with syntax highlighting
- Include tables for structured information
- Add badges for build status, version, etc. where appropriate
- Use bullet points and numbered lists for readability
- Include links to relevant resources

**Content Structure Requirements:**
- Each section should have a clear purpose and flow logically
- Include practical examples that users can follow
- Provide troubleshooting information where relevant
- Add next steps or related resources

Return ONLY valid JSON in this exact format:
{
  "title": "Documentation title",
  "content": "Complete markdown content with proper formatting, headers, code blocks, etc.",
  "sections": [
    {
      "title": "Section Name",
      "content": "Section content in markdown",
      "subsections": ["Subsection 1", "Subsection 2"]
    }
  ],
  "metadata": {
    "wordCount": 1200,
    "estimatedReadTime": "6 minutes", 
    "completeness": 85,
    "suggestions": [
      "Add screenshots for installation steps",
      "Include more code examples"
    ]
  },
  "additionalFiles": [
    {
      "filename": ".github/ISSUE_TEMPLATE.md",
      "content": "Issue template content",
      "purpose": "Standardize bug reports and feature requests"
    }
  ]
}

Create comprehensive, professional documentation that serves the target audience effectively.`;

    return this.createSystemPrompt(basePrompt, context);
  }

  private getDocumentationTypeGuidelines(
    type: string,
    audience: string
  ): string {
    switch (type) {
      case 'readme':
        return `
**README Structure:**
1. Project title with brief description
2. Key features and benefits
3. Installation instructions
4. Quick start guide with examples
5. Usage documentation
6. Configuration options
7. Contributing guidelines
8. License information
9. Support/contact information

**README Best Practices:**
- Hook readers with compelling project description
- Make installation as simple as possible
- Show working examples immediately
- Include badges (build status, version, downloads)
- Add table of contents for longer READMEs
- Include screenshots or GIFs for visual projects`;

      case 'api-docs':
        return `
**API Documentation Structure:**
1. Overview and authentication
2. Base URL and versioning
3. Endpoint listings with HTTP methods
4. Request/response schemas
5. Error codes and handling
6. Rate limiting information
7. SDK/client library examples
8. Testing and sandbox information

**API Documentation Best Practices:**
- Include complete request/response examples
- Document all possible error responses  
- Provide interactive testing capabilities
- Show examples in multiple programming languages
- Include authentication examples
- Document rate limits and quotas`;

      case 'user-guide':
        return `
**User Guide Structure:**
1. Getting started tutorial
2. Core features walkthrough
3. Step-by-step instructions
4. Common use cases and workflows
5. Troubleshooting section
6. FAQ
7. Advanced features
8. Tips and best practices

**User Guide Best Practices:**
- Start with simplest use case
- Use task-oriented organization
- Include lots of screenshots/visuals
- Provide context for each step
- Anticipate user questions
- Include "what if" scenarios`;

      case 'developer-guide':
        return `
**Developer Guide Structure:**
1. Development environment setup
2. Architecture overview
3. Code organization and conventions
4. Building and running locally
5. Testing procedures
6. Debugging techniques
7. Performance considerations
8. Security guidelines

**Developer Guide Best Practices:**
- Include complete setup instructions
- Explain architectural decisions
- Document coding standards
- Provide development workflows
- Include troubleshooting for common dev issues
- Link to relevant external resources`;

      case 'deployment-guide':
        return `
**Deployment Guide Structure:**
1. Prerequisites and requirements
2. Environment configuration
3. Installation procedures
4. Configuration management
5. Security considerations
6. Monitoring and logging
7. Backup and recovery
8. Maintenance procedures

**Deployment Best Practices:**
- Include all system requirements
- Provide environment-specific instructions
- Document security configurations
- Include rollback procedures
- Provide monitoring recommendations
- Cover common deployment issues`;

      case 'contributing-guide':
        return `
**Contributing Guide Structure:**
1. How to contribute (overview)
2. Code of conduct
3. Development setup
4. Coding standards and conventions
5. Pull request process
6. Issue reporting guidelines
7. Testing requirements
8. Recognition and attribution

**Contributing Guide Best Practices:**
- Welcome newcomers warmly
- Make setup process clear
- Define acceptance criteria
- Explain review process
- Provide templates for issues/PRs
- Include contact information for help`;

      case 'changelog':
        return `
**Changelog Structure:**
1. Keep a Changelog format
2. Version sections (newest first)
3. Release dates
4. Categories: Added, Changed, Deprecated, Removed, Fixed, Security
5. Brief, clear descriptions
6. Links to issues/PRs where relevant

**Changelog Best Practices:**
- Use semantic versioning
- Write for humans, not machines  
- Group changes by type
- Include migration notes for breaking changes
- Link to detailed information
- Keep descriptions concise but informative`;

      default:
        return 'Follow standard documentation best practices with clear structure and helpful content.';
    }
  }

  // Specialized documentation generation methods

  async generateReadme(
    projectInfo: DocumentationInput['projectInfo'],
    codebase: DocumentationInput['codebase'],
    context?: AgentContext
  ): Promise<AgentResult<DocumentationOutput>> {
    return this.execute({
      projectInfo,
      codebase,
      documentationType: 'readme',
      audience: 'mixed',
      includeCodeExamples: true,
      includeScreenshots: true
    }, context);
  }

  async generateApiDocs(
    projectInfo: DocumentationInput['projectInfo'],
    apiCode: string,
    context?: AgentContext
  ): Promise<AgentResult<DocumentationOutput>> {
    return this.execute({
      projectInfo,
      codebase: {
        files: [{
          name: 'api.js',
          path: '/src/api.js',
          code: apiCode,
          language: 'javascript'
        }],
        technologies: ['Node.js', 'Express', 'REST API'],
      },
      documentationType: 'api-docs',
      audience: 'developers',
      includeCodeExamples: true
    }, context);
  }

  async generateUserGuide(
    projectInfo: DocumentationInput['projectInfo'],
    features: string[],
    context?: AgentContext
  ): Promise<AgentResult<DocumentationOutput>> {
    return this.execute({
      projectInfo: {
        ...projectInfo,
        description: `${projectInfo.description} Features: ${features.join(', ')}`
      },
      codebase: {
        technologies: features,
      },
      documentationType: 'user-guide',
      audience: 'end-users',
      includeCodeExamples: false,
      includeScreenshots: true
    }, context);
  }

  async generateContributingGuide(
    projectInfo: DocumentationInput['projectInfo'],
    codebase: DocumentationInput['codebase'],
    context?: AgentContext
  ): Promise<AgentResult<DocumentationOutput>> {
    return this.execute({
      projectInfo,
      codebase,
      documentationType: 'contributing-guide',
      audience: 'contributors',
      includeCodeExamples: true
    }, context);
  }

  // Batch documentation generation for complete project
  async generateCompleteDocumentation(
    projectInfo: DocumentationInput['projectInfo'],
    codebase: DocumentationInput['codebase'],
    context?: AgentContext
  ): Promise<AgentResult<{
    readme: DocumentationOutput;
    contributing: DocumentationOutput;
    userGuide?: DocumentationOutput;
    deploymentGuide?: DocumentationOutput;
    changelog: DocumentationOutput;
    summary: {
      totalDocuments: number;
      totalWords: number;
      estimatedSetupTime: string;
      recommendations: string[];
    };
  }>> {
    try {
      // Generate core documentation files
      const [readmeResult, contributingResult, changelogResult] = await Promise.all([
        this.generateReadme(projectInfo, codebase, context),
        this.generateContributingGuide(projectInfo, codebase, context),
        this.execute({
          projectInfo,
          codebase,
          documentationType: 'changelog',
          audience: 'mixed',
          includeCodeExamples: false
        }, context)
      ]);

      if (!readmeResult.success || !contributingResult.success || !changelogResult.success) {
        return {
          success: false,
          error: 'Failed to generate core documentation files',
          metadata: { agentId: this.config.id }
        };
      }

      let userGuideResult, deploymentGuideResult;

      // Generate additional docs based on project type
      if (codebase.framework || codebase.technologies.some(tech => 
        ['react', 'vue', 'angular', 'webapp'].some(keyword => 
          tech.toLowerCase().includes(keyword)
        )
      )) {
        userGuideResult = await this.generateUserGuide(
          projectInfo,
          codebase.technologies,
          context
        );
      }

      if (codebase.technologies.some(tech => 
        ['express', 'fastify', 'api', 'server'].some(keyword => 
          tech.toLowerCase().includes(keyword)
        )
      )) {
        deploymentGuideResult = await this.execute({
          projectInfo,
          codebase,
          documentationType: 'deployment-guide',
          audience: 'maintainers',
          includeCodeExamples: true
        }, context);
      }

      const totalWords = [
        readmeResult.data!.metadata.wordCount,
        contributingResult.data!.metadata.wordCount,
        changelogResult.data!.metadata.wordCount,
        userGuideResult?.data?.metadata.wordCount || 0,
        deploymentGuideResult?.data?.metadata.wordCount || 0
      ].reduce((sum, count) => sum + count, 0);

      const totalDocuments = 3 + 
        (userGuideResult?.success ? 1 : 0) + 
        (deploymentGuideResult?.success ? 1 : 0);

      return {
        success: true,
        data: {
          readme: readmeResult.data!,
          contributing: contributingResult.data!,
          userGuide: userGuideResult?.data,
          deploymentGuide: deploymentGuideResult?.data,
          changelog: changelogResult.data!,
          summary: {
            totalDocuments,
            totalWords,
            estimatedSetupTime: this.estimateSetupTime(totalWords),
            recommendations: [
              'Review and customize all generated documentation',
              'Add project-specific screenshots and examples',
              'Set up automated documentation updates in CI/CD',
              'Create documentation review process for contributors',
              'Consider adding interactive examples or demos'
            ]
          }
        },
        metadata: { 
          agentId: this.config.id,
          documentsGenerated: totalDocuments
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Documentation generation failed',
        metadata: { agentId: this.config.id }
      };
    }
  }

  private estimateSetupTime(wordCount: number): string {
    // Rough estimate: 200 words per minute reading + setup time
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    const setupTimeMinutes = Math.max(15, readingTimeMinutes * 2); // Setup takes longer than reading
    
    if (setupTimeMinutes < 60) {
      return `${setupTimeMinutes} minutes`;
    } else {
      const hours = Math.floor(setupTimeMinutes / 60);
      const minutes = setupTimeMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }
}