import { z } from 'zod';
import { nanoid } from 'nanoid';
import { 
  ProviderRegistry, 
  ModelRouter, 
  TaskType, 
  AIProvider,
  GenerationOptions 
} from '../providers/types';
import { PromptManager, PromptContext } from '../prompts';
import { StateManager, SessionState } from '../state';

// Agent request schema
export const AgentRequestSchema = z.object({
  taskType: z.nativeEnum(TaskType),
  input: z.any(),
  sessionId: z.string().optional(),
  templateId: z.string().optional(),
  providerOverride: z.string().optional(),
  options: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    stream: z.boolean().default(false),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

// Agent response schema
export const AgentResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  taskId: z.string(),
  sessionId: z.string(),
  provider: z.string(),
  model: z.string(),
  executionTime: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Streaming response for real-time output
export interface StreamingResponse {
  taskId: string;
  sessionId: string;
  provider: string;
  model: string;
  stream: AsyncIterable<string>;
}

export class AgentEngine {
  private providerRegistry: ProviderRegistry;
  private modelRouter: ModelRouter;
  private promptManager: PromptManager;
  private stateManager: StateManager;

  constructor(
    providerRegistry: ProviderRegistry,
    modelRouter: ModelRouter,
    promptManager: PromptManager,
    stateManager: StateManager
  ) {
    this.providerRegistry = providerRegistry;
    this.modelRouter = modelRouter;
    this.promptManager = promptManager;
    this.stateManager = stateManager;
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const validatedRequest = AgentRequestSchema.parse(request);
    const taskId = nanoid();
    const startTime = Date.now();

    // Get or create session
    let sessionId = validatedRequest.sessionId;
    if (!sessionId) {
      const session = await this.stateManager.createSession();
      sessionId = session.id;
    }

    try {
      // Get provider for task
      const provider = validatedRequest.providerOverride
        ? this.providerRegistry.get(validatedRequest.providerOverride)
        : this.modelRouter.getProviderForTask(validatedRequest.taskType);

      if (!provider || !provider.isConfigured()) {
        throw new Error('No configured provider available for task');
      }

      // Get task configuration
      const taskConfig = this.modelRouter.getTaskConfig(validatedRequest.taskType);
      if (!taskConfig) {
        throw new Error(`No configuration found for task type: ${validatedRequest.taskType}`);
      }

      // Start execution tracking
      await this.stateManager.startExecution(
        sessionId,
        'agent-engine',
        taskId,
        validatedRequest.input,
        validatedRequest.metadata
      );

      // Prepare prompt
      let prompt: string;
      if (validatedRequest.templateId) {
        // Use template
        const context: PromptContext = {
          variables: validatedRequest.input,
          metadata: validatedRequest.metadata,
        };
        prompt = this.promptManager.render(validatedRequest.templateId, context);
      } else {
        // Use input directly as prompt
        prompt = typeof validatedRequest.input === 'string' 
          ? validatedRequest.input 
          : JSON.stringify(validatedRequest.input);
      }

      // Prepare generation options
      const options: GenerationOptions = {
        model: taskConfig.model,
        temperature: validatedRequest.options?.temperature ?? taskConfig.temperature,
        maxTokens: validatedRequest.options?.maxTokens ?? taskConfig.maxTokens,
        ...validatedRequest.options,
      };

      // Execute task
      const result = await provider.generateText(prompt, options);
      const executionTime = Date.now() - startTime;

      // Complete execution tracking
      await this.stateManager.completeExecution(
        sessionId,
        taskId,
        result,
        { executionTime, provider: provider.name, model: options.model }
      );

      // Return response
      return {
        success: true,
        data: result,
        taskId,
        sessionId,
        provider: provider.name,
        model: options.model || taskConfig.model,
        executionTime,
        metadata: validatedRequest.metadata,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Record failure
      await this.stateManager.failExecution(
        sessionId,
        taskId,
        errorMessage,
        { executionTime, error: errorMessage }
      );

      return {
        success: false,
        error: errorMessage,
        taskId,
        sessionId,
        provider: 'unknown',
        model: 'unknown',
        executionTime,
        metadata: validatedRequest.metadata,
      };
    }
  }

  async executeStreaming(request: AgentRequest): Promise<StreamingResponse> {
    const validatedRequest = AgentRequestSchema.parse(request);
    const taskId = nanoid();

    // Get or create session
    let sessionId = validatedRequest.sessionId;
    if (!sessionId) {
      const session = await this.stateManager.createSession();
      sessionId = session.id;
    }

    // Get provider for task
    const provider = validatedRequest.providerOverride
      ? this.providerRegistry.get(validatedRequest.providerOverride)
      : this.modelRouter.getProviderForTask(validatedRequest.taskType);

    if (!provider || !provider.isConfigured()) {
      throw new Error('No configured provider available for task');
    }

    // Get task configuration
    const taskConfig = this.modelRouter.getTaskConfig(validatedRequest.taskType);
    if (!taskConfig) {
      throw new Error(`No configuration found for task type: ${validatedRequest.taskType}`);
    }

    // Start execution tracking
    await this.stateManager.startExecution(
      sessionId,
      'agent-engine',
      taskId,
      validatedRequest.input,
      validatedRequest.metadata
    );

    // Prepare prompt
    let prompt: string;
    if (validatedRequest.templateId) {
      const context: PromptContext = {
        variables: validatedRequest.input,
        metadata: validatedRequest.metadata,
      };
      prompt = this.promptManager.render(validatedRequest.templateId, context);
    } else {
      prompt = typeof validatedRequest.input === 'string' 
        ? validatedRequest.input 
        : JSON.stringify(validatedRequest.input);
    }

    // Prepare generation options
    const options: GenerationOptions = {
      model: taskConfig.model,
      temperature: validatedRequest.options?.temperature ?? taskConfig.temperature,
      maxTokens: validatedRequest.options?.maxTokens ?? taskConfig.maxTokens,
      stream: true,
      ...validatedRequest.options,
    };

    // Create streaming response
    const stream = provider.streamText(prompt, options);

    return {
      taskId,
      sessionId,
      provider: provider.name,
      model: options.model || taskConfig.model,
      stream,
    };
  }

  async executeStructured<T>(
    request: Omit<AgentRequest, 'input'> & { 
      input: string;
      schema: z.ZodSchema<T>;
    }
  ): Promise<AgentResponse & { data?: T }> {
    const taskId = nanoid();
    const startTime = Date.now();

    // Get or create session
    let sessionId = request.sessionId;
    if (!sessionId) {
      const session = await this.stateManager.createSession();
      sessionId = session.id;
    }

    try {
      // Get provider for task
      const provider = request.providerOverride
        ? this.providerRegistry.get(request.providerOverride)
        : this.modelRouter.getProviderForTask(request.taskType);

      if (!provider || !provider.isConfigured()) {
        throw new Error('No configured provider available for task');
      }

      // Get task configuration
      const taskConfig = this.modelRouter.getTaskConfig(request.taskType);
      if (!taskConfig) {
        throw new Error(`No configuration found for task type: ${request.taskType}`);
      }

      // Start execution tracking
      await this.stateManager.startExecution(
        sessionId,
        'agent-engine',
        taskId,
        request.input,
        request.metadata
      );

      // Prepare generation options
      const options: GenerationOptions = {
        model: taskConfig.model,
        temperature: request.options?.temperature ?? taskConfig.temperature,
        maxTokens: request.options?.maxTokens ?? taskConfig.maxTokens,
        ...request.options,
      };

      // Execute structured generation
      const result = await provider.generateStructured(request.input, request.schema, options);
      const executionTime = Date.now() - startTime;

      // Complete execution tracking
      await this.stateManager.completeExecution(
        sessionId,
        taskId,
        result,
        { executionTime, provider: provider.name, model: options.model }
      );

      return {
        success: true,
        data: result,
        taskId,
        sessionId,
        provider: provider.name,
        model: options.model || taskConfig.model,
        executionTime,
        metadata: request.metadata,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.stateManager.failExecution(
        sessionId,
        taskId,
        errorMessage,
        { executionTime, error: errorMessage }
      );

      return {
        success: false,
        error: errorMessage,
        taskId,
        sessionId,
        provider: 'unknown',
        model: 'unknown',
        executionTime,
        metadata: request.metadata,
      };
    }
  }

  // Utility methods
  async getSession(sessionId: string): Promise<SessionState | null> {
    return this.stateManager.getSession(sessionId);
  }

  async getExecutionHistory(sessionId: string) {
    return this.stateManager.getExecutionHistory(sessionId);
  }

  async setSessionVariable(sessionId: string, key: string, value: any): Promise<void> {
    return this.stateManager.setSessionVariable(sessionId, key, value);
  }

  async getSessionVariable(sessionId: string, key: string): Promise<any> {
    return this.stateManager.getSessionVariable(sessionId, key);
  }

  // Health checks and status
  async healthCheck(): Promise<Record<string, any>> {
    const providers = this.providerRegistry.list();
    const configuredProviders = this.providerRegistry.getConfigured();
    const taskValidations = this.modelRouter.validateAllTaskConfigs();

    return {
      providers: {
        total: providers.length,
        configured: configuredProviders.length,
        names: providers.map(p => p.name),
        configuredNames: configuredProviders.map(p => p.name),
      },
      tasks: taskValidations,
      templates: {
        total: this.promptManager.list().length,
        categories: [...new Set(this.promptManager.list().map(t => t.category))],
      },
      ready: configuredProviders.length > 0 && Object.values(taskValidations).every(Boolean),
    };
  }

  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  getModelRouter(): ModelRouter {
    return this.modelRouter;
  }

  getPromptManager(): PromptManager {
    return this.promptManager;
  }

  getStateManager(): StateManager {
    return this.stateManager;
  }
}