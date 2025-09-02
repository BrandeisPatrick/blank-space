import { AIProvider, ProviderName, ProviderConfig } from './types'
import { GroqProvider } from './groq.provider'
import { OpenAIProvider } from './openai.provider'
import { AnthropicProvider } from './anthropic.provider'
import { GeminiProvider } from './gemini.provider'
import { CohereProvider } from './cohere.provider'
import { TogetherProvider } from './together.provider'

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
      case 'groq':
        provider = new GroqProvider(providerConfig)
        break
      case 'openai':
        provider = new OpenAIProvider(providerConfig)
        break
      case 'anthropic':
        provider = new AnthropicProvider(providerConfig)
        break
      case 'gemini':
        provider = new GeminiProvider(providerConfig)
        break
      case 'cohere':
        provider = new CohereProvider(providerConfig)
        break
      case 'together':
        provider = new TogetherProvider(providerConfig)
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
      case 'groq':
        config.apiKey = process.env.GROQ_API_KEY
        config.model = process.env.GROQ_MODEL
        break
      case 'openai':
        config.apiKey = process.env.OPENAI_API_KEY
        config.model = process.env.OPENAI_MODEL
        config.organizationId = process.env.OPENAI_ORG_ID
        break
      case 'anthropic':
        config.apiKey = process.env.ANTHROPIC_API_KEY
        config.model = process.env.ANTHROPIC_MODEL
        break
      case 'gemini':
        config.apiKey = process.env.GEMINI_API_KEY
        config.model = process.env.GEMINI_MODEL
        break
      case 'cohere':
        config.apiKey = process.env.COHERE_API_KEY
        config.model = process.env.COHERE_MODEL
        break
      case 'together':
        config.apiKey = process.env.TOGETHER_API_KEY
        config.model = process.env.TOGETHER_MODEL
        break
    }

    return config
  }

  static getDefaultProvider(): AIProvider {
    // Force Groq as the only provider
    return this.createProvider('groq')
  }

  static getAvailableProviders(): { name: ProviderName; configured: boolean; models: string[] }[] {
    // Only return Groq as available provider
    const providers: ProviderName[] = ['groq']
    
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