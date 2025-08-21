import { z } from 'zod'

export const GenerationRequestSchema = z.object({
  device: z.string(),
  region: z.object({
    start: z.object({ x: z.number(), y: z.number() }),
    end: z.object({ x: z.number(), y: z.number() })
  }),
  context: z.string().optional(),
  prompt: z.string()
})

export const GenerationResponseSchema = z.object({
  files: z.record(z.string()),
  entry: z.string(),
  metadata: z.object({
    framework: z.string().optional(),
    dependencies: z.array(z.string()).optional()
  }).optional()
})

export const ArtifactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  regionId: z.string(),
  files: z.record(z.string()),
  entry: z.string(),
  metadata: z.object({
    device: z.string(),
    region: z.object({
      start: z.object({ x: z.number(), y: z.number() }),
      end: z.object({ x: z.number(), y: z.number() })
    }),
    framework: z.string().optional(),
    dependencies: z.array(z.string()).optional()
  }),
  createdAt: z.string(),
  author: z.string().optional()
})

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>
export type Artifact = z.infer<typeof ArtifactSchema>