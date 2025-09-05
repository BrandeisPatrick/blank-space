import { createAgentEngineFromEnv } from '@ui-grid-ai/agent-engine';
import { ReasoningSystem, ReasoningSystemConfig } from './core';

export interface ReasoningSystemFactoryConfig extends ReasoningSystemConfig {
  // Agent engine configuration can be passed through environment variables
  // or provided via the agent-engine factory
}

export function createReasoningSystem(config?: ReasoningSystemFactoryConfig): ReasoningSystem {
  // Create agent engine from environment variables
  const agentEngine = createAgentEngineFromEnv();
  
  // Create reasoning system with configuration
  return new ReasoningSystem(agentEngine, config);
}

// Convenience function with pre-configured settings for development
export function createDevelopmentReasoningSystem(): ReasoningSystem {
  return createReasoningSystem({
    maxSteps: 15,
    allowDangerousTools: true,
    requireConfirmation: false,
    enableGrounding: true,
    workingDirectory: process.cwd(),
  });
}

// Convenience function with safe settings for production
export function createProductionReasoningSystem(): ReasoningSystem {
  return createReasoningSystem({
    maxSteps: 10,
    allowDangerousTools: false,
    requireConfirmation: true,
    enableGrounding: true,
    workingDirectory: process.cwd(),
  });
}