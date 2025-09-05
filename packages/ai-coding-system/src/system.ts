import { 
  createAgentEngine, 
  AgentEngineConfig,
  AgentEngine 
} from '@ui-grid-ai/agent-engine';
import { 
  createReasoningSystem, 
  ReasoningSystem,
  ReasoningSystemConfig 
} from '@ui-grid-ai/react-reasoning';
import { 
  createAgentEngineAdapter,
  createModernAgentSystem 
} from '@ui-grid-ai/ai-agents';

export interface AICodingSystemConfig {
  // Agent Engine Configuration
  providers: AgentEngineConfig['providers'];
  defaultModels?: AgentEngineConfig['defaultModels'];
  
  // Reasoning System Configuration
  reasoning?: ReasoningSystemConfig;
  
  // Legacy Agent Support
  enableLegacyAgents?: boolean;
}

export interface AICodingSystem {
  // Core components
  agentEngine: AgentEngine;
  reasoningSystem: ReasoningSystem;
  
  // Legacy support
  legacyAgentSystem?: any;
  
  // Utility methods
  healthCheck(): Promise<SystemHealth>;
  getCapabilities(): SystemCapabilities;
}

export interface SystemHealth {
  agentEngine: {
    ready: boolean;
    providers: Record<string, boolean>;
    configuredProviders: string[];
  };
  reasoningSystem: {
    ready: boolean;
    toolCount: number;
    groundingProviders: number;
  };
  legacyAgents?: {
    ready: boolean;
    agentCount: number;
  };
  overall: boolean;
}

export interface SystemCapabilities {
  // Gemini CLI-style capabilities
  layers: {
    cliInterface: {
      commands: string[];
      features: string[];
    };
    coreEngine: {
      providers: string[];
      taskTypes: string[];
      features: string[];
    };
    reactReasoning: {
      tools: string[];
      grounding: string[];
      features: string[];
    };
  };
  
  // Integration features
  integration: {
    multiModelSupport: boolean;
    taskSpecificRouting: boolean;
    streamingSupport: boolean;
    toolIntegration: boolean;
    groundingSupport: boolean;
    historyManagement: boolean;
    configurationManagement: boolean;
  };
}

export function createAICodingSystem(config: AICodingSystemConfig): AICodingSystem {
  // Create core agent engine
  const agentEngine = createAgentEngine({
    providers: config.providers,
    defaultModels: config.defaultModels,
  });

  // Create reasoning system
  const reasoningSystem = createReasoningSystem({
    ...config.reasoning,
  });

  // Create legacy agent system if enabled
  let legacyAgentSystem: any;
  if (config.enableLegacyAgents) {
    legacyAgentSystem = createModernAgentSystem();
  }

  return {
    agentEngine,
    reasoningSystem,
    legacyAgentSystem,

    async healthCheck(): Promise<SystemHealth> {
      // Check agent engine health
      const agentEngineHealth = await agentEngine.healthCheck();
      
      // Check reasoning system health
      const reasoningSystemHealth = await reasoningSystem.getSystemStatus();
      
      // Check legacy agents if enabled
      let legacyHealth;
      if (legacyAgentSystem) {
        legacyHealth = {
          ready: true,
          agentCount: legacyAgentSystem.registry.list().length,
        };
      }

      const overall = agentEngineHealth.ready && reasoningSystemHealth.ready;

      return {
        agentEngine: {
          ready: agentEngineHealth.ready,
          providers: agentEngineHealth.providers || {},
          configuredProviders: agentEngineHealth.providers?.configuredNames || [],
        },
        reasoningSystem: {
          ready: reasoningSystemHealth.ready,
          toolCount: reasoningSystemHealth.tools?.total || 0,
          groundingProviders: reasoningSystemHealth.grounding?.configured || 0,
        },
        legacyAgents: legacyHealth,
        overall,
      };
    },

    getCapabilities(): SystemCapabilities {
      const agentEngineHealth = agentEngine.healthCheck();
      const reasoningSystemStatus = reasoningSystem.getSystemStatus();
      
      return {
        layers: {
          cliInterface: {
            commands: ['code', 'config', 'history'],
            features: [
              'Interactive mode',
              'Streaming output', 
              'Configuration management',
              'Command history',
              'Multi-theme support',
              'Progress tracking'
            ],
          },
          coreEngine: {
            providers: ['openai', 'anthropic', 'groq'],
            taskTypes: ['planning', 'code-generation', 'code-review', 'documentation', 'conversation'],
            features: [
              'Multi-provider support',
              'Task-specific model routing',
              'Prompt template management',
              'Session state management',
              'Structured generation',
              'Health monitoring'
            ],
          },
          reactReasoning: {
            tools: ['file_operations', 'command_execution', 'git_operations', 'npm_operations'],
            grounding: ['web_search', 'documentation_lookup'],
            features: [
              'Step-by-step reasoning',
              'Tool execution',
              'Self-correction',
              'Grounding integration',
              'Streaming reasoning',
              'Safety controls'
            ],
          },
        },
        integration: {
          multiModelSupport: true,
          taskSpecificRouting: true,
          streamingSupport: true,
          toolIntegration: true,
          groundingSupport: true,
          historyManagement: true,
          configurationManagement: true,
        },
      };
    },
  };
}

// Convenience factory from environment variables
export function createAICodingSystemFromEnv(
  overrides?: Partial<AICodingSystemConfig>
): AICodingSystem {
  const config: AICodingSystemConfig = {
    providers: {},
    enableLegacyAgents: true,
    ...overrides,
  };

  // Load provider configurations from environment
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

  return createAICodingSystem(config);
}

// Quick setup for development
export function createDevelopmentSystem(): AICodingSystem {
  return createAICodingSystemFromEnv({
    reasoning: {
      maxSteps: 15,
      allowDangerousTools: true,
      requireConfirmation: false,
      enableGrounding: true,
    },
    enableLegacyAgents: true,
  });
}

// Safe setup for production
export function createProductionSystem(): AICodingSystem {
  return createAICodingSystemFromEnv({
    reasoning: {
      maxSteps: 10,
      allowDangerousTools: false,
      requireConfirmation: true,
      enableGrounding: true,
    },
    enableLegacyAgents: false, // Disable legacy for cleaner production setup
  });
}