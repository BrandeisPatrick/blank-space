import { z } from 'zod';

// Tool parameter schema
export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string(),
  required: z.boolean().default(false),
  default: z.any().optional(),
  enum: z.array(z.any()).optional(),
});

export type ToolParameter = z.infer<typeof ToolParameterSchema>;

// Tool definition schema
export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(ToolParameterSchema),
  category: z.string().optional(),
  version: z.string().default('1.0.0'),
  dangerous: z.boolean().default(false),
  requiresConfirmation: z.boolean().default(false),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// Tool execution context
export const ToolContextSchema = z.object({
  sessionId: z.string(),
  taskId: z.string(),
  userId: z.string().optional(),
  workingDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ToolContext = z.infer<typeof ToolContextSchema>;

// Tool result schema
export const ToolResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().optional(),
  executionTime: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

// Tool interface
export interface Tool {
  definition: ToolDefinition;
  execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult>;
  validate(args: Record<string, any>): boolean;
}

// Tool registry interface
export interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
  listByCategory(category: string): Tool[];
  remove(name: string): boolean;
  has(name: string): boolean;
  validate(name: string, args: Record<string, any>): boolean;
}