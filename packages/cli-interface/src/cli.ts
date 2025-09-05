#!/usr/bin/env node

import { Command } from 'commander';
import { CLIConfigManager } from './config/CLIConfig';
import { CLIHistory } from './utils/history';
import { output, setTheme, logger } from './utils/output';
import { CodeCommand, ConfigCommand, HistoryCommand } from './commands';

async function main() {
  try {
    // Initialize configuration and history
    const config = new CLIConfigManager();
    const history = new CLIHistory({
      maxEntries: config.getDefault('maxEntries') || 100,
      saveToFile: config.getUIPreference('history')?.enabled !== false,
    });

    // Set theme
    const theme = config.getUIPreference('theme') || 'dark';
    if (theme !== 'auto') {
      setTheme(theme);
    }

    // Create main program
    const program = new Command();

    program
      .name('ai-code')
      .description('AI-powered coding assistant with reasoning capabilities')
      .version('0.1.0');

    // Show logo and introduction on help
    program.on('--help', async () => {
      console.log('\\n' + await output.logo('AI CODE'));
      console.log('\\n' + output.muted('An intelligent coding assistant that thinks step by step.'));
      console.log('\\nExample usage:');
      console.log(output.muted('  ai-code code "Create a React component for a todo list"'));
      console.log(output.muted('  ai-code config setup'));
      console.log(output.muted('  ai-code history list'));
    });

    // Register commands
    const codeCommand = new CodeCommand(config, history);
    const configCommand = new ConfigCommand(config);
    const historyCommand = new HistoryCommand(history);

    codeCommand.register(program);
    configCommand.register(program);
    historyCommand.register(program);

    // Add global options
    program
      .option('-v, --verbose', 'Enable verbose output')
      .option('--debug', 'Enable debug logging');

    // Handle global options
    program.hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      
      if (opts.debug) {
        process.env.DEBUG = 'true';
        logger.debug('Debug mode enabled');
      }
      
      if (opts.verbose) {
        logger.debug('Verbose mode enabled');
      }
    });

    // Default action - show help if no command provided
    program.action(async () => {
      console.log(await output.logo('AI CODE'));
      console.log('\\n' + output.muted('An intelligent coding assistant that thinks step by step.'));
      
      // Check if configured
      if (!config.hasConfiguredProvider()) {
        console.log('\\n' + output.box(
          'Welcome to AI Code Assistant!\\n\\n' +
          'To get started, please configure at least one AI provider:\\n' +
          '  ai-code config setup\\n\\n' +
          'Or set an API key directly:\\n' +
          '  ai-code config set-provider --provider openai --api-key YOUR_KEY',
          { type: 'info' }
        ));
      } else {
        console.log('\\nReady to assist! Try:');
        console.log(output.muted('  ai-code code "Create a simple React component"'));
        console.log(output.muted('  ai-code --help'));
      }
    });

    // Error handling
    program.exitOverride((err) => {
      if (err.code === 'commander.help') {
        process.exit(0);
      } else if (err.code === 'commander.version') {
        process.exit(0);
      } else {
        logger.error(`Command failed: ${err.message}`);
        process.exit(1);
      }
    });

    // Parse command line arguments
    await program.parseAsync(process.argv);

  } catch (error) {
    logger.error('Unexpected error:');
    console.error(error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  logger.error('Failed to start CLI:', error);
  process.exit(1);
});