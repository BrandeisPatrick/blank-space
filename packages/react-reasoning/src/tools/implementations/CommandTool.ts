import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from '../BaseTool';
import { ToolDefinition, ToolContext, ToolResult } from '../types';

const execAsync = promisify(exec);

export class ExecuteCommandTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'execute_command',
      description: 'Execute a shell command',
      parameters: [
        {
          name: 'command',
          type: 'string',
          description: 'Command to execute',
          required: true,
        },
        {
          name: 'args',
          type: 'array',
          description: 'Command arguments',
          default: [],
        },
        {
          name: 'cwd',
          type: 'string',
          description: 'Working directory for command execution',
        },
        {
          name: 'timeout',
          type: 'number',
          description: 'Command timeout in milliseconds',
          default: 30000,
        },
        {
          name: 'env',
          type: 'object',
          description: 'Additional environment variables',
          default: {},
        },
      ],
      category: 'system',
      dangerous: true,
      requiresConfirmation: true,
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      // Security checks
      const dangerousCommands = ['rm -rf', 'sudo', 'passwd', 'chmod 777', 'format', 'del'];
      const commandStr = validatedArgs.command.toLowerCase();
      
      for (const dangerous of dangerousCommands) {
        if (commandStr.includes(dangerous)) {
          throw new Error(`Dangerous command detected: ${dangerous}`);
        }
      }

      const workingDir = validatedArgs.cwd || context.workingDirectory || process.cwd();
      const environment = {
        ...process.env,
        ...context.environment,
        ...validatedArgs.env,
      };

      const fullCommand = Array.isArray(validatedArgs.args) && validatedArgs.args.length > 0
        ? `${validatedArgs.command} ${validatedArgs.args.join(' ')}`
        : validatedArgs.command;

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: workingDir,
        env: environment,
        timeout: validatedArgs.timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      return {
        success: true,
        data: {
          command: fullCommand,
          cwd: workingDir,
        },
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Command execution failed',
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1,
        executionTime: Date.now() - startTime,
      };
    }
  }
}

export class RunNpmCommandTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'run_npm_command',
      description: 'Execute npm commands safely',
      parameters: [
        {
          name: 'script',
          type: 'string',
          description: 'NPM script to run (e.g., "build", "test", "dev")',
          required: true,
        },
        {
          name: 'args',
          type: 'array',
          description: 'Additional arguments for the npm script',
          default: [],
        },
        {
          name: 'cwd',
          type: 'string',
          description: 'Working directory (should contain package.json)',
        },
        {
          name: 'timeout',
          type: 'number',
          description: 'Command timeout in milliseconds',
          default: 120000, // 2 minutes
        },
      ],
      category: 'development',
      requiresConfirmation: false,
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      const workingDir = validatedArgs.cwd || context.workingDirectory || process.cwd();
      
      // Construct npm command
      const command = 'npm run';
      const cmdArgs = [validatedArgs.script, ...validatedArgs.args];
      const fullCommand = `${command} ${cmdArgs.join(' ')}`;

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: workingDir,
        timeout: validatedArgs.timeout,
        maxBuffer: 2 * 1024 * 1024, // 2MB buffer for build output
      });

      return {
        success: true,
        data: {
          script: validatedArgs.script,
          command: fullCommand,
          cwd: workingDir,
        },
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'NPM command failed',
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1,
        executionTime: Date.now() - startTime,
        metadata: {
          script: validatedArgs.script,
          timeout: validatedArgs.timeout,
        },
      };
    }
  }
}

export class GitCommandTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'git_command',
      description: 'Execute git commands safely',
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: 'Git action to perform',
          required: true,
          enum: ['status', 'add', 'commit', 'push', 'pull', 'branch', 'checkout', 'diff', 'log'],
        },
        {
          name: 'args',
          type: 'array',
          description: 'Additional arguments for the git command',
          default: [],
        },
        {
          name: 'cwd',
          type: 'string',
          description: 'Working directory (git repository root)',
        },
      ],
      category: 'development',
      requiresConfirmation: false,
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      const workingDir = validatedArgs.cwd || context.workingDirectory || process.cwd();
      
      const command = 'git';
      const cmdArgs = [validatedArgs.action, ...validatedArgs.args];
      const fullCommand = `${command} ${cmdArgs.join(' ')}`;

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: workingDir,
        timeout: 30000, // 30 seconds
      });

      return {
        success: true,
        data: {
          action: validatedArgs.action,
          command: fullCommand,
          cwd: workingDir,
        },
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Git command failed',
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1,
        executionTime: Date.now() - startTime,
      };
    }
  }
}