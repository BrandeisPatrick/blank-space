import { Command } from 'commander';
import inquirer from 'inquirer';
import { CLIConfigManager, CLIConfig } from '../config/CLIConfig';
import { logger, output } from '../utils/output';

export class ConfigCommand {
  private config: CLIConfigManager;

  constructor(config: CLIConfigManager) {
    this.config = config;
  }

  register(program: Command): Command {
    const configCmd = program
      .command('config')
      .description('Manage CLI configuration');

    // Show current configuration
    configCmd
      .command('show')
      .description('Show current configuration')
      .action(() => this.showConfig());

    // Set provider API keys
    configCmd
      .command('set-provider')
      .description('Configure AI provider API keys')
      .option('-p, --provider <provider>', 'Provider name (openai, anthropic, groq)')
      .option('-k, --api-key <key>', 'API key')
      .action(async (options) => {
        await this.setProvider(options.provider, options.apiKey);
      });

    // Interactive setup
    configCmd
      .command('setup')
      .description('Interactive configuration setup')
      .action(async () => {
        await this.interactiveSetup();
      });

    // Set defaults
    configCmd
      .command('defaults')
      .description('Configure default behavior')
      .option('--max-steps <number>', 'Default maximum reasoning steps', (val) => parseInt(val))
      .option('--dangerous', 'Allow dangerous tools by default')
      .option('--no-confirm', 'Disable confirmation prompts by default')
      .option('--temperature <number>', 'Default temperature', (val) => parseFloat(val))
      .action((options) => this.setDefaults(options));

    // Reset configuration
    configCmd
      .command('reset')
      .description('Reset configuration to defaults')
      .option('-y, --yes', 'Skip confirmation')
      .action((options) => this.resetConfig(options.yes));

    // Validate configuration
    configCmd
      .command('validate')
      .description('Validate current configuration')
      .action(() => this.validateConfig());

    return configCmd;
  }

  private showConfig(): void {
    const config = this.config.getConfig();
    
    console.log(output.title('Current Configuration'));
    console.log(this.formatConfig(config));
    
    console.log(output.section('Configuration File', this.config.getConfigPath()));
    
    const configuredProviders = this.config.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      logger.success(`Configured providers: ${configuredProviders.join(', ')}`);
    } else {
      logger.warning('No providers configured');
    }
  }

  private async setProvider(provider?: string, apiKey?: string): Promise<void> {
    let selectedProvider = provider;
    let selectedApiKey = apiKey;

    if (!selectedProvider) {
      const { provider: providerAnswer } = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Select AI provider:',
          choices: [
            { name: 'OpenAI', value: 'openai' },
            { name: 'Anthropic (Claude)', value: 'anthropic' },
            { name: 'Groq', value: 'groq' },
          ],
        },
      ]);
      selectedProvider = providerAnswer;
    }

    if (!selectedApiKey) {
      const { apiKey: keyAnswer } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `Enter ${selectedProvider.toUpperCase()} API key:`,
          mask: '*',
          validate: (input) => {
            if (!input.trim()) return 'API key is required';
            return true;
          },
        },
      ]);
      selectedApiKey = keyAnswer;
    }

    if (!['openai', 'anthropic', 'groq'].includes(selectedProvider)) {
      logger.error('Invalid provider. Must be one of: openai, anthropic, groq');
      return;
    }

    this.config.setProviderApiKey(selectedProvider as 'openai' | 'anthropic' | 'groq', selectedApiKey);
    logger.success(`${selectedProvider.toUpperCase()} API key configured successfully`);
  }

  private async interactiveSetup(): Promise<void> {
    console.log(output.title('AI Code Assistant Setup'));
    console.log('Let\\'s configure your AI coding assistant.\\n');

    // Provider selection
    const { selectedProviders } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Which AI providers would you like to configure?',
        choices: [
          { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'Groq (Fast inference)', value: 'groq' },
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'Please select at least one provider';
          }
          return true;
        },
      },
    ]);

    // Configure each selected provider
    for (const provider of selectedProviders) {
      await this.setProvider(provider);
    }

    // Default settings
    const { defaults } = await inquirer.prompt([
      {
        type: 'input',
        name: 'maxSteps',
        message: 'Default maximum reasoning steps:',
        default: '10',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > 50) {
            return 'Please enter a number between 1 and 50';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'allowDangerous',
        message: 'Allow dangerous operations by default?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'requireConfirmation',
        message: 'Require confirmation for potentially destructive actions?',
        default: true,
      },
      {
        type: 'input',
        name: 'temperature',
        message: 'Default AI temperature (0.0-1.0, lower = more focused):',
        default: '0.1',
        validate: (input) => {
          const num = parseFloat(input);
          if (isNaN(num) || num < 0 || num > 1) {
            return 'Please enter a number between 0.0 and 1.0';
          }
          return true;
        },
      },
    ]);

    this.config.updateConfig({
      defaults: {
        maxSteps: parseInt(defaults.maxSteps),
        allowDangerousTools: defaults.allowDangerous,
        requireConfirmation: defaults.requireConfirmation,
        temperature: parseFloat(defaults.temperature),
        workingDirectory: process.cwd(),
      },
    });

    // UI preferences
    const { ui } = await inquirer.prompt([
      {
        type: 'list',
        name: 'theme',
        message: 'Select color theme:',
        choices: [
          { name: 'Dark (recommended)', value: 'dark' },
          { name: 'Light', value: 'light' },
          { name: 'Auto (system)', value: 'auto' },
        ],
        default: 'dark',
      },
      {
        type: 'confirm',
        name: 'animations',
        message: 'Enable animations and spinners?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'verboseOutput',
        message: 'Enable verbose output by default?',
        default: false,
      },
    ]);

    this.config.updateConfig({ ui });

    console.log('\\n' + output.box('Setup completed successfully!', { type: 'success' }));
    console.log('\\nYou can now use the AI Code Assistant. Try:');
    console.log(output.muted('  ai-code code "Create a simple React component"'));
    console.log(output.muted('  ai-code --help'));
  }

  private setDefaults(options: any): void {
    const updates: Partial<CLIConfig['defaults']> = {};

    if (options.maxSteps !== undefined) {
      if (options.maxSteps < 1 || options.maxSteps > 50) {
        logger.error('Max steps must be between 1 and 50');
        return;
      }
      updates.maxSteps = options.maxSteps;
    }

    if (options.dangerous !== undefined) {
      updates.allowDangerousTools = options.dangerous;
    }

    if (options.confirm === false) {
      updates.requireConfirmation = false;
    }

    if (options.temperature !== undefined) {
      if (options.temperature < 0 || options.temperature > 1) {
        logger.error('Temperature must be between 0.0 and 1.0');
        return;
      }
      updates.temperature = options.temperature;
    }

    this.config.updateConfig({ defaults: updates });
    logger.success('Default settings updated');
    this.showConfig();
  }

  private async resetConfig(skipConfirmation: boolean): Promise<void> {
    if (!skipConfirmation) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'This will reset all configuration to defaults. Continue?',
          default: false,
        },
      ]);

      if (!confirmed) {
        logger.info('Reset cancelled');
        return;
      }
    }

    this.config.reset();
    logger.success('Configuration reset to defaults');
  }

  private validateConfig(): void {
    const validation = this.config.validate();
    
    if (validation.valid) {
      logger.success('Configuration is valid');
      
      const configuredProviders = this.config.getConfiguredProviders();
      if (configuredProviders.length > 0) {
        logger.success(`Ready to use with providers: ${configuredProviders.join(', ')}`);
      } else {
        logger.warning('No providers configured - run "ai-code config setup" to get started');
      }
    } else {
      logger.error('Configuration validation failed:');
      if (validation.errors) {
        validation.errors.forEach(error => logger.error(`  • ${error}`));
      }
    }
  }

  private formatConfig(config: CLIConfig): string {
    const sections = [];

    // Providers section
    const providerInfo = [];
    if (config.providers?.openai?.apiKey) providerInfo.push('✓ OpenAI');
    if (config.providers?.anthropic?.apiKey) providerInfo.push('✓ Anthropic');
    if (config.providers?.groq?.apiKey) providerInfo.push('✓ Groq');
    if (providerInfo.length === 0) providerInfo.push('✗ No providers configured');

    sections.push(output.section('Providers', providerInfo.join('\\n')));

    // Defaults section
    const defaults = config.defaults || {};
    const defaultInfo = [
      `Max Steps: ${defaults.maxSteps || 10}`,
      `Dangerous Tools: ${defaults.allowDangerousTools ? 'Enabled' : 'Disabled'}`,
      `Require Confirmation: ${defaults.requireConfirmation !== false ? 'Enabled' : 'Disabled'}`,
      `Temperature: ${defaults.temperature || 0.1}`,
      `Working Directory: ${defaults.workingDirectory || process.cwd()}`,
    ];

    sections.push(output.section('Defaults', defaultInfo.join('\\n')));

    // UI section
    const ui = config.ui || {};
    const uiInfo = [
      `Theme: ${ui.theme || 'dark'}`,
      `Animations: ${ui.animations !== false ? 'Enabled' : 'Disabled'}`,
      `Verbose Output: ${ui.verboseOutput ? 'Enabled' : 'Disabled'}`,
      `Show Timestamps: ${ui.showTimestamps ? 'Enabled' : 'Disabled'}`,
    ];

    sections.push(output.section('UI Preferences', uiInfo.join('\\n')));

    return sections.join('\\n');
  }
}