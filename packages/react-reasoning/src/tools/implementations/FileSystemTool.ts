import * as fs from 'fs-extra';
import * as path from 'path';
import { BaseTool } from '../BaseTool';
import { ToolDefinition, ToolContext, ToolResult } from '../types';

export class ReadFileTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to the file to read',
          required: true,
        },
        {
          name: 'encoding',
          type: 'string',
          description: 'File encoding',
          default: 'utf8',
          enum: ['utf8', 'binary', 'base64'],
        },
      ],
      category: 'filesystem',
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      const filePath = path.resolve(context.workingDirectory || process.cwd(), validatedArgs.path);
      
      // Security check - ensure path is within working directory
      const workingDir = path.resolve(context.workingDirectory || process.cwd());
      if (!filePath.startsWith(workingDir)) {
        throw new Error('Access denied: Path outside working directory');
      }

      const exists = await fs.pathExists(filePath);
      if (!exists) {
        throw new Error(`File not found: ${validatedArgs.path}`);
      }

      const content = await fs.readFile(filePath, validatedArgs.encoding);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        data: {
          content,
          path: validatedArgs.path,
          size: stats.size,
          modified: stats.mtime,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }
}

export class WriteFileTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'write_file',
      description: 'Write content to a file',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to the file to write',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write to the file',
          required: true,
        },
        {
          name: 'encoding',
          type: 'string',
          description: 'File encoding',
          default: 'utf8',
          enum: ['utf8', 'binary', 'base64'],
        },
        {
          name: 'createDirs',
          type: 'boolean',
          description: 'Create parent directories if they dont exist',
          default: true,
        },
      ],
      category: 'filesystem',
      dangerous: true,
      requiresConfirmation: true,
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      const filePath = path.resolve(context.workingDirectory || process.cwd(), validatedArgs.path);
      
      // Security check
      const workingDir = path.resolve(context.workingDirectory || process.cwd());
      if (!filePath.startsWith(workingDir)) {
        throw new Error('Access denied: Path outside working directory');
      }

      if (validatedArgs.createDirs) {
        await fs.ensureDir(path.dirname(filePath));
      }

      await fs.writeFile(filePath, validatedArgs.content, validatedArgs.encoding);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        data: {
          path: validatedArgs.path,
          size: stats.size,
          written: validatedArgs.content.length,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }
}

export class ListDirectoryTool extends BaseTool {
  constructor() {
    const definition: ToolDefinition = {
      name: 'list_directory',
      description: 'List contents of a directory',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to the directory to list',
          default: '.',
        },
        {
          name: 'includeHidden',
          type: 'boolean',
          description: 'Include hidden files and directories',
          default: false,
        },
        {
          name: 'recursive',
          type: 'boolean',
          description: 'List contents recursively',
          default: false,
        },
      ],
      category: 'filesystem',
    };
    super(definition);
  }

  async execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();
    const validatedArgs = this.applyDefaults(args);

    try {
      const dirPath = path.resolve(context.workingDirectory || process.cwd(), validatedArgs.path);
      
      // Security check
      const workingDir = path.resolve(context.workingDirectory || process.cwd());
      if (!dirPath.startsWith(workingDir)) {
        throw new Error('Access denied: Path outside working directory');
      }

      const exists = await fs.pathExists(dirPath);
      if (!exists) {
        throw new Error(`Directory not found: ${validatedArgs.path}`);
      }

      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${validatedArgs.path}`);
      }

      const items = await this.listItems(dirPath, validatedArgs.includeHidden, validatedArgs.recursive);

      return {
        success: true,
        data: {
          path: validatedArgs.path,
          items,
          count: items.length,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async listItems(dirPath: string, includeHidden: boolean, recursive: boolean): Promise<any[]> {
    const items: any[] = [];
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      if (!includeHidden && entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const stats = await fs.stat(fullPath);
      
      const item = {
        name: entry,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
      };

      items.push(item);

      if (recursive && stats.isDirectory()) {
        const subItems = await this.listItems(fullPath, includeHidden, recursive);
        items.push(...subItems);
      }
    }

    return items;
  }
}