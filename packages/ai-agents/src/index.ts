// Core agent infrastructure
export { BaseAgent } from './core/BaseAgent';
export { AgentManager } from './core/AgentManager';
export { DefaultAgentRegistry } from './core/AgentRegistry';
export { ContextManager, InMemoryContextStorage } from './core/ContextManager';

// Agent implementations
export * from './agents';

// Types and schemas
export * from './types';

// Utilities
export { registerDefaultAgents, createDefaultAgentRegistry } from './utils/registerDefaultAgents';

// Integrations
export { FrameworkAdvisorBridge } from './integrations/frameworkAdvisorBridge';

// Workflows
export {
  createECommerceWorkflow,
  createCodeQualityWorkflow,
  createCompleteProjectWorkflow,
  createPortfolioWorkflow,
  ExampleWorkflowManager
} from './workflows/exampleWorkflows';

// Utilities for creating agent systems  
export const createAgentSystem = (provider: any) => {
  const registry = new DefaultAgentRegistry();
  registerDefaultAgents(registry);
  const manager = new AgentManager(provider, registry);
  const contextManager = new ContextManager();
  const workflowManager = new ExampleWorkflowManager(manager, contextManager);
  
  return {
    registry,
    manager,
    contextManager,
    workflowManager
  };
};