import { DefaultAgentRegistry } from '../core/AgentRegistry';
import { AIProvider, AgentDefinition } from '../types';
import { 
  WebsiteGenerationAgent,
  ChatAssistantAgent, 
  IntentClassificationAgent,
  FrameworkAdvisorAgent,
  WorkflowOrchestrationAgent,
  CodeReviewAgent,
  DocumentationAgent
} from '../agents';

/**
 * Register all default agents with the registry
 */
export function registerDefaultAgents(registry: DefaultAgentRegistry): void {
  
  // Website Generation Agent
  const websiteGenerationDefinition: AgentDefinition = {
    config: {
      id: 'website-generation',
      name: 'Website Generation Agent',
      description: 'Generates complete websites from natural language descriptions',
      version: '1.0.0',
      enabled: true,
      priority: 10,
      timeout: 60000,
      retries: 3,
      dependencies: [],
      capabilities: [
        'html-generation',
        'css-generation', 
        'javascript-generation',
        'responsive-design',
        'framework-integration'
      ]
    },
    factory: (provider: AIProvider) => new WebsiteGenerationAgent(provider)
  };

  // Chat Assistant Agent
  const chatAssistantDefinition: AgentDefinition = {
    config: {
      id: 'chat-assistant',
      name: 'Chat Assistant Agent', 
      description: 'Friendly AI assistant specialized in web development conversations',
      version: '1.0.0',
      enabled: true,
      priority: 8,
      timeout: 30000,
      retries: 3,
      dependencies: [],
      capabilities: [
        'conversation',
        'web-development-advice',
        'code-explanation',
        'project-guidance',
        'friendly-interaction'
      ]
    },
    factory: (provider: AIProvider) => new ChatAssistantAgent(provider)
  };

  // Intent Classification Agent
  const intentClassificationDefinition: AgentDefinition = {
    config: {
      id: 'intent-classification',
      name: 'Intent Classification Agent',
      description: 'Analyzes user messages to classify their intent and determine appropriate response strategies',
      version: '1.0.0',
      enabled: true,
      priority: 15, // High priority for routing decisions
      timeout: 15000,
      retries: 2,
      dependencies: [],
      capabilities: [
        'intent-analysis',
        'message-classification',
        'routing-decisions',
        'context-understanding'
      ]
    },
    factory: (provider: AIProvider) => new IntentClassificationAgent(provider)
  };

  // Framework Advisor Agent
  const frameworkAdvisorDefinition: AgentDefinition = {
    config: {
      id: 'framework-advisor',
      name: 'Framework Advisor Agent',
      description: 'AI-powered framework recommendation system with deep analysis and reasoning',
      version: '1.0.0',
      enabled: true,
      priority: 12,
      timeout: 45000,
      retries: 3,
      dependencies: [],
      capabilities: [
        'framework-analysis',
        'project-requirements-analysis',
        'technology-recommendation',
        'architectural-guidance',
        'comparative-analysis'
      ]
    },
    factory: (provider: AIProvider) => new FrameworkAdvisorAgent(provider)
  };

  // Workflow Orchestration Agent
  const workflowOrchestrationDefinition: AgentDefinition = {
    config: {
      id: 'workflow-orchestration',
      name: 'Workflow Orchestration Agent',
      description: 'Plans and executes complex multi-step workflows by coordinating multiple specialized agents',
      version: '1.0.0',
      enabled: true,
      priority: 20, // Highest priority as it orchestrates others
      timeout: 120000,
      retries: 2,
      dependencies: [],
      capabilities: [
        'workflow-planning',
        'agent-coordination',
        'task-decomposition',
        'execution-monitoring',
        'error-recovery',
        'progress-tracking'
      ]
    },
    factory: (provider: AIProvider) => new WorkflowOrchestrationAgent(provider)
  };

  // Code Review Agent
  const codeReviewDefinition: AgentDefinition = {
    config: {
      id: 'code-review',
      name: 'Code Review Agent',
      description: 'Analyzes code for quality, security, performance, and best practices',
      version: '1.0.0',
      enabled: true,
      priority: 11,
      timeout: 60000,
      retries: 2,
      dependencies: [],
      capabilities: [
        'code-analysis',
        'security-scanning',
        'performance-analysis',
        'best-practices-checking',
        'accessibility-review',
        'code-improvement',
        'documentation-analysis'
      ]
    },
    factory: (provider: AIProvider) => new CodeReviewAgent(provider)
  };

  // Documentation Agent
  const documentationDefinition: AgentDefinition = {
    config: {
      id: 'documentation',
      name: 'Documentation Agent',
      description: 'Generates comprehensive documentation for software projects',
      version: '1.0.0',
      enabled: true,
      priority: 9,
      timeout: 90000,
      retries: 2,
      dependencies: [],
      capabilities: [
        'readme-generation',
        'api-documentation',
        'user-guides',
        'developer-documentation',
        'deployment-guides',
        'code-analysis',
        'markdown-formatting'
      ]
    },
    factory: (provider: AIProvider) => new DocumentationAgent(provider)
  };

  // Register all agents
  registry.register(websiteGenerationDefinition);
  registry.register(chatAssistantDefinition);
  registry.register(intentClassificationDefinition);
  registry.register(frameworkAdvisorDefinition);
  registry.register(workflowOrchestrationDefinition);
  registry.register(codeReviewDefinition);
  registry.register(documentationDefinition);
}

/**
 * Create a pre-configured agent registry with all default agents
 */
export function createDefaultAgentRegistry(): DefaultAgentRegistry {
  const registry = new DefaultAgentRegistry();
  registerDefaultAgents(registry);
  return registry;
}