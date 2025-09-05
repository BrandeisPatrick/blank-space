import { nanoid } from 'nanoid';
import { AgentEngine } from '@ui-grid-ai/agent-engine';
import { ReActEngine, ReasoningContext, ReasoningResult, ReActConfig } from '../reasoning';
import { DefaultToolRegistry, ReadFileTool, WriteFileTool, ListDirectoryTool, ExecuteCommandTool, RunNpmCommandTool, GitCommandTool } from '../tools';
import { GroundingService, MockWebGroundingProvider, DocumentationGroundingProvider } from '../grounding';

export interface ReasoningSystemConfig {
  maxSteps?: number;
  allowDangerousTools?: boolean;
  requireConfirmation?: boolean;
  enableGrounding?: boolean;
  workingDirectory?: string;
}

export class ReasoningSystem {
  private agentEngine: AgentEngine;
  private toolRegistry: DefaultToolRegistry;
  private reactEngine: ReActEngine;
  private groundingService: GroundingService;

  constructor(agentEngine: AgentEngine, config?: ReasoningSystemConfig) {
    this.agentEngine = agentEngine;
    
    // Initialize tool registry with default tools
    this.toolRegistry = new DefaultToolRegistry();
    this.registerDefaultTools();
    
    // Initialize ReAct engine
    this.reactEngine = new ReActEngine(agentEngine, this.toolRegistry);
    
    // Initialize grounding service
    this.groundingService = new GroundingService();
    if (config?.enableGrounding !== false) {
      this.initializeGrounding();
    }
  }

  private registerDefaultTools(): void {
    // File system tools
    this.toolRegistry.register(new ReadFileTool());
    this.toolRegistry.register(new WriteFileTool());
    this.toolRegistry.register(new ListDirectoryTool());
    
    // Command tools
    this.toolRegistry.register(new ExecuteCommandTool());
    this.toolRegistry.register(new RunNpmCommandTool());
    this.toolRegistry.register(new GitCommandTool());
  }

  private initializeGrounding(): void {
    // Register grounding providers
    this.groundingService.registerProvider(new MockWebGroundingProvider());
    this.groundingService.registerProvider(new DocumentationGroundingProvider());
  }

  async executeTask(
    goal: string, 
    sessionId?: string,
    config?: ReasoningSystemConfig & ReActConfig
  ): Promise<ReasoningResult> {
    const context: ReasoningContext = {
      sessionId: sessionId || nanoid(),
      taskId: nanoid(),
      goal,
      maxSteps: config?.maxSteps || 10,
      workingDirectory: config?.workingDirectory || process.cwd(),
      currentStep: 0,
      completed: false,
    };

    const reactConfig: ReActConfig = {
      maxSteps: config?.maxSteps || 10,
      allowDangerousTools: config?.allowDangerousTools || false,
      requireConfirmation: config?.requireConfirmation !== false,
      temperature: config?.temperature || 0.1,
      maxTokensPerStep: config?.maxTokensPerStep || 2000,
      enableSelfCorrection: config?.enableSelfCorrection !== false,
      timeoutMs: config?.timeoutMs || 300000,
    };

    return this.reactEngine.execute(goal, context, reactConfig);
  }

  async *executeTaskStreaming(
    goal: string, 
    sessionId?: string,
    config?: ReasoningSystemConfig & ReActConfig
  ) {
    const context: ReasoningContext = {
      sessionId: sessionId || nanoid(),
      taskId: nanoid(),
      goal,
      maxSteps: config?.maxSteps || 10,
      workingDirectory: config?.workingDirectory || process.cwd(),
      currentStep: 0,
      completed: false,
    };

    const reactConfig: ReActConfig = {
      maxSteps: config?.maxSteps || 10,
      allowDangerousTools: config?.allowDangerousTools || false,
      requireConfirmation: config?.requireConfirmation !== false,
      temperature: config?.temperature || 0.1,
      maxTokensPerStep: config?.maxTokensPerStep || 2000,
      enableSelfCorrection: config?.enableSelfCorrection !== false,
      timeoutMs: config?.timeoutMs || 300000,
    };

    yield* this.reactEngine.executeStreaming(goal, context, reactConfig);
  }

  // Enhanced task execution with grounding
  async executeTaskWithGrounding(
    goal: string,
    sessionId?: string,
    config?: ReasoningSystemConfig & ReActConfig
  ): Promise<ReasoningResult> {
    try {
      // Enhance the goal with grounding context
      const enhancedGoal = await this.groundingService.enhanceContext(goal, 2);
      
      return this.executeTask(enhancedGoal, sessionId, config);
    } catch (error) {
      console.warn('Grounding enhancement failed, proceeding with original goal:', error);
      return this.executeTask(goal, sessionId, config);
    }
  }

  // Tool management methods
  getAvailableTools() {
    return this.toolRegistry.list().map(tool => ({
      name: tool.definition.name,
      description: tool.definition.description,
      category: tool.definition.category,
      dangerous: tool.definition.dangerous,
      requiresConfirmation: tool.definition.requiresConfirmation,
      parameters: tool.definition.parameters,
    }));
  }

  getToolsByCategory(category: string) {
    return this.toolRegistry.listByCategory(category).map(tool => ({
      name: tool.definition.name,
      description: tool.definition.description,
      parameters: tool.definition.parameters,
    }));
  }

  // Grounding methods
  async searchGrounding(query: string, type: 'web' | 'docs' | 'code' = 'docs') {
    return this.groundingService.search({
      query,
      type,
      maxResults: 5,
    });
  }

  // System status and health
  async getSystemStatus() {
    const agentHealth = await this.agentEngine.healthCheck();
    const tools = this.getAvailableTools();
    const groundingProviders = this.groundingService.listProviders();

    return {
      agentEngine: agentHealth,
      tools: {
        total: tools.length,
        categories: [...new Set(tools.map(t => t.category).filter(Boolean))],
        dangerous: tools.filter(t => t.dangerous).length,
      },
      grounding: {
        providers: groundingProviders.length,
        configured: groundingProviders.filter(p => p.isConfigured()).length,
      },
      ready: agentHealth.ready && tools.length > 0,
    };
  }

  // Getters for advanced usage
  getAgentEngine(): AgentEngine {
    return this.agentEngine;
  }

  getToolRegistry(): DefaultToolRegistry {
    return this.toolRegistry;
  }

  getReActEngine(): ReActEngine {
    return this.reactEngine;
  }

  getGroundingService(): GroundingService {
    return this.groundingService;
  }
}