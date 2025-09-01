import { z } from 'zod';
import { nanoid } from 'nanoid';
import { 
  Agent, 
  AgentConfig, 
  AgentContext, 
  AgentResult, 
  AIProvider,
  AgentMessage,
  ChatMessage,
  CompletionOptions
} from '../types';

export abstract class BaseAgent implements Agent {
  public readonly config: AgentConfig;
  public readonly provider: AIProvider;
  private messages: AgentMessage[] = [];

  constructor(config: AgentConfig, provider: AIProvider) {
    this.config = config;
    this.provider = provider;
  }

  abstract execute(input: any, context?: AgentContext): Promise<AgentResult>;
  abstract validate(input: any): boolean;
  abstract getInputSchema(): z.ZodSchema;
  abstract getOutputSchema(): z.ZodSchema;

  // Core LLM interaction methods
  protected async complete(
    prompt: string, 
    options?: CompletionOptions,
    context?: AgentContext
  ): Promise<string> {
    this.addMessage('input', prompt, context);
    
    try {
      const result = await this.provider.complete(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        ...options
      });
      
      this.addMessage('output', result, context);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addMessage('error', errorMessage, context);
      throw error;
    }
  }

  protected async chat(
    messages: ChatMessage[], 
    options?: CompletionOptions,
    context?: AgentContext
  ): Promise<string> {
    this.addMessage('input', messages, context);
    
    try {
      const result = await this.provider.chat(messages, {
        temperature: 0.7,
        maxTokens: 2000,
        ...options
      });
      
      this.addMessage('output', result, context);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addMessage('error', errorMessage, context);
      throw error;
    }
  }

  // Specialized LLM methods
  protected async generateJSON<T>(
    prompt: string,
    schema?: z.ZodSchema<T>,
    options?: CompletionOptions,
    context?: AgentContext
  ): Promise<T> {
    if (this.provider.generateJSON) {
      this.addMessage('input', { prompt, schema }, context);
      
      try {
        const result = await this.provider.generateJSON(prompt, schema, options);
        this.addMessage('output', result, context);
        
        if (schema) {
          return schema.parse(result);
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.addMessage('error', errorMessage, context);
        throw error;
      }
    }

    // Fallback to regular completion
    const jsonPrompt = `${prompt}

IMPORTANT: Return ONLY valid JSON. Do not include any other text or formatting.`;

    const response = await this.complete(jsonPrompt, options, context);
    
    try {
      const parsed = JSON.parse(response);
      if (schema) {
        return schema.parse(parsed);
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async classify(
    prompt: string,
    categories: string[],
    options?: CompletionOptions,
    context?: AgentContext
  ): Promise<string> {
    if (this.provider.classify) {
      this.addMessage('input', { prompt, categories }, context);
      
      try {
        const result = await this.provider.classify(prompt, categories, options);
        this.addMessage('output', result, context);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.addMessage('error', errorMessage, context);
        throw error;
      }
    }

    // Fallback to completion-based classification
    const classificationPrompt = `Classify the following text into one of these categories: ${categories.join(', ')}

Text: ${prompt}

Return only the category name, nothing else.`;

    return this.complete(classificationPrompt, options, context);
  }

  // Helper methods
  protected createSystemPrompt(basePrompt: string, context?: AgentContext): string {
    let prompt = basePrompt;

    // Add context information if available
    if (context?.metadata) {
      const contextInfo = Object.entries(context.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      prompt = `${prompt}

Context Information:
${contextInfo}`;
    }

    // Add agent capabilities
    if (this.config.capabilities.length > 0) {
      prompt = `${prompt}

Agent Capabilities:
${this.config.capabilities.map(cap => `- ${cap}`).join('\n')}`;
    }

    return prompt;
  }

  protected buildChatMessages(
    systemPrompt: string,
    userMessage: string,
    context?: AgentContext
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.createSystemPrompt(systemPrompt, context)
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return messages;
  }

  protected addMessage(
    type: AgentMessage['type'],
    content: any,
    context?: AgentContext
  ): void {
    const message: AgentMessage = {
      id: nanoid(),
      agentId: this.config.id,
      type,
      content,
      timestamp: new Date(),
      context
    };

    this.messages.push(message);
  }

  public getMessages(): AgentMessage[] {
    return [...this.messages];
  }

  public clearMessages(): void {
    this.messages = [];
  }

  // Execution wrapper with error handling and retries
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: AgentContext
  ): Promise<AgentResult<T>> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Execute with timeout
        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise<T>()
        ]);
        
        const endTime = Date.now();
        
        return {
          success: true,
          data: result,
          metadata: {
            executionTime: endTime - startTime,
            attempt,
            agentId: this.config.id
          },
          messages: this.getMessages()
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries) {
          // Wait before retry (exponential backoff)
          await this.wait(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: `Agent execution failed after ${this.config.retries} attempts: ${lastError?.message}`,
      metadata: {
        agentId: this.config.id,
        finalError: lastError?.message
      },
      messages: this.getMessages()
    };
  }

  private async createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validation helpers
  protected validateInput<T>(input: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Input validation failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.provider.isConfigured()) {
        return false;
      }

      // Simple test completion
      await this.provider.complete('Hello', { 
        maxTokens: 10,
        temperature: 0
      });

      return true;
    } catch {
      return false;
    }
  }

  // Agent information
  public getInfo() {
    return {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description,
      version: this.config.version,
      enabled: this.config.enabled,
      capabilities: this.config.capabilities,
      provider: this.provider.name,
      providerConfigured: this.provider.isConfigured()
    };
  }
}