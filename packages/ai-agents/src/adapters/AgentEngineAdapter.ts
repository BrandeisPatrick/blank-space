import { 
  AgentEngine, 
  AgentRequest, 
  TaskType,
  createAgentEngineFromEnv 
} from '@ui-grid-ai/agent-engine';
import { AIProvider as LegacyAIProvider } from '../types';

/**
 * Adapter that bridges the legacy AIProvider interface with the new AgentEngine system
 */
export class AgentEngineAdapter implements LegacyAIProvider {
  private agentEngine: AgentEngine;
  private providerName: string;
  private sessionId?: string;

  constructor(agentEngine?: AgentEngine, providerName: string = 'agent-engine') {
    this.agentEngine = agentEngine || createAgentEngineFromEnv();
    this.providerName = providerName;
  }

  get name(): string {
    return this.providerName;
  }

  get models(): string[] {
    // Return all available models from all providers
    const registry = this.agentEngine.getProviderRegistry();
    const providers = registry.list();
    return providers.flatMap(provider => provider.config.models);
  }

  get defaultModel(): string {
    // Get the default model from the best available provider
    const registry = this.agentEngine.getProviderRegistry();
    const bestProvider = registry.getBestAvailable();
    return bestProvider?.config.defaultModel || 'gpt-4o';
  }

  isConfigured(): boolean {
    const registry = this.agentEngine.getProviderRegistry();
    return registry.getConfigured().length > 0;
  }

  async complete(prompt: string, options?: any): Promise<string> {
    const request: AgentRequest = {
      taskType: TaskType.CODE_GENERATION,
      input: prompt,
      sessionId: this.sessionId,
      options: {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      },
    };

    const response = await this.agentEngine.execute(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Agent execution failed');
    }

    return response.data;
  }

  async chat(messages: any[], options?: any): Promise<string> {
    // Convert chat messages to a single prompt for now
    // In a more sophisticated implementation, we could use the chat functionality directly
    const prompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const request: AgentRequest = {
      taskType: TaskType.CONVERSATION,
      input: prompt,
      sessionId: this.sessionId,
      options: {
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens,
      },
    };

    const response = await this.agentEngine.execute(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Agent execution failed');
    }

    return response.data;
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    if (schema) {
      const response = await this.agentEngine.executeStructured({
        taskType: TaskType.CODE_GENERATION,
        input: prompt,
        schema,
        sessionId: this.sessionId,
        options: {
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Structured generation failed');
      }

      return response.data;
    }

    // Fallback to regular completion with JSON instruction
    const jsonPrompt = `${prompt}\n\nPlease respond with valid JSON only.`;
    const result = await this.complete(jsonPrompt, options);
    
    try {
      return JSON.parse(result);
    } catch (error) {
      throw new Error('Failed to parse JSON response');
    }
  }

  async classify(prompt: string, categories: string[], options?: any): Promise<string> {
    const classificationPrompt = `Classify the following text into one of these categories: ${categories.join(', ')}\n\nText: ${prompt}\n\nReturn only the category name.`;
    
    const result = await this.complete(classificationPrompt, {
      ...options,
      temperature: 0.1, // Lower temperature for classification
    });

    return result.trim();
  }

  // Session management
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  // Access to underlying agent engine
  getAgentEngine(): AgentEngine {
    return this.agentEngine;
  }
}

// Factory function to create adapter with environment configuration
export function createAgentEngineAdapter(): AgentEngineAdapter {
  const agentEngine = createAgentEngineFromEnv();
  return new AgentEngineAdapter(agentEngine);
}

// Factory function with specific provider preference
export function createAgentEngineAdapterWithProvider(providerName: string): AgentEngineAdapter {
  const agentEngine = createAgentEngineFromEnv();
  const adapter = new AgentEngineAdapter(agentEngine, providerName);
  
  // Set up task routing to prefer the specified provider
  const modelRouter = agentEngine.getModelRouter();
  
  // Update all task types to use the preferred provider if available
  const taskTypes = Object.values(TaskType);
  taskTypes.forEach(taskType => {
    try {
      modelRouter.updateTaskProvider(taskType, providerName);
    } catch {
      // Ignore if provider is not configured - will fall back to default
    }
  });
  
  return adapter;
}