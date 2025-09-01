import { z } from 'zod';

// Project requirement schemas
export const ProjectRequirementsSchema = z.object({
  description: z.string().min(1),
  projectType: z.enum([
    'web-app',
    'mobile-app',
    'desktop-app',
    'landing-page',
    'dashboard',
    'e-commerce',
    'blog',
    'portfolio',
    'api',
    'other'
  ]).optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).optional(),
  team: z.object({
    size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
    experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }).optional(),
  performance: z.object({
    priority: z.enum(['low', 'medium', 'high']).optional(),
    seo: z.boolean().optional(),
    ssr: z.boolean().optional(),
  }).optional(),
  timeline: z.enum(['urgent', 'normal', 'flexible']).optional(),
  budget: z.enum(['limited', 'moderate', 'flexible']).optional(),
  maintenance: z.enum(['minimal', 'regular', 'extensive']).optional(),
  explicitFramework: z.string().optional(),
  features: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
});

export type ProjectRequirements = z.infer<typeof ProjectRequirementsSchema>;

// Framework information
export const FrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['frontend', 'fullstack', 'backend', 'mobile', 'desktop']),
  type: z.enum(['library', 'framework', 'meta-framework']),
  language: z.string(),
  learningCurve: z.enum(['easy', 'moderate', 'steep']),
  communitySize: z.enum(['small', 'medium', 'large']),
  maturity: z.enum(['experimental', 'stable', 'mature']),
  performance: z.object({
    bundleSize: z.enum(['small', 'medium', 'large']),
    runtime: z.enum(['fast', 'moderate', 'slow']),
    buildTime: z.enum(['fast', 'moderate', 'slow']),
  }),
  features: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bestFor: z.array(z.string()),
  notRecommendedFor: z.array(z.string()),
  ecosystem: z.object({
    uiLibraries: z.array(z.string()),
    stateManagement: z.array(z.string()),
    routing: z.array(z.string()),
    testing: z.array(z.string()),
  }),
  documentation: z.enum(['poor', 'good', 'excellent']),
  enterpriseSupport: z.boolean(),
});

export type Framework = z.infer<typeof FrameworkSchema>;

// Analysis result
export const AnalysisResultSchema = z.object({
  framework: FrameworkSchema,
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  alternatives: z.array(z.object({
    framework: FrameworkSchema,
    reason: z.string(),
  })),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// Recommendation result
export const RecommendationSchema = z.object({
  primary: AnalysisResultSchema,
  alternatives: z.array(AnalysisResultSchema),
  summary: z.string(),
  nextSteps: z.array(z.string()),
  considerations: z.array(z.string()),
  aiReasoning: z.string().optional(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// Analysis criteria weights
export const AnalysisCriteriaSchema = z.object({
  performance: z.number().min(0).max(1).default(0.2),
  learningCurve: z.number().min(0).max(1).default(0.15),
  community: z.number().min(0).max(1).default(0.1),
  ecosystem: z.number().min(0).max(1).default(0.15),
  maintenance: z.number().min(0).max(1).default(0.1),
  projectFit: z.number().min(0).max(1).default(0.3),
});

export type AnalysisCriteria = z.infer<typeof AnalysisCriteriaSchema>;

// Prompt analysis result
export const PromptAnalysisSchema = z.object({
  explicitFramework: z.string().optional(),
  implicitFramework: z.string().optional(),
  projectType: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).optional(),
  keyTerms: z.array(z.string()),
  requirements: z.array(z.string()),
  constraints: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type PromptAnalysis = z.infer<typeof PromptAnalysisSchema>;

// Configuration
export const ConfigSchema = z.object({
  defaultCriteria: AnalysisCriteriaSchema.optional(),
  aiProvider: z.string().optional(),
  enableAiReasoning: z.boolean().default(true),
  maxAlternatives: z.number().min(1).max(10).default(3),
  minScore: z.number().min(0).max(100).default(20),
});

export type Config = z.infer<typeof ConfigSchema>;