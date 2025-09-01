import { z } from 'zod';

// Agent context and communication
export const AgentContextSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

// Agent message types
export const AgentMessageSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  type: z.enum(['input', 'output', 'error', 'system']),
  content: z.any(),
  timestamp: z.date(),
  context: AgentContextSchema.optional(),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

// Agent execution result
export const AgentResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  messages: z.array(AgentMessageSchema).optional(),
});

export type AgentResult<T = any> = z.infer<typeof AgentResultSchema> & {
  data?: T;
};

// Agent configuration
export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  timeout: z.number().default(30000), // 30 seconds
  retries: z.number().default(3),
  dependencies: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  parameters: z.record(z.any()).optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Provider abstraction
export interface AIProvider {
  name: string;
  models: string[];
  defaultModel: string;
  isConfigured(): boolean;
  
  // Core LLM methods
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  
  // Specialized methods (optional)
  generateJSON?(prompt: string, schema?: any, options?: CompletionOptions): Promise<any>;
  classify?(prompt: string, categories: string[], options?: CompletionOptions): Promise<string>;
  embeddings?(texts: string[], options?: EmbeddingOptions): Promise<number[][]>;
}

// LLM options
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  model?: string;
}

export interface ChatOptions extends CompletionOptions {
  systemPrompt?: string;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Agent interfaces
export interface Agent {
  readonly config: AgentConfig;
  readonly provider: AIProvider;
  
  execute(input: any, context?: AgentContext): Promise<AgentResult>;
  validate(input: any): boolean;
  getInputSchema(): z.ZodSchema;
  getOutputSchema(): z.ZodSchema;
}

// Workflow and orchestration
export const WorkflowStepSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  input: z.any(),
  condition: z.string().optional(), // JavaScript condition
  onSuccess: z.string().optional(), // Next step ID
  onFailure: z.string().optional(), // Error handling step ID
  parallel: z.boolean().default(false),
  timeout: z.number().optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(WorkflowStepSchema),
  timeout: z.number().default(300000), // 5 minutes
  retries: z.number().default(0),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Agent registry types
export interface AgentDefinition {
  config: AgentConfig;
  factory: (provider: AIProvider) => Agent;
}

export interface AgentRegistry {
  register(definition: AgentDefinition): void;
  get(id: string): AgentDefinition | undefined;
  list(): AgentDefinition[];
  has(id: string): boolean;
  remove(id: string): boolean;
}

// Execution context for workflows
export interface ExecutionContext {
  sessionId: string;
  workflowId: string;
  variables: Record<string, any>;
  results: Record<string, AgentResult>;
  startTime: Date;
  timeout?: number;
}

// Events
export type AgentEventType = 
  | 'agent.started'
  | 'agent.completed' 
  | 'agent.failed'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.step.started'
  | 'workflow.step.completed'
  | 'workflow.step.failed';

export interface AgentEvent {
  type: AgentEventType;
  agentId?: string;
  workflowId?: string;
  stepId?: string;
  data: any;
  timestamp: Date;
  context?: AgentContext;
}

// Specialized agent types for our system
export interface WebsiteGenerationInput {
  prompt: string;
  device?: string;
  framework?: string;
  context?: string;
}

export interface WebsiteGenerationOutput {
  html: string;
  css: string;
  js: string;
  metadata?: {
    framework?: string;
    dependencies?: string[];
  };
}

export interface ChatInput {
  message: string;
  context?: {
    hasActiveCode?: boolean;
    recentMessages?: string[];
    currentArtifacts?: number;
    responseMode?: 'just-build' | 'show-options' | 'explain-first';
  };
}

export interface IntentClassificationInput {
  message: string;
  hasActiveCode?: boolean;
  responseMode?: 'just-build' | 'show-options' | 'explain-first';
}

export interface IntentClassificationOutput {
  intent: 'generation' | 'modification' | 'explanation' | 'conversation';
  confidence: number;
  reasoning: string;
  shouldExecuteDirectly?: boolean;
  shouldShowOptions?: boolean;
}

// Framework Advisor types
export interface FrameworkAdvisorInput {
  prompt: string;
  requirements?: {
    projectType?: 'landing-page' | 'web-app' | 'dashboard' | 'e-commerce' | 'blog' | 'portfolio' | 'api';
    complexity?: 'simple' | 'medium' | 'complex';
    timeline?: 'urgent' | 'normal' | 'flexible';
    team?: {
      experience?: 'beginner' | 'intermediate' | 'advanced';
      size?: 'solo' | 'small' | 'medium' | 'large';
    };
    performance?: {
      priority?: 'low' | 'medium' | 'high';
      seo?: boolean;
      ssr?: boolean;
    };
    features?: string[];
    constraints?: string[];
  };
  maxAlternatives?: number;
}

export interface FrameworkRecommendation {
  framework: {
    name: string;
    id: string;
    category: string;
    type: string;
    description: string;
  };
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface FrameworkAdvisorOutput {
  primary: FrameworkRecommendation;
  alternatives: FrameworkRecommendation[];
  summary: string;
  nextSteps: string[];
  considerations: string[];
  aiReasoning?: string;
}