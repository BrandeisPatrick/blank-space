import { Tool, ToolDefinition, ToolContext, ToolResult, ToolParameter } from './types';

export abstract class BaseTool implements Tool {
  public readonly definition: ToolDefinition;

  constructor(definition: ToolDefinition) {
    this.definition = definition;
  }

  abstract execute(args: Record<string, any>, context: ToolContext): Promise<ToolResult>;

  validate(args: Record<string, any>): boolean {
    try {
      // Check required parameters
      for (const param of this.definition.parameters) {
        if (param.required && !(param.name in args)) {
          return false;
        }
      }

      // Validate parameter types
      for (const [key, value] of Object.entries(args)) {
        const param = this.definition.parameters.find(p => p.name === key);
        if (param && !this.validateParameterType(value, param)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private validateParameterType(value: any, param: ToolParameter): boolean {
    switch (param.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  protected createResult(
    success: boolean,
    data?: any,
    error?: string,
    metadata?: Record<string, any>
  ): ToolResult {
    return {
      success,
      data,
      error,
      executionTime: Date.now(), // This should be calculated properly in implementations
      metadata,
    };
  }

  protected validateEnum(value: any, param: ToolParameter): boolean {
    if (!param.enum) return true;
    return param.enum.includes(value);
  }

  protected applyDefaults(args: Record<string, any>): Record<string, any> {
    const result = { ...args };
    
    for (const param of this.definition.parameters) {
      if (!(param.name in result) && param.default !== undefined) {
        result[param.name] = param.default;
      }
    }

    return result;
  }

  getParameterSchema(): Record<string, any> {
    const schema: Record<string, any> = {
      type: 'object',
      properties: {},
      required: [],
    };

    for (const param of this.definition.parameters) {
      schema.properties[param.name] = {
        type: param.type,
        description: param.description,
      };

      if (param.enum) {
        schema.properties[param.name].enum = param.enum;
      }

      if (param.default !== undefined) {
        schema.properties[param.name].default = param.default;
      }

      if (param.required) {
        schema.required.push(param.name);
      }
    }

    return schema;
  }

  getUsageExample(): Record<string, any> {
    const example: Record<string, any> = {};

    for (const param of this.definition.parameters) {
      if (param.default !== undefined) {
        example[param.name] = param.default;
      } else if (param.enum) {
        example[param.name] = param.enum[0];
      } else {
        switch (param.type) {
          case 'string':
            example[param.name] = 'example';
            break;
          case 'number':
            example[param.name] = 0;
            break;
          case 'boolean':
            example[param.name] = false;
            break;
          case 'array':
            example[param.name] = [];
            break;
          case 'object':
            example[param.name] = {};
            break;
        }
      }
    }

    return example;
  }
}