import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
  ChatInput,
  ChatMessage
} from '../types';

// Input/Output schemas
const ChatInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  context: z.object({
    hasActiveCode: z.boolean().optional(),
    recentMessages: z.array(z.string()).optional(),
    currentArtifacts: z.number().optional(),
    responseMode: z.enum(['just-build', 'show-options', 'explain-first']).optional(),
  }).optional(),
});

const ChatOutputSchema = z.string();

export class ChatAssistantAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'chat-assistant',
      name: 'Chat Assistant Agent',
      description: 'Friendly AI assistant specialized in web development conversations',
      version: '1.0.0',
      enabled: true,
      priority: 8,
      timeout: 30000, // 30 seconds
      retries: 3,
      dependencies: [],
      capabilities: [
        'conversation',
        'web-development-advice',
        'code-explanation',
        'project-guidance',
        'friendly-interaction'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<string>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Generate chat response
      const result = await this.generateChatResponse(validatedInput, context);
      
      return result;
    }, context);
  }

  validate(input: any): boolean {
    try {
      ChatInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return ChatInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return ChatOutputSchema;
  }

  private async generateChatResponse(
    input: ChatInput,
    context?: AgentContext
  ): Promise<string> {
    const systemPrompt = this.createChatSystemPrompt(input, context);
    const messages = this.buildChatMessages(systemPrompt, input.message, context);
    
    const response = await this.chat(messages, {
      temperature: 0.8,
      maxTokens: 1000,
    }, context);

    return response;
  }

  private createChatSystemPrompt(input: ChatInput, context?: AgentContext): string {
    const basePrompt = `You are a friendly and enthusiastic AI assistant that specializes in helping people build websites and web applications. You have a warm, conversational personality.

Key traits:
- Warm, friendly, and approachable
- Enthusiastic about web development and creative projects
- Use emojis naturally in conversation
- Provide helpful and actionable advice
- Ask clarifying questions when needed
- Celebrate user successes and encourage experimentation

Your expertise includes:
- HTML, CSS, and JavaScript
- Modern web frameworks (React, Vue, Angular, Svelte)
- Responsive design and accessibility
- Web performance optimization
- UI/UX design principles
- Development tools and workflows

Response guidelines:
- Keep responses conversational and engaging
- Provide practical examples when helpful
- Break down complex topics into digestible steps
- Encourage best practices
- Suggest next steps or follow-up actions
- Be supportive and positive`;

    // Add context-specific instructions
    let contextualPrompt = basePrompt;

    if (input.context?.hasActiveCode) {
      contextualPrompt += `\n\nCurrent context: The user has active code in their workspace. You can reference their current work and suggest improvements or modifications.`;
    }

    if (input.context?.currentArtifacts) {
      contextualPrompt += `\n\nThe user currently has ${input.context.currentArtifacts} artifact(s) in their project. Consider their existing work when providing advice.`;
    }

    if (input.context?.responseMode) {
      switch (input.context.responseMode) {
        case 'just-build':
          contextualPrompt += `\n\nResponse mode: Focus on direct implementation and building. Be concise and action-oriented.`;
          break;
        case 'show-options':
          contextualPrompt += `\n\nResponse mode: Present multiple options and approaches. Help the user understand different possibilities.`;
          break;
        case 'explain-first':
          contextualPrompt += `\n\nResponse mode: Provide explanations before implementation. Focus on teaching and understanding.`;
          break;
      }
    }

    if (input.context?.recentMessages && input.context.recentMessages.length > 0) {
      contextualPrompt += `\n\nRecent conversation context:\n${input.context.recentMessages.join('\n')}`;
    }

    return this.createSystemPrompt(contextualPrompt, context);
  }

  // Specialized chat methods for different interaction types
  async welcomeUser(userName?: string, context?: AgentContext): Promise<AgentResult<string>> {
    const message = userName 
      ? `Welcome ${userName}! I'm excited to help you build something amazing today.`
      : `Welcome! I'm your friendly web development assistant. What would you like to create today?`;

    return this.execute({ message }, context);
  }

  async explainConcept(
    concept: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `Can you explain ${concept} for someone at a ${userLevel} level? Please include practical examples.`;

    return this.execute({
      message,
      context: {
        responseMode: 'explain-first'
      }
    }, context);
  }

  async provideFeedback(
    userCode: string,
    codeType: 'html' | 'css' | 'javascript' | 'react' | 'vue',
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `Can you review this ${codeType} code and provide feedback with suggestions for improvement?

\`\`\`${codeType}
${userCode}
\`\`\``;

    return this.execute({
      message,
      context: {
        hasActiveCode: true,
        responseMode: 'explain-first'
      }
    }, context);
  }

  async suggestImprovements(
    projectDescription: string,
    currentFeatures: string[],
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `I'm working on ${projectDescription}. Current features include: ${currentFeatures.join(', ')}. 

What improvements or additional features would you suggest to make this project better?`;

    return this.execute({
      message,
      context: {
        responseMode: 'show-options'
      }
    }, context);
  }

  async helpWithError(
    errorMessage: string,
    codeContext: string,
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `I'm getting this error: "${errorMessage}"

Here's the relevant code:
\`\`\`
${codeContext}
\`\`\`

Can you help me understand what's wrong and how to fix it?`;

    return this.execute({
      message,
      context: {
        hasActiveCode: true,
        responseMode: 'explain-first'
      }
    }, context);
  }

  async celebrateSuccess(
    achievement: string,
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `I just ${achievement}! 🎉`;

    return this.execute({ message }, context);
  }

  async askForNextSteps(
    currentState: string,
    goals: string[],
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const message = `I've ${currentState}. My goals are: ${goals.join(', ')}. What should I work on next?`;

    return this.execute({
      message,
      context: {
        responseMode: 'show-options'
      }
    }, context);
  }

  // Context-aware response generation
  async respondWithContext(
    message: string,
    conversationHistory: string[],
    projectContext: {
      framework?: string;
      projectType?: string;
      complexity?: string;
    },
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const enrichedInput: ChatInput = {
      message,
      context: {
        recentMessages: conversationHistory.slice(-5), // Last 5 messages
        hasActiveCode: true,
        responseMode: 'show-options'
      }
    };

    // Add project context to agent context
    const enrichedContext: AgentContext = {
      ...context,
      sessionId: context?.sessionId || 'default',
      timestamp: new Date(),
      metadata: {
        ...context?.metadata,
        projectFramework: projectContext.framework,
        projectType: projectContext.projectType,
        projectComplexity: projectContext.complexity
      }
    };

    return this.execute(enrichedInput, enrichedContext);
  }

  // Personality customization
  async adjustPersonality(
    style: 'professional' | 'casual' | 'enthusiastic' | 'teaching',
    message: string,
    context?: AgentContext
  ): Promise<AgentResult<string>> {
    const personalityPrompts = {
      professional: 'Respond in a professional, business-like tone while remaining helpful.',
      casual: 'Respond in a casual, relaxed tone like talking to a friend.',
      enthusiastic: 'Respond with high energy and enthusiasm, using lots of emojis and exclamation points!',
      teaching: 'Respond in a patient, educational tone focused on helping the user learn and understand.'
    };

    const contextWithPersonality: AgentContext = {
      ...context,
      sessionId: context?.sessionId || 'default',
      timestamp: new Date(),
      metadata: {
        ...context?.metadata,
        personalityStyle: style,
        personalityPrompt: personalityPrompts[style]
      }
    };

    return this.execute({ message }, contextWithPersonality);
  }
}