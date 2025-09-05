import { TaskType, TaskModelConfig, ModelRouter, AIProvider, ProviderRegistry } from './types';

export class DefaultModelRouter implements ModelRouter {
  private taskConfigs = new Map<TaskType, TaskModelConfig[TaskType]>();
  private providerRegistry: ProviderRegistry;

  constructor(providerRegistry: ProviderRegistry) {
    this.providerRegistry = providerRegistry;
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    // Default task-specific model configurations
    this.taskConfigs.set(TaskType.PLANNING, {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
    });

    this.taskConfigs.set(TaskType.CODE_GENERATION, {
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      temperature: 0.1,
      maxTokens: 4000,
    });

    this.taskConfigs.set(TaskType.CODE_REVIEW, {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.2,
      maxTokens: 3000,
    });

    this.taskConfigs.set(TaskType.DOCUMENTATION, {
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.4,
      maxTokens: 2500,
    });

    this.taskConfigs.set(TaskType.CONVERSATION, {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1500,
    });
  }

  getProviderForTask(taskType: TaskType): AIProvider {
    const config = this.taskConfigs.get(taskType);
    if (!config) {
      throw new Error(`No configuration found for task type: ${taskType}`);
    }

    let provider = this.providerRegistry.get(config.provider);

    // Fallback to best available provider if preferred is not configured
    if (!provider || !provider.isConfigured()) {
      provider = this.providerRegistry.getBestAvailable();
      if (!provider) {
        throw new Error('No configured AI provider available');
      }
    }

    return provider;
  }

  setTaskConfig(taskType: TaskType, config: TaskModelConfig[TaskType]): void {
    this.taskConfigs.set(taskType, config);
  }

  getTaskConfig(taskType: TaskType): TaskModelConfig[TaskType] | undefined {
    return this.taskConfigs.get(taskType);
  }

  getAllTaskConfigs(): Record<string, TaskModelConfig[TaskType]> {
    const configs: Record<string, TaskModelConfig[TaskType]> = {};
    for (const [taskType, config] of this.taskConfigs.entries()) {
      configs[taskType] = config;
    }
    return configs;
  }

  updateTaskProvider(taskType: TaskType, providerName: string): void {
    const config = this.taskConfigs.get(taskType);
    if (config) {
      const provider = this.providerRegistry.get(providerName);
      if (!provider) {
        throw new Error(`Provider '${providerName}' not found`);
      }
      if (!provider.isConfigured()) {
        throw new Error(`Provider '${providerName}' is not configured`);
      }
      
      config.provider = providerName;
      // Update model to default model of the new provider
      config.model = provider.config.defaultModel;
      this.taskConfigs.set(taskType, config);
    }
  }

  updateTaskModel(taskType: TaskType, modelName: string): void {
    const config = this.taskConfigs.get(taskType);
    if (config) {
      const provider = this.providerRegistry.get(config.provider);
      if (provider && provider.config.models.includes(modelName)) {
        config.model = modelName;
        this.taskConfigs.set(taskType, config);
      } else {
        throw new Error(`Model '${modelName}' not available for provider '${config.provider}'`);
      }
    }
  }

  getAvailableModelsForTask(taskType: TaskType): string[] {
    const provider = this.getProviderForTask(taskType);
    return provider.config.models;
  }

  isTaskConfigValid(taskType: TaskType): boolean {
    try {
      const provider = this.getProviderForTask(taskType);
      const config = this.getTaskConfig(taskType);
      return !!(provider && config && provider.config.models.includes(config.model));
    } catch {
      return false;
    }
  }

  validateAllTaskConfigs(): Record<TaskType, boolean> {
    const results: Record<TaskType, boolean> = {} as Record<TaskType, boolean>;
    for (const taskType of Object.values(TaskType)) {
      results[taskType] = this.isTaskConfigValid(taskType);
    }
    return results;
  }
}