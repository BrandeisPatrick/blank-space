import { z } from 'zod';
import { BaseAgent } from '../core/BaseAgent';
import { 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
  IntentClassificationInput,
  IntentClassificationOutput
} from '../types';

// Input/Output schemas
const IntentClassificationInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  hasActiveCode: z.boolean().optional(),
  responseMode: z.enum(['just-build', 'show-options', 'explain-first']).optional(),
});

const IntentClassificationOutputSchema = z.object({
  intent: z.enum(['generation', 'modification', 'explanation', 'conversation']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  shouldExecuteDirectly: z.boolean().optional(),
  shouldShowOptions: z.boolean().optional(),
});

export class IntentClassificationAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'intent-classification',
      name: 'Intent Classification Agent',
      description: 'Analyzes user messages to classify their intent and determine appropriate response strategies',
      version: '1.0.0',
      enabled: true,
      priority: 15, // High priority for routing decisions
      timeout: 15000, // 15 seconds
      retries: 2,
      dependencies: [],
      capabilities: [
        'intent-analysis',
        'message-classification',
        'routing-decisions',
        'context-understanding'
      ]
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<IntentClassificationOutput>> {
    return this.executeWithRetry(async () => {
      // Validate and parse input
      const validatedInput = this.validateInput(input, this.getInputSchema());
      
      // Classify intent
      const result = await this.classifyIntent(validatedInput, context);
      
      // Validate output
      const validatedOutput = this.validateInput(result, this.getOutputSchema());
      
      return validatedOutput;
    }, context);
  }

  validate(input: any): boolean {
    try {
      IntentClassificationInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  getInputSchema(): z.ZodSchema {
    return IntentClassificationInputSchema;
  }

  getOutputSchema(): z.ZodSchema {
    return IntentClassificationOutputSchema;
  }

  private async classifyIntent(
    input: IntentClassificationInput,
    context?: AgentContext
  ): Promise<IntentClassificationOutput> {
    const systemPrompt = this.createIntentClassificationPrompt(input, context);
    
    // Use JSON generation for structured output
    const result = await this.generateJSON(
      systemPrompt,
      IntentClassificationOutputSchema,
      {
        temperature: 0.3, // Lower temperature for more consistent classification
        maxTokens: 500,
      },
      context
    );

    return result;
  }

  private createIntentClassificationPrompt(
    input: IntentClassificationInput,
    context?: AgentContext
  ): string {
    const basePrompt = `You are an expert intent classifier for a web development assistant. Classify the user's message into one of these categories:

INTENT TYPES:
- "generation": User wants to create/build/generate something new (websites, apps, components, etc.)
- "modification": User wants to modify/change/edit existing code or content
- "explanation": User wants an explanation of code or how something works
- "conversation": User is having a general conversation or asking questions

ANALYSIS CRITERIA:
- Look for action verbs: "create", "build", "make" = generation
- Look for change verbs: "modify", "update", "fix", "change" = modification  
- Look for question words: "how", "why", "what", "explain" = explanation
- Look for greetings, thanks, or general chat = conversation

CONFIDENCE SCORING:
- High (0.8-1.0): Clear intent with strong indicators
- Medium (0.5-0.7): Likely intent with some ambiguity
- Low (0.0-0.4): Unclear or mixed signals

EXECUTION RECOMMENDATIONS:
- shouldExecuteDirectly: true for simple, clear generation requests
- shouldShowOptions: true for complex requests or when multiple approaches exist

Context Information:
- Has active code: ${input.hasActiveCode ? 'Yes' : 'No'}
- Response mode: ${input.responseMode || 'Not specified'}

Return ONLY valid JSON in this format:
{
  "intent": "generation|modification|explanation|conversation",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this intent was chosen",
  "shouldExecuteDirectly": true|false,
  "shouldShowOptions": true|false
}

User message to classify: "${input.message}"`;

    return this.createSystemPrompt(basePrompt, context);
  }

  // Specialized classification methods
  async classifyWithExamples(
    message: string,
    examples: Array<{message: string; intent: string; confidence: number}>,
    context?: AgentContext
  ): Promise<AgentResult<IntentClassificationOutput>> {
    const exampleText = examples.map(ex => 
      `Example: "${ex.message}" → ${ex.intent} (confidence: ${ex.confidence})`
    ).join('\n');

    const enhancedInput = {
      message,
      context: `Previous examples:\n${exampleText}`
    };

    return this.execute(enhancedInput, context);
  }

  async classifyBatch(
    messages: string[],
    context?: AgentContext
  ): Promise<AgentResult<IntentClassificationOutput[]>> {
    const batchPrompt = `Classify the following ${messages.length} messages:

${messages.map((msg, i) => `${i + 1}. "${msg}"`).join('\n')}

Return an array of classification results in the same order.`;

    const result = await this.generateJSON(
      batchPrompt,
      z.array(IntentClassificationOutputSchema),
      {
        temperature: 0.3,
        maxTokens: 1000,
      },
      context
    );

    return {
      success: true,
      data: result,
      metadata: {
        batchSize: messages.length,
        agentId: this.config.id
      }
    };
  }

  // Intent-specific analysis methods
  async analyzeGenerationIntent(
    message: string,
    context?: AgentContext
  ): Promise<{
    isGeneration: boolean;
    generationType: 'website' | 'component' | 'page' | 'feature' | 'other';
    complexity: 'simple' | 'medium' | 'complex';
    requirements: string[];
  }> {
    if (!(await this.isGenerationIntent(message, context))) {
      return {
        isGeneration: false,
        generationType: 'other',
        complexity: 'simple',
        requirements: []
      };
    }

    const analysisPrompt = `Analyze this generation request in detail:

Message: "${message}"

Return JSON with:
{
  "isGeneration": true,
  "generationType": "website|component|page|feature|other",
  "complexity": "simple|medium|complex", 
  "requirements": ["requirement1", "requirement2", ...]
}

Determine:
- Type based on what they want to create
- Complexity based on scope and technical requirements
- Requirements extracted from the message`;

    const result = await this.generateJSON(analysisPrompt, undefined, {
      temperature: 0.3,
      maxTokens: 300
    }, context);

    return result;
  }

  async analyzeModificationIntent(
    message: string,
    context?: AgentContext
  ): Promise<{
    isModification: boolean;
    modificationType: 'styling' | 'functionality' | 'content' | 'structure' | 'performance' | 'other';
    scope: 'minor' | 'major';
    target: string;
  }> {
    if (!(await this.isModificationIntent(message, context))) {
      return {
        isModification: false,
        modificationType: 'other',
        scope: 'minor',
        target: ''
      };
    }

    const analysisPrompt = `Analyze this modification request:

Message: "${message}"

Return JSON with:
{
  "isModification": true,
  "modificationType": "styling|functionality|content|structure|performance|other",
  "scope": "minor|major",
  "target": "what they want to modify"
}`;

    const result = await this.generateJSON(analysisPrompt, undefined, {
      temperature: 0.3,
      maxTokens: 200
    }, context);

    return result;
  }

  // Helper methods for quick intent checks
  async isGenerationIntent(message: string, context?: AgentContext): Promise<boolean> {
    const result = await this.execute({ message }, context);
    return result.success && result.data?.intent === 'generation';
  }

  async isModificationIntent(message: string, context?: AgentContext): Promise<boolean> {
    const result = await this.execute({ message }, context);
    return result.success && result.data?.intent === 'modification';
  }

  async isExplanationIntent(message: string, context?: AgentContext): Promise<boolean> {
    const result = await this.execute({ message }, context);
    return result.success && result.data?.intent === 'explanation';
  }

  async isConversationIntent(message: string, context?: AgentContext): Promise<boolean> {
    const result = await this.execute({ message }, context);
    return result.success && result.data?.intent === 'conversation';
  }

  // Confidence-based routing decisions
  async shouldShowOptions(
    message: string,
    confidenceThreshold = 0.7,
    context?: AgentContext
  ): Promise<boolean> {
    const result = await this.execute({ message }, context);
    
    if (!result.success || !result.data) return true; // Default to showing options
    
    // Show options if confidence is low or explicitly recommended
    return result.data.confidence < confidenceThreshold || 
           result.data.shouldShowOptions === true;
  }

  async canExecuteDirectly(
    message: string,
    confidenceThreshold = 0.8,
    context?: AgentContext
  ): Promise<boolean> {
    const result = await this.execute({ message }, context);
    
    if (!result.success || !result.data) return false;
    
    // Can execute directly if high confidence and explicitly recommended
    return result.data.confidence >= confidenceThreshold && 
           result.data.shouldExecuteDirectly === true;
  }

  // Context-aware classification
  async classifyWithConversationHistory(
    message: string,
    previousMessages: string[],
    context?: AgentContext
  ): Promise<AgentResult<IntentClassificationOutput>> {
    const conversationContext = previousMessages.length > 0 
      ? `\n\nConversation history:\n${previousMessages.slice(-3).join('\n')}`
      : '';

    const enhancedMessage = message + conversationContext;

    return this.execute({
      message: enhancedMessage,
      hasActiveCode: context?.metadata?.hasActiveCode
    }, context);
  }

  // Training and improvement methods
  async provideFeedback(
    message: string,
    actualIntent: string,
    predictedResult: IntentClassificationOutput,
    context?: AgentContext
  ): Promise<void> {
    // This could be used to log training data for model improvement
    this.addMessage('system', {
      type: 'feedback',
      message,
      predicted: predictedResult,
      actual: actualIntent,
      timestamp: new Date()
    }, context);
  }

  // Statistics and analytics
  getClassificationStats(results: IntentClassificationOutput[]): {
    intentDistribution: Record<string, number>;
    averageConfidence: number;
    highConfidenceCount: number;
    lowConfidenceCount: number;
  } {
    const intentCounts = results.reduce((acc, result) => {
      acc[result.intent] = (acc[result.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
    const highConfidence = results.filter(r => r.confidence >= 0.8).length;
    const lowConfidence = results.filter(r => r.confidence < 0.5).length;

    return {
      intentDistribution: intentCounts,
      averageConfidence: avgConfidence,
      highConfidenceCount: highConfidence,
      lowConfidenceCount: lowConfidence
    };
  }
}