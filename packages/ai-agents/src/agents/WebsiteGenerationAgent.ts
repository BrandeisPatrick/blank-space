import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
  WebsiteGenerationInput,
  WebsiteGenerationOutput
} from '../types';

// Input/Output schemas
const WebsiteGenerationInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  device: z.enum(['mobile', 'tablet', 'desktop']).default('desktop'),
  framework: z.enum(['vanilla', 'react', 'vue', 'svelte']).default('vanilla'),
  context: z.string().optional(),
});

const WebsiteGenerationOutputSchema = z.object({
  html: z.string(),
  css: z.string(),
  js: z.string(),
  metadata: z.object({
    framework: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
  }).optional(),
});

export class WebsiteGenerationAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'website-generation',
      name: 'Website Generation Agent',
      description: 'Generates complete websites from natural language descriptions',
      version: '1.0.0',
      enabled: true,
      priority: 10,
      timeout: 60000, // 60 seconds
      retries: 3,
      dependencies: [],
      capabilities: [
        'html-generation',
        'css-generation', 
        'javascript-generation',
        'responsive-design',
        'framework-integration'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<WebsiteGenerationOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Generate the website
      const result = await this.generateWebsite(validatedInput, context);
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      WebsiteGenerationInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return WebsiteGenerationInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return WebsiteGenerationOutputSchema;
  }

  private async generateWebsite(
    input: WebsiteGenerationInput,
    context?: AgentContext
  ): Promise<WebsiteGenerationOutput> {
    const systemPrompt = this.createWebsiteGenerationPrompt(input, context);
    
    // Use JSON generation for structured output
    const result = await this.generateJSON(
      systemPrompt,
      WebsiteGenerationOutputSchema,
      {
        temperature: 0.7,
        maxTokens: 4000,
      },
      context
    );

    return result;
  }

  private createWebsiteGenerationPrompt(input: WebsiteGenerationInput, context?: AgentContext): string {
    const basePrompt = `You are an expert web developer. Generate clean, modern, and responsive HTML, CSS, and JavaScript code based on the user's request.

IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.

Return your response in this exact JSON format:
{
  "html": "HTML content here",
  "css": "CSS styles here", 
  "js": "JavaScript code here (optional)",
  "metadata": {
    "framework": "${input.framework}",
    "dependencies": []
  }
}

Requirements:
- Target device: ${input.device}
- Framework: ${input.framework}
- Clean, semantic HTML5
- Modern CSS with flexbox/grid
- Responsive design
- Accessible markup
- Cross-browser compatibility
- No external dependencies unless specified

${this.getFrameworkSpecificInstructions(input.framework)}

${this.getDeviceSpecificInstructions(input.device)}

${input.context ? `\nAdditional Context:\n${input.context}` : ''}

User Request: ${input.prompt}`;

    return this.createSystemPrompt(basePrompt, context);
  }

  private getFrameworkSpecificInstructions(framework: string): string {
    switch (framework) {
      case 'react':
        return `
React-specific requirements:
- Use functional components with hooks
- Include proper JSX syntax
- Add React import if needed
- Use modern React patterns
- Include PropTypes if appropriate`;

      case 'vue':
        return `
Vue.js-specific requirements:
- Use Vue 3 composition API syntax
- Include proper template structure
- Use reactive data properties
- Follow Vue naming conventions
- Include necessary Vue directives`;

      case 'svelte':
        return `
Svelte-specific requirements:
- Use Svelte component syntax
- Include reactive statements where appropriate
- Use Svelte stores for state management if needed
- Follow Svelte conventions`;

      case 'vanilla':
      default:
        return `
Vanilla JavaScript requirements:
- Use modern ES6+ syntax
- Implement proper event handling
- Use semantic HTML elements
- No framework dependencies`;
    }
  }

  private getDeviceSpecificInstructions(device: string): string {
    switch (device) {
      case 'mobile':
        return `
Mobile-specific requirements:
- Mobile-first responsive design
- Touch-friendly interface elements
- Optimized for small screens (320px+)
- Fast loading and minimal JavaScript
- Large tap targets (44px minimum)`;

      case 'tablet':
        return `
Tablet-specific requirements:
- Tablet-optimized layout (768px-1024px)
- Touch-friendly with mouse support
- Balanced layout for portrait/landscape
- Medium-sized interactive elements`;

      case 'desktop':
      default:
        return `
Desktop-specific requirements:
- Desktop-first design (1200px+)
- Mouse and keyboard interactions
- Hover effects where appropriate
- Larger content areas and navigation`;
    }
  }

  // Enhanced functionality for different use cases
  async generateLandingPage(
    title: string,
    description: string,
    features: string[],
    context?: AgentContext
  ): Promise<AgentResult<WebsiteGenerationOutput>> {
    const prompt = `Create a modern landing page for "${title}".

Description: ${description}

Key Features:
${features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}

Include:
- Hero section with call-to-action
- Features showcase
- Contact/signup section
- Modern design with animations`;

    return this.execute({
      prompt,
      device: 'desktop',
      framework: 'vanilla'
    }, context);
  }

  async generateComponent(
    componentName: string,
    description: string,
    framework: string = 'vanilla',
    context?: AgentContext
  ): Promise<AgentResult<WebsiteGenerationOutput>> {
    const prompt = `Create a reusable ${componentName} component.

Description: ${description}

Requirements:
- Modular and reusable
- Well-documented
- Include example usage
- Follow ${framework} best practices`;

    return this.execute({
      prompt,
      device: 'desktop',
      framework: framework as any,
      context: `Component generation for ${componentName}`
    }, context);
  }

  async generateForm(
    formType: string,
    fields: Array<{name: string, type: string, required?: boolean}>,
    context?: AgentContext
  ): Promise<AgentResult<WebsiteGenerationOutput>> {
    const fieldsList = fields.map(field => 
      `- ${field.name} (${field.type})${field.required ? ' *required' : ''}`
    ).join('\n');

    const prompt = `Create a ${formType} form with the following fields:

${fieldsList}

Requirements:
- Proper form validation
- Accessible form elements
- Responsive design
- Error handling
- Success states`;

    return this.execute({
      prompt,
      device: 'desktop',
      framework: 'vanilla'
    }, context);
  }

  // Analysis and optimization methods
  async optimizeForPerformance(
    existingCode: WebsiteGenerationOutput,
    context?: AgentContext
  ): Promise<AgentResult<WebsiteGenerationOutput>> {
    const prompt = `Optimize the following web code for performance:

HTML:
${existingCode.html}

CSS:
${existingCode.css}

JavaScript:
${existingCode.js}

Optimizations to apply:
- Minify and compress code
- Optimize images and assets
- Reduce HTTP requests
- Improve loading performance
- Optimize CSS delivery
- Minimize JavaScript execution`;

    return this.execute({
      prompt,
      device: 'desktop',
      framework: 'vanilla',
      context: 'Performance optimization task'
    }, context);
  }

  async makeAccessible(
    existingCode: WebsiteGenerationOutput,
    context?: AgentContext
  ): Promise<AgentResult<WebsiteGenerationOutput>> {
    const prompt = `Improve the accessibility of the following web code:

HTML:
${existingCode.html}

CSS:
${existingCode.css}

JavaScript:
${existingCode.js}

Accessibility improvements needed:
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance
- Focus management
- Semantic HTML structure`;

    return this.execute({
      prompt,
      device: 'desktop',
      framework: 'vanilla',
      context: 'Accessibility improvement task'
    }, context);
  }
}