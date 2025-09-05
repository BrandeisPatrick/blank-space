import { z } from 'zod';

// Reasoning step types
export enum StepType {
  THOUGHT = 'thought',
  ACTION = 'action',
  OBSERVATION = 'observation',
  FINAL_ANSWER = 'final_answer',
}

// Reasoning step schema
export const ReasoningStepSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(StepType),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

// Action step specific schema
export const ActionStepSchema = z.object({
  toolName: z.string(),
  arguments: z.record(z.any()),
  reasoning: z.string(),
});

export type ActionStep = z.infer<typeof ActionStepSchema>;

// Reasoning context
export const ReasoningContextSchema = z.object({
  sessionId: z.string(),
  taskId: z.string(),
  goal: z.string(),
  maxSteps: z.number().default(10),
  maxTokensPerStep: z.number().default(2000),
  temperature: z.number().default(0.1),
  currentStep: z.number().default(0),
  completed: z.boolean().default(false),
  workingDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ReasoningContext = z.infer<typeof ReasoningContextSchema>;

// Reasoning result
export const ReasoningResultSchema = z.object({
  success: z.boolean(),
  steps: z.array(ReasoningStepSchema),
  finalAnswer: z.string().optional(),
  error: z.string().optional(),
  totalSteps: z.number(),
  executionTime: z.number(),
  tokensUsed: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export type ReasoningResult = z.infer<typeof ReasoningResultSchema>;

// ReAct loop configuration
export const ReActConfigSchema = z.object({
  maxSteps: z.number().default(10),
  maxTokensPerStep: z.number().default(2000),
  temperature: z.number().default(0.1),
  enableSelfCorrection: z.boolean().default(true),
  allowDangerousTools: z.boolean().default(false),
  requireConfirmation: z.boolean().default(true),
  timeoutMs: z.number().default(300000), // 5 minutes
});

export type ReActConfig = z.infer<typeof ReActConfigSchema>;

// Tool execution request from reasoning
export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, any>;
  reasoning: string;
  requiresConfirmation?: boolean;
}

// Interface for the reasoning engine
export interface ReasoningEngine {
  execute(goal: string, context: ReasoningContext, config?: ReActConfig): Promise<ReasoningResult>;
  executeStreaming(
    goal: string, 
    context: ReasoningContext, 
    config?: ReActConfig
  ): AsyncIterable<ReasoningStep>;
  
  // Utility methods
  validateStep(step: ReasoningStep): boolean;
  parseAction(content: string): ActionStep | null;
  formatPrompt(steps: ReasoningStep[], goal: string, availableTools: string[]): string;
}