import { Command } from 'commander';
import ora from 'ora';
import inquirer from 'inquirer';
import { createReasoningSystem } from '@ui-grid-ai/react-reasoning';
import { StepType, ReasoningStep } from '@ui-grid-ai/react-reasoning';
import { CLIConfigManager } from '../config/CLIConfig';
import { CLIHistory } from '../utils/history';
import { logger, output, status, formatDuration } from '../utils/output';

export interface CodeCommandOptions {
  interactive?: boolean;
  steps?: number;
  dangerous?: boolean;
  confirm?: boolean;
  provider?: string;
  temperature?: number;
  stream?: boolean;
  verbose?: boolean;
}

export class CodeCommand {
  private config: CLIConfigManager;
  private history: CLIHistory;

  constructor(config: CLIConfigManager, history: CLIHistory) {
    this.config = config;
    this.history = history;
  }

  register(program: Command): Command {
    return program
      .command('code')
      .description('Execute coding tasks using AI reasoning')
      .argument('<goal>', 'The coding goal or task to accomplish')
      .option('-i, --interactive', 'Run in interactive mode with confirmations')
      .option('-s, --steps <number>', 'Maximum number of reasoning steps', (val) => parseInt(val), 10)
      .option('-d, --dangerous', 'Allow dangerous operations')
      .option('--no-confirm', 'Skip confirmation prompts')
      .option('-p, --provider <provider>', 'AI provider to use (openai, anthropic, groq)')
      .option('-t, --temperature <number>', 'Temperature for AI generation', (val) => parseFloat(val))
      .option('--stream', 'Stream output in real-time')
      .option('-v, --verbose', 'Verbose output with detailed steps')
      .action(async (goal: string, options: CodeCommandOptions) => {
        await this.execute(goal, options);
      });
  }

  private async execute(goal: string, options: CodeCommandOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate configuration
      if (!this.config.hasConfiguredProvider()) {
        logger.error('No AI provider configured. Run "ai-code config" to set up providers.');
        process.exit(1);
      }

      // Show initial information
      if (options.verbose || options.interactive) {
        console.log(output.title('AI Code Assistant'));
        console.log(output.section('Goal', goal));
        console.log(output.section('Configuration', this.getConfigSummary(options)));
      }

      // Interactive confirmation
      if (options.interactive) {
        const confirmed = await this.confirmExecution(goal, options);
        if (!confirmed) {
          logger.info('Execution cancelled by user');
          return;
        }
      }

      // Load environment variables into config
      this.config.loadFromEnvironment();

      // Create reasoning system
      const reasoningSystem = createReasoningSystem({
        maxSteps: options.steps || this.config.getDefault('maxSteps') || 10,
        allowDangerousTools: options.dangerous || this.config.getDefault('allowDangerousTools') || false,
        requireConfirmation: options.confirm !== false && (this.config.getDefault('requireConfirmation') !== false),
        enableGrounding: true,
        workingDirectory: process.cwd(),
      });

      // Execute the task
      if (options.stream) {
        await this.executeStreaming(goal, reasoningSystem, options, startTime);
      } else {
        await this.executeBatch(goal, reasoningSystem, options, startTime);
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`Execution failed: ${errorMessage}`);
      
      // Record failed execution in history
      this.history.addEntry({
        command: 'code',
        args: [goal],
        goal,
        success: false,
        executionTime,
        error: errorMessage,
        workingDirectory: process.cwd(),
      });

      if (options.verbose) {
        console.error(error);
      }
      
      process.exit(1);
    }
  }

  private async executeBatch(
    goal: string, 
    reasoningSystem: any, 
    options: CodeCommandOptions, 
    startTime: number
  ): Promise<void> {
    const spinner = ora({
      text: 'Initializing AI reasoning...',
      color: 'cyan',
    }).start();

    try {
      const result = await reasoningSystem.executeTaskWithGrounding(goal);
      const executionTime = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        logger.success(`Task completed successfully in ${formatDuration(executionTime)}`);
        
        if (options.verbose) {
          this.displaySteps(result.steps);
        }
        
        if (result.finalAnswer) {
          console.log(output.box(result.finalAnswer, { type: 'success' }));
        }

        // Record successful execution
        this.history.addEntry({
          command: 'code',
          args: [goal],
          goal,
          success: true,
          executionTime,
          steps: result.steps.length,
          workingDirectory: process.cwd(),
        });

      } else {
        logger.error(`Task failed: ${result.error}`);
        
        if (options.verbose && result.steps.length > 0) {
          this.displaySteps(result.steps);
        }

        // Record failed execution
        this.history.addEntry({
          command: 'code',
          args: [goal],
          goal,
          success: false,
          executionTime,
          steps: result.steps.length,
          error: result.error,
          workingDirectory: process.cwd(),
        });
      }

    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async executeStreaming(
    goal: string, 
    reasoningSystem: any, 
    options: CodeCommandOptions, 
    startTime: number
  ): Promise<void> {
    logger.info('Starting streaming execution...');
    console.log(''); // Empty line for spacing

    const steps: ReasoningStep[] = [];
    let finalAnswer: string | undefined;

    try {
      for await (const step of reasoningSystem.executeTaskStreaming(goal)) {
        steps.push(step);
        this.displayStep(step, steps.length);

        if (step.type === StepType.FINAL_ANSWER) {
          finalAnswer = step.content;
          break;
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(''); // Empty line for spacing

      if (finalAnswer) {
        logger.success(`Task completed successfully in ${formatDuration(executionTime)}`);
        console.log(output.box(finalAnswer, { type: 'success' }));

        this.history.addEntry({
          command: 'code',
          args: [goal],
          goal,
          success: true,
          executionTime,
          steps: steps.length,
          workingDirectory: process.cwd(),
        });
      } else {
        logger.warning('Task completed without final answer');
        
        this.history.addEntry({
          command: 'code',
          args: [goal],
          goal,
          success: false,
          executionTime,
          steps: steps.length,
          error: 'No final answer provided',
          workingDirectory: process.cwd(),
        });
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.history.addEntry({
        command: 'code',
        args: [goal],
        goal,
        success: false,
        executionTime,
        steps: steps.length,
        error: errorMessage,
        workingDirectory: process.cwd(),
      });
      
      throw error;
    }
  }

  private displaySteps(steps: ReasoningStep[]): void {
    console.log(output.section('Reasoning Steps', ''));
    
    steps.forEach((step, index) => {
      this.displayStep(step, index + 1);
    });
  }

  private displayStep(step: ReasoningStep, stepNumber: number): void {
    const typeIcons = {
      [StepType.THOUGHT]: '🤔',
      [StepType.ACTION]: '⚡',
      [StepType.OBSERVATION]: '👁️',
      [StepType.FINAL_ANSWER]: '✅',
    };

    const icon = typeIcons[step.type] || '•';
    const title = `${icon} Step ${stepNumber}: ${step.type.charAt(0).toUpperCase() + step.type.slice(1)}`;
    
    console.log(output.primary(title));
    console.log(output.muted(step.content));
    console.log(''); // Empty line for spacing
  }

  private async confirmExecution(goal: string, options: CodeCommandOptions): Promise<boolean> {
    console.log(output.section('Review Settings', this.getConfigSummary(options)));
    
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Do you want to proceed with this configuration?',
        default: true,
      },
    ]);

    return confirmed;
  }

  private getConfigSummary(options: CodeCommandOptions): string {
    const lines = [
      `Max Steps: ${options.steps || this.config.getDefault('maxSteps') || 10}`,
      `Dangerous Tools: ${options.dangerous || this.config.getDefault('allowDangerousTools') ? 'Enabled' : 'Disabled'}`,
      `Confirmation: ${options.confirm !== false ? 'Enabled' : 'Disabled'}`,
      `Streaming: ${options.stream ? 'Enabled' : 'Disabled'}`,
      `Verbose: ${options.verbose ? 'Enabled' : 'Disabled'}`,
      `Working Directory: ${process.cwd()}`,
      `Configured Providers: ${this.config.getConfiguredProviders().join(', ')}`,
    ];

    return lines.join('\\n');
  }
}