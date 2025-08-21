import { Artifact } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

export interface GenerationOptions {
  device?: string
  framework?: string
}

export class GenerationService {
  private static instance: GenerationService
  
  static getInstance(): GenerationService {
    if (!GenerationService.instance) {
      GenerationService.instance = new GenerationService()
    }
    return GenerationService.instance
  }

  async generateWebsite(prompt: string, options: GenerationOptions = {}): Promise<Artifact> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          device: options.device || 'desktop',
          framework: options.framework || 'vanilla'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.artifact
    } catch (error) {
      console.error('Generation error:', error)
      throw error
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return data.status === 'ok'
    } catch {
      return false
    }
  }
}

export const generationService = GenerationService.getInstance()