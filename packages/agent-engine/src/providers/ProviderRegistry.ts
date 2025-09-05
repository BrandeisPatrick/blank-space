import { AIProvider, ProviderRegistry } from './types';

export class DefaultProviderRegistry implements ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  list(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  remove(name: string): boolean {
    return this.providers.delete(name);
  }

  getConfigured(): AIProvider[] {
    return this.list().filter(provider => provider.isConfigured());
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  clear(): void {
    this.providers.clear();
  }

  getNames(): string[] {
    return Array.from(this.providers.keys());
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const providers = this.getConfigured();
    
    await Promise.all(
      providers.map(async (provider) => {
        try {
          results[provider.name] = await provider.healthCheck();
        } catch {
          results[provider.name] = false;
        }
      })
    );

    return results;
  }

  getBestAvailable(): AIProvider | undefined {
    const configured = this.getConfigured();
    if (configured.length === 0) return undefined;

    // Priority order: OpenAI, Anthropic, Groq, others
    const priority = ['openai', 'anthropic', 'groq'];
    
    for (const name of priority) {
      const provider = configured.find(p => p.name === name);
      if (provider) return provider;
    }

    return configured[0];
  }

  getByCapability(capability: string): AIProvider[] {
    // For now, return all configured providers
    // In the future, we can add capability metadata to providers
    return this.getConfigured();
  }
}