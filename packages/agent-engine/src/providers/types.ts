import { z } from 'zod';

// Provider configuration schemas
export const ProviderConfigSchema = z.object({
  name: z.string(),
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  models: z.array(z.string()),
  defaultModel: z.string(),
  enabled: z.boolean().default(true),
  rateLimits: z.object({
    requestsPerMinute: z.number().default(60),
    tokensPerMinute: z.number().default(100000),
  }).optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// Task-specific model configurations
export const TaskModelConfigSchema = z.object({
  planning: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number().default(0.3),
    maxTokens: z.number().default(2000),
  }),
  codeGeneration: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number().default(0.1),
    maxTokens: z.number().default(4000),
  }),
  codeReview: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number().default(0.2),
    maxTokens: z.number().default(3000),
  }),
  documentation: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number().default(0.4),
    maxTokens: z.number().default(2500),
  }),
  conversation: z.object({
    provider: z.string(),
    model: z.string(),
    temperature: z.number().default(0.7),
    maxTokens: z.number().default(1500),
  }),
});

export type TaskModelConfig = z.infer<typeof TaskModelConfigSchema>;

// Task types for model routing
export enum TaskType {
  PLANNING = 'planning',
  CODE_GENERATION = 'codeGeneration',
  CODE_REVIEW = 'codeReview',
  DOCUMENTATION = 'documentation',
  CONVERSATION = 'conversation',
}

// Generation options
export const GenerationOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().default(false),
});

export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;

// Message types for chat
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// Provider interface
export interface AIProvider {
  name: string;
  config: ProviderConfig;
  isConfigured(): boolean;
  
  // Core generation methods
  generateText(prompt: string, options?: GenerationOptions): Promise<string>;
  generateChat(messages: Message[], options?: GenerationOptions): Promise<string>;
  generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>, 
    options?: GenerationOptions
  ): Promise<T>;
  
  // Streaming methods
  streamText(prompt: string, options?: GenerationOptions): AsyncIterable<string>;
  streamChat(messages: Message[], options?: GenerationOptions): AsyncIterable<string>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

// Provider registry
export interface ProviderRegistry {
  register(provider: AIProvider): void;
  get(name: string): AIProvider | undefined;
  list(): AIProvider[];
  remove(name: string): boolean;
  getConfigured(): AIProvider[];
}

// Model router for task-based provider selection
export interface ModelRouter {
  getProviderForTask(taskType: TaskType): AIProvider;
  setTaskConfig(taskType: TaskType, config: TaskModelConfig[TaskType]): void;
  getTaskConfig(taskType: TaskType): TaskModelConfig[TaskType] | undefined;
}