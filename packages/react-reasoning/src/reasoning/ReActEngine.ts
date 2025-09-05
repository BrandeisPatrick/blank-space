import { nanoid } from 'nanoid';
import { AgentEngine, TaskType, AgentRequest } from '@ui-grid-ai/agent-engine';
import { ToolRegistry, ToolContext, ToolResult } from '../tools';
import { 
  ReasoningEngine,
  ReasoningStep, 
  StepType, 
  ReasoningContext, 
  ReasoningResult, 
  ReActConfig,
  ActionStep,
  ToolExecutionRequest 
} from './types';

export class ReActEngine implements ReasoningEngine {
  private agentEngine: AgentEngine;
  private toolRegistry: ToolRegistry;

  constructor(agentEngine: AgentEngine, toolRegistry: ToolRegistry) {
    this.agentEngine = agentEngine;
    this.toolRegistry = toolRegistry;
  }

  async execute(
    goal: string, 
    context: ReasoningContext, 
    config?: ReActConfig
  ): Promise<ReasoningResult> {
    const startTime = Date.now();
    const steps: ReasoningStep[] = [];
    const finalConfig = { ...this.getDefaultConfig(), ...config };
    let currentStep = 0;
    let finalAnswer: string | undefined;
    let error: string | undefined;

    try {
      while (currentStep < finalConfig.maxSteps && !finalAnswer && !error) {
        const availableTools = this.getAvailableToolsDescription();
        const prompt = this.formatPrompt(steps, goal, availableTools);

        // Get next step from LLM
        const request: AgentRequest = {
          taskType: TaskType.PLANNING,
          input: prompt,
          sessionId: context.sessionId,
          options: {
            temperature: finalConfig.temperature,
            maxTokens: finalConfig.maxTokensPerStep,
          },
        };

        const response = await this.agentEngine.execute(request);
        
        if (!response.success) {
          error = response.error || 'Failed to generate reasoning step';
          break;
        }

        // Parse the response into reasoning steps
        const newSteps = this.parseReasoningResponse(response.data);
        
        for (const step of newSteps) {
          steps.push(step);

          if (step.type === StepType.FINAL_ANSWER) {
            finalAnswer = step.content;
            break;
          }

          if (step.type === StepType.ACTION) {
            const actionStep = this.parseAction(step.content);
            if (actionStep) {
              const toolResult = await this.executeToolAction(actionStep, context, finalConfig);
              
              // Add observation step
              const observation: ReasoningStep = {
                id: nanoid(),
                type: StepType.OBSERVATION,
                content: this.formatObservation(toolResult),
                timestamp: new Date(),
                metadata: { toolResult },
              };
              steps.push(observation);
            }
          }
        }

        currentStep++;

        // Safety check to prevent infinite loops
        if (steps.length > finalConfig.maxSteps * 3) {
          error = 'Maximum reasoning steps exceeded';
          break;
        }
      }

      if (!finalAnswer && !error && currentStep >= finalConfig.maxSteps) {
        error = `Reached maximum steps (${finalConfig.maxSteps}) without finding answer`;
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown reasoning error';
    }

    return {
      success: !!finalAnswer && !error,
      steps,
      finalAnswer,
      error,
      totalSteps: steps.length,
      executionTime: Date.now() - startTime,
    };
  }

  async *executeStreaming(
    goal: string, 
    context: ReasoningContext, 
    config?: ReActConfig
  ): AsyncIterable<ReasoningStep> {
    const finalConfig = { ...this.getDefaultConfig(), ...config };
    const steps: ReasoningStep[] = [];
    let currentStep = 0;

    try {
      while (currentStep < finalConfig.maxSteps) {
        const availableTools = this.getAvailableToolsDescription();
        const prompt = this.formatPrompt(steps, goal, availableTools);

        const request: AgentRequest = {
          taskType: TaskType.PLANNING,
          input: prompt,
          sessionId: context.sessionId,
          options: {
            temperature: finalConfig.temperature,
            maxTokens: finalConfig.maxTokensPerStep,
          },
        };

        const response = await this.agentEngine.execute(request);
        
        if (!response.success) {
          const errorStep: ReasoningStep = {
            id: nanoid(),
            type: StepType.OBSERVATION,
            content: `Error: ${response.error}`,
            timestamp: new Date(),
          };
          yield errorStep;
          break;
        }

        const newSteps = this.parseReasoningResponse(response.data);
        
        for (const step of newSteps) {
          steps.push(step);
          yield step;

          if (step.type === StepType.FINAL_ANSWER) {
            return;
          }

          if (step.type === StepType.ACTION) {
            const actionStep = this.parseAction(step.content);
            if (actionStep) {
              const toolResult = await this.executeToolAction(actionStep, context, finalConfig);
              
              const observation: ReasoningStep = {
                id: nanoid(),
                type: StepType.OBSERVATION,
                content: this.formatObservation(toolResult),
                timestamp: new Date(),
                metadata: { toolResult },
              };
              
              steps.push(observation);
              yield observation;
            }
          }
        }

        currentStep++;
      }
    } catch (error) {
      const errorStep: ReasoningStep = {
        id: nanoid(),
        type: StepType.OBSERVATION,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      yield errorStep;
    }
  }

  private parseReasoningResponse(response: string): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    const lines = response.split('\\n').filter(line => line.trim());

    for (const line of lines) {
      const thoughtMatch = line.match(/^Thought: (.+)/);
      const actionMatch = line.match(/^Action: (.+)/);
      const finalMatch = line.match(/^Final Answer: (.+)/);

      if (thoughtMatch) {
        steps.push({
          id: nanoid(),
          type: StepType.THOUGHT,
          content: thoughtMatch[1].trim(),
          timestamp: new Date(),
        });
      } else if (actionMatch) {
        steps.push({
          id: nanoid(),
          type: StepType.ACTION,
          content: actionMatch[1].trim(),
          timestamp: new Date(),
        });
      } else if (finalMatch) {
        steps.push({
          id: nanoid(),
          type: StepType.FINAL_ANSWER,
          content: finalMatch[1].trim(),
          timestamp: new Date(),
        });
      }
    }

    // If no structured format found, treat entire response as thought
    if (steps.length === 0 && response.trim()) {
      steps.push({
        id: nanoid(),
        type: StepType.THOUGHT,
        content: response.trim(),
        timestamp: new Date(),
      });
    }

    return steps;
  }

  parseAction(content: string): ActionStep | null {
    try {
      // Try to parse JSON format: {"tool": "name", "args": {...}, "reasoning": "..."}
      if (content.startsWith('{')) {
        const parsed = JSON.parse(content);
        return {
          toolName: parsed.tool || parsed.toolName,
          arguments: parsed.args || parsed.arguments || {},
          reasoning: parsed.reasoning || '',
        };
      }

      // Try to parse function call format: tool_name(arg1=value1, arg2=value2)
      const functionMatch = content.match(/^(\\w+)\\((.*)\\)$/);
      if (functionMatch) {
        const [, toolName, argsStr] = functionMatch;
        const args: Record<string, any> = {};
        
        if (argsStr.trim()) {
          const argPairs = argsStr.split(',').map(pair => pair.trim());
          for (const pair of argPairs) {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (key && value) {
              args[key] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
            }
          }
        }

        return {
          toolName,
          arguments: args,
          reasoning: '',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async executeToolAction(
    actionStep: ActionStep, 
    context: ReasoningContext, 
    config: ReActConfig
  ): Promise<ToolResult> {
    const tool = this.toolRegistry.get(actionStep.toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool '${actionStep.toolName}' not found`,
        executionTime: 0,
      };
    }

    // Security checks
    if (!config.allowDangerousTools && tool.definition.dangerous) {
      return {
        success: false,
        error: `Dangerous tool '${actionStep.toolName}' not allowed`,
        executionTime: 0,
      };
    }

    if (config.requireConfirmation && tool.definition.requiresConfirmation) {
      // In a real implementation, this would prompt for user confirmation
      console.warn(`Tool '${actionStep.toolName}' requires confirmation but auto-approving for now`);
    }

    const toolContext: ToolContext = {
      sessionId: context.sessionId,
      taskId: context.taskId,
      workingDirectory: context.workingDirectory,
      environment: context.environment,
      metadata: context.metadata,
    };

    try {
      return await tool.execute(actionStep.arguments, toolContext);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime: 0,
      };
    }
  }

  private formatObservation(result: ToolResult): string {
    if (!result.success) {
      return `Error: ${result.error}`;
    }

    let observation = '';
    
    if (result.stdout) {
      observation += `Output: ${result.stdout}\\n`;
    }
    
    if (result.stderr) {
      observation += `Errors: ${result.stderr}\\n`;
    }
    
    if (result.data) {
      observation += `Result: ${typeof result.data === 'object' ? JSON.stringify(result.data) : result.data}`;
    }

    return observation.trim() || 'Command executed successfully with no output';
  }

  formatPrompt(steps: ReasoningStep[], goal: string, availableTools: string[]): string {
    const prompt = `You are an AI assistant that uses tools to solve problems step by step. 

Goal: ${goal}

Available Tools:
${availableTools}

Use this format:
Thought: [your reasoning about what to do next]
Action: [tool call in JSON format: {"tool": "tool_name", "args": {...}}]
Observation: [result of the action]
... (continue until you have enough information)
Final Answer: [your final response to accomplish the goal]

Previous Steps:
${steps.map(step => `${step.type.charAt(0).toUpperCase() + step.type.slice(1)}: ${step.content}`).join('\\n')}

Continue reasoning:`;

    return prompt;
  }

  private getAvailableToolsDescription(): string[] {
    const tools = this.toolRegistry.list();
    return tools.map(tool => {
      const params = tool.definition.parameters.map(p => 
        `${p.name}: ${p.type}${p.required ? ' (required)' : ''} - ${p.description}`
      ).join(', ');
      
      return `${tool.definition.name}: ${tool.definition.description} (${params})`;
    });
  }

  private getDefaultConfig(): ReActConfig {
    return {
      maxSteps: 10,
      maxTokensPerStep: 2000,
      temperature: 0.1,
      enableSelfCorrection: true,
      allowDangerousTools: false,
      requireConfirmation: true,
      timeoutMs: 300000,
    };
  }

  validateStep(step: ReasoningStep): boolean {
    return !!(step.id && step.type && step.content && step.timestamp);
  }
}