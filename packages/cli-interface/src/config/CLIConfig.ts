import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';

// CLI configuration schema
export const CLIConfigSchema = z.object({
  // AI Provider settings
  providers: z.object({
    openai: z.object({
      apiKey: z.string().optional(),
      defaultModel: z.string().default('gpt-4o'),
    }).optional(),
    anthropic: z.object({
      apiKey: z.string().optional(),
      defaultModel: z.string().default('claude-3-5-sonnet-20241022'),
    }).optional(),
    groq: z.object({
      apiKey: z.string().optional(),
      defaultModel: z.string().default('llama-3.1-70b-versatile'),
    }).optional(),
  }).default({}),

  // Default behavior settings
  defaults: z.object({
    maxSteps: z.number().default(10),
    allowDangerousTools: z.boolean().default(false),
    requireConfirmation: z.boolean().default(true),
    temperature: z.number().default(0.1),
    workingDirectory: z.string().default(process.cwd()),
  }).default({}),

  // UI preferences
  ui: z.object({
    theme: z.enum(['dark', 'light', 'auto']).default('auto'),
    animations: z.boolean().default(true),
    verboseOutput: z.boolean().default(false),
    showTimestamps: z.boolean().default(false),
  }).default({}),

  // History settings
  history: z.object({
    enabled: z.boolean().default(true),
    maxEntries: z.number().default(100),
    saveToFile: z.boolean().default(true),
  }).default({}),
});

export type CLIConfig = z.infer<typeof CLIConfigSchema>;

export class CLIConfigManager {
  private configPath: string;
  private config: CLIConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.ai-code', 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): CLIConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readJsonSync(this.configPath);
        return CLIConfigSchema.parse(configData);
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
    }

    return CLIConfigSchema.parse({});
  }

  private saveConfig(): void {
    try {
      fs.ensureDirSync(path.dirname(this.configPath));
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getConfig(): CLIConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = CLIConfigSchema.parse({
      ...this.config,
      ...updates,
    });
    this.saveConfig();
  }

  // Provider management
  setProviderApiKey(provider: 'openai' | 'anthropic' | 'groq', apiKey: string): void {
    this.config.providers = this.config.providers || {};
    this.config.providers[provider] = {
      ...this.config.providers[provider],
      apiKey,
    };
    this.saveConfig();
  }

  getProviderApiKey(provider: 'openai' | 'anthropic' | 'groq'): string | undefined {
    return this.config.providers[provider]?.apiKey;
  }

  // Defaults management
  setDefault<K extends keyof CLIConfig['defaults']>(
    key: K, 
    value: CLIConfig['defaults'][K]
  ): void {
    this.config.defaults = this.config.defaults || {};
    this.config.defaults[key] = value;
    this.saveConfig();
  }

  getDefault<K extends keyof CLIConfig['defaults']>(
    key: K
  ): CLIConfig['defaults'][K] {
    return this.config.defaults?.[key];
  }

  // UI preferences
  setUIPreference<K extends keyof CLIConfig['ui']>(
    key: K, 
    value: CLIConfig['ui'][K]
  ): void {
    this.config.ui = this.config.ui || {};
    this.config.ui[key] = value;
    this.saveConfig();
  }

  getUIPreference<K extends keyof CLIConfig['ui']>(
    key: K
  ): CLIConfig['ui'][K] {
    return this.config.ui?.[key];
  }

  // Environment variable integration
  loadFromEnvironment(): void {
    const updates: Partial<CLIConfig> = {};

    // Load provider API keys from environment
    if (process.env.OPENAI_API_KEY) {
      updates.providers = {
        ...updates.providers,
        openai: { apiKey: process.env.OPENAI_API_KEY },
      };
    }

    if (process.env.ANTHROPIC_API_KEY) {
      updates.providers = {
        ...updates.providers,
        anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
      };
    }

    if (process.env.GROQ_API_KEY) {
      updates.providers = {
        ...updates.providers,
        groq: { apiKey: process.env.GROQ_API_KEY },
      };
    }

    if (Object.keys(updates).length > 0) {
      this.updateConfig(updates);
    }
  }

  // Reset configuration
  reset(): void {
    this.config = CLIConfigSchema.parse({});
    this.saveConfig();
  }

  // Get configuration file path
  getConfigPath(): string {
    return this.configPath;
  }

  // Validate current configuration
  validate(): { valid: boolean; errors?: string[] } {
    try {
      CLIConfigSchema.parse(this.config);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error'],
      };
    }
  }

  // Check if at least one provider is configured
  hasConfiguredProvider(): boolean {
    const providers = this.config.providers;
    return !!(
      providers?.openai?.apiKey ||
      providers?.anthropic?.apiKey ||
      providers?.groq?.apiKey
    );
  }

  // Get list of configured providers
  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    const config = this.config.providers;

    if (config?.openai?.apiKey) providers.push('openai');
    if (config?.anthropic?.apiKey) providers.push('anthropic');
    if (config?.groq?.apiKey) providers.push('groq');

    return providers;
  }
}