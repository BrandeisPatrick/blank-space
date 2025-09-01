import { nanoid } from 'nanoid';
import { 
  Agent, 
  AIProvider, 
  AgentRegistry, 
  AgentResult, 
  AgentContext, 
  Workflow, 
  WorkflowStep,
  ExecutionContext,
  AgentEvent,
  AgentEventType
} from '../types';
import { DefaultAgentRegistry } from './AgentRegistry';

type EventListener = (event: AgentEvent) => void;

export class AgentManager {
  private registry: AgentRegistry;
  private provider: AIProvider;
  private eventListeners = new Map<AgentEventType, EventListener[]>();
  private activeExecutions = new Map<string, ExecutionContext>();

  constructor(provider: AIProvider, registry?: AgentRegistry) {
    this.provider = provider;
    this.registry = registry || new DefaultAgentRegistry();
  }

  // Registry management
  getRegistry(): AgentRegistry {
    return this.registry;
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  // Single agent execution
  async executeAgent<T = any>(
    agentId: string, 
    input: any, 
    context?: AgentContext
  ): Promise<AgentResult<T>> {
    const sessionId = context?.sessionId || nanoid();
    const agentContext: AgentContext = {
      sessionId,
      timestamp: new Date(),
      ...context
    };

    try {
      // Create agent instance
      const agent = this.registry.createAgent(agentId, this.provider);

      // Validate input
      if (!agent.validate(input)) {
        return {
          success: false,
          error: `Invalid input for agent ${agentId}`,
          metadata: { agentId, sessionId }
        };
      }

      // Emit start event
      this.emitEvent('agent.started', {
        type: 'agent.started',
        agentId,
        data: { input },
        timestamp: new Date(),
        context: agentContext
      });

      // Execute agent
      const result = await agent.execute(input, agentContext);

      // Emit completion event
      this.emitEvent('agent.completed', {
        type: 'agent.completed',
        agentId,
        data: result,
        timestamp: new Date(),
        context: agentContext
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failureResult: AgentResult<T> = {
        success: false,
        error: errorMessage,
        metadata: { agentId, sessionId }
      };

      // Emit failure event
      this.emitEvent('agent.failed', {
        type: 'agent.failed',
        agentId,
        data: { error: errorMessage },
        timestamp: new Date(),
        context: agentContext
      });

      return failureResult;
    }
  }

  // Multi-agent workflow execution
  async executeWorkflow(
    workflow: Workflow, 
    initialInput: any, 
    context?: AgentContext
  ): Promise<AgentResult> {
    const sessionId = context?.sessionId || nanoid();
    const workflowContext: AgentContext = {
      sessionId,
      timestamp: new Date(),
      ...context
    };

    const executionContext: ExecutionContext = {
      sessionId,
      workflowId: workflow.id,
      variables: { input: initialInput },
      results: {},
      startTime: new Date(),
      timeout: workflow.timeout
    };

    this.activeExecutions.set(sessionId, executionContext);

    try {
      // Emit workflow start event
      this.emitEvent('workflow.started', {
        type: 'workflow.started',
        workflowId: workflow.id,
        data: { workflow, input: initialInput },
        timestamp: new Date(),
        context: workflowContext
      });

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(
        workflow.steps, 
        executionContext, 
        workflowContext
      );

      // Emit workflow completion event
      this.emitEvent('workflow.completed', {
        type: 'workflow.completed',
        workflowId: workflow.id,
        data: result,
        timestamp: new Date(),
        context: workflowContext
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failureResult: AgentResult = {
        success: false,
        error: `Workflow ${workflow.id} failed: ${errorMessage}`,
        metadata: { 
          workflowId: workflow.id,
          sessionId,
          executionTime: Date.now() - executionContext.startTime.getTime()
        }
      };

      // Emit workflow failure event
      this.emitEvent('workflow.failed', {
        type: 'workflow.failed',
        workflowId: workflow.id,
        data: { error: errorMessage },
        timestamp: new Date(),
        context: workflowContext
      });

      return failureResult;
    } finally {
      this.activeExecutions.delete(sessionId);
    }
  }

  private async executeWorkflowSteps(
    steps: WorkflowStep[],
    executionContext: ExecutionContext,
    workflowContext: AgentContext
  ): Promise<AgentResult> {
    const stepMap = new Map(steps.map(step => [step.id, step]));
    let currentStepId = steps[0]?.id;

    while (currentStepId) {
      const step = stepMap.get(currentStepId);
      if (!step) {
        throw new Error(`Step ${currentStepId} not found in workflow`);
      }

      // Emit step start event
      this.emitEvent('workflow.step.started', {
        type: 'workflow.step.started',
        workflowId: executionContext.workflowId,
        stepId: step.id,
        data: { step },
        timestamp: new Date(),
        context: workflowContext
      });

      try {
        // Resolve step input from variables and previous results
        const stepInput = this.resolveStepInput(step.input, executionContext);

        // Execute step
        const stepResult = await this.executeAgent(
          step.agentId,
          stepInput,
          workflowContext
        );

        // Store result
        executionContext.results[step.id] = stepResult;

        if (stepResult.success) {
          // Update variables with result data
          executionContext.variables[step.id] = stepResult.data;

          // Emit step completion event
          this.emitEvent('workflow.step.completed', {
            type: 'workflow.step.completed',
            workflowId: executionContext.workflowId,
            stepId: step.id,
            data: stepResult,
            timestamp: new Date(),
            context: workflowContext
          });

          // Determine next step
          currentStepId = step.onSuccess || this.findNextStep(steps, step);
        } else {
          // Emit step failure event
          this.emitEvent('workflow.step.failed', {
            type: 'workflow.step.failed',
            workflowId: executionContext.workflowId,
            stepId: step.id,
            data: stepResult,
            timestamp: new Date(),
            context: workflowContext
          });

          // Handle failure
          if (step.onFailure) {
            currentStepId = step.onFailure;
          } else {
            return {
              success: false,
              error: `Step ${step.id} failed: ${stepResult.error}`,
              data: executionContext.results,
              metadata: {
                workflowId: executionContext.workflowId,
                failedStep: step.id
              }
            };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Emit step failure event
        this.emitEvent('workflow.step.failed', {
          type: 'workflow.step.failed',
          workflowId: executionContext.workflowId,
          stepId: step.id,
          data: { error: errorMessage },
          timestamp: new Date(),
          context: workflowContext
        });

        throw error;
      }
    }

    // Workflow completed successfully
    return {
      success: true,
      data: executionContext.results,
      metadata: {
        workflowId: executionContext.workflowId,
        executionTime: Date.now() - executionContext.startTime.getTime()
      }
    };
  }

  private resolveStepInput(input: any, context: ExecutionContext): any {
    if (typeof input === 'string') {
      // Simple variable substitution
      return input.replace(/\$\{(\w+)\}/g, (match, variable) => {
        return context.variables[variable] || match;
      });
    }

    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.resolveStepInput(item, context));
      } else {
        const resolved: any = {};
        for (const [key, value] of Object.entries(input)) {
          resolved[key] = this.resolveStepInput(value, context);
        }
        return resolved;
      }
    }

    return input;
  }

  private findNextStep(steps: WorkflowStep[], currentStep: WorkflowStep): string | undefined {
    const currentIndex = steps.findIndex(step => step.id === currentStep.id);
    return steps[currentIndex + 1]?.id;
  }

  // Event system
  on(eventType: AgentEventType, listener: EventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: AgentEventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: AgentEventType, event: AgentEvent): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Utility methods
  async healthCheck(): Promise<{ healthy: boolean; agents: Record<string, boolean> }> {
    const agents: Record<string, boolean> = {};
    
    for (const definition of this.registry.getEnabled()) {
      try {
        const agent = this.registry.createAgent(definition.config.id, this.provider);
        agents[definition.config.id] = await agent.healthCheck();
      } catch {
        agents[definition.config.id] = false;
      }
    }

    const healthy = Object.values(agents).every(status => status);
    return { healthy, agents };
  }

  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  cancelExecution(sessionId: string): boolean {
    return this.activeExecutions.delete(sessionId);
  }

  getAgentInfo(agentId?: string) {
    if (agentId) {
      try {
        const agent = this.registry.createAgent(agentId, this.provider);
        return agent.getInfo();
      } catch {
        return null;
      }
    }

    return this.registry.getEnabled().map(definition => {
      try {
        const agent = this.registry.createAgent(definition.config.id, this.provider);
        return agent.getInfo();
      } catch {
        return {
          id: definition.config.id,
          name: definition.config.name,
          description: definition.config.description,
          enabled: false,
          error: 'Failed to create agent instance'
        };
      }
    });
  }
}