import { AIProvider, ProviderName, ProviderConfig } from './types'
import { OpenAIProvider } from './openai.provider'

export class ProviderFactory {
  private static providers: Map<ProviderName, AIProvider> = new Map()

  static createProvider(name: ProviderName, config?: ProviderConfig): AIProvider {
    // Check if we already have this provider cached
    const cacheKey = name
    if (this.providers.has(cacheKey) && !config) {
      return this.providers.get(cacheKey)!
    }

    // Get configuration from environment if not provided
    const providerConfig: ProviderConfig = config || this.getConfigFromEnv(name)
    
    let provider: AIProvider

    switch (name) {
      case 'openai':
        provider = new OpenAIProvider(providerConfig)
        break
      default:
        throw new Error(`Unknown provider: ${name}`)
    }

    // Cache the provider if it's configured
    if (provider.isConfigured()) {
      this.providers.set(cacheKey, provider)
    }

    return provider
  }

  static getConfigFromEnv(name: ProviderName): ProviderConfig {
    const config: ProviderConfig = {}

    switch (name) {
      case 'openai':
        config.apiKey = process.env.OPENAI_API_KEY
        config.model = process.env.OPENAI_MODEL
        config.organizationId = process.env.OPENAI_ORG_ID
        break
    }

    return config
  }

  static getDefaultProvider(): AIProvider {
    // Use AI_PROVIDER from environment or fallback to openai
    const defaultProviderName = (process.env.AI_PROVIDER as ProviderName) || 'openai'
    return this.createProvider(defaultProviderName)
  }

  static getAvailableProviders(): { name: ProviderName; configured: boolean; models: string[] }[] {
    // Return all supported providers
    const providers: ProviderName[] = ['openai']
    
    return providers.map(name => {
      const provider = this.createProvider(name)
      return {
        name,
        configured: provider.isConfigured(),
        models: provider.models
      }
    })
  }

  static clearCache(): void {
    this.providers.clear()
  }
}