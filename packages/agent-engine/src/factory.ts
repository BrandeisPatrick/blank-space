import { AgentEngine } from './core';
import { 
  DefaultProviderRegistry, 
  DefaultModelRouter,
  OpenAIProvider,
  AnthropicProvider,
  GroqProvider,
  ProviderConfig 
} from './providers';
import { PromptManager, ALL_TEMPLATES } from './prompts';
import { StateManager } from './state';

export interface AgentEngineConfig {
  providers: {
    openai?: { apiKey: string; baseUrl?: string };
    anthropic?: { apiKey: string; baseUrl?: string };
    groq?: { apiKey: string; baseUrl?: string };
  };
  defaultModels?: {
    openai?: string;
    anthropic?: string;  
    groq?: string;
  };
}

export function createAgentEngine(config: AgentEngineConfig): AgentEngine {
  // Create provider registry
  const providerRegistry = new DefaultProviderRegistry();

  // Register providers based on configuration
  if (config.providers.openai?.apiKey) {
    const openaiConfig: ProviderConfig = {
      name: 'openai',
      apiKey: config.providers.openai.apiKey,
      baseUrl: config.providers.openai.baseUrl,
      models: [
        'gpt-4o',
        'gpt-4o-mini', 
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ],
      defaultModel: config.defaultModels?.openai || 'gpt-4o',
      enabled: true,
    };
    providerRegistry.register(new OpenAIProvider(openaiConfig));
  }

  if (config.providers.anthropic?.apiKey) {
    const anthropicConfig: ProviderConfig = {
      name: 'anthropic',
      apiKey: config.providers.anthropic.apiKey,
      baseUrl: config.providers.anthropic.baseUrl,
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      defaultModel: config.defaultModels?.anthropic || 'claude-3-5-sonnet-20241022',
      enabled: true,
    };
    providerRegistry.register(new AnthropicProvider(anthropicConfig));
  }

  if (config.providers.groq?.apiKey) {
    const groqConfig: ProviderConfig = {
      name: 'groq',
      apiKey: config.providers.groq.apiKey,
      baseUrl: config.providers.groq.baseUrl,
      models: [
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
        'gemma2-9b-it'
      ],
      defaultModel: config.defaultModels?.groq || 'llama-3.1-70b-versatile',
      enabled: true,
    };
    providerRegistry.register(new GroqProvider(groqConfig));
  }

  // Create model router
  const modelRouter = new DefaultModelRouter(providerRegistry);

  // Create prompt manager and register templates
  const promptManager = new PromptManager();
  for (const template of ALL_TEMPLATES) {
    promptManager.register(template);
  }

  // Create state manager
  const stateManager = new StateManager();

  // Create and return the engine
  return new AgentEngine(
    providerRegistry,
    modelRouter,
    promptManager,
    stateManager
  );
}

// Convenience function to create engine from environment variables
export function createAgentEngineFromEnv(): AgentEngine {
  const config: AgentEngineConfig = {
    providers: {},
  };

  // Load from environment variables
  if (process.env.OPENAI_API_KEY) {
    config.providers.openai = {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    config.providers.anthropic = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
    };
  }

  if (process.env.GROQ_API_KEY) {
    config.providers.groq = {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL,
    };
  }

  // Set default models from environment
  config.defaultModels = {
    openai: process.env.OPENAI_DEFAULT_MODEL,
    anthropic: process.env.ANTHROPIC_DEFAULT_MODEL,
    groq: process.env.GROQ_DEFAULT_MODEL,
  };

  return createAgentEngine(config);
}