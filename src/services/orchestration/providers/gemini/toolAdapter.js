/**
 * Gemini Tool Adapter
 * Converts tools from OpenAI format to Gemini functionDeclarations format
 */

import { Type } from '@google/genai';

/**
 * Map JavaScript/JSON Schema types to Gemini Type enum
 */
function mapType(jsonSchemaType) {
  switch (jsonSchemaType?.toLowerCase()) {
    case 'string':
      return Type.STRING;
    case 'number':
    case 'integer':
      return Type.NUMBER;
    case 'boolean':
      return Type.BOOLEAN;
    case 'array':
      return Type.ARRAY;
    case 'object':
      return Type.OBJECT;
    default:
      return Type.STRING;
  }
}

/**
 * Convert a single parameter definition to Gemini format
 */
function convertParameter(name, schema) {
  const result = {
    type: mapType(schema.type),
    description: schema.description || `Parameter: ${name}`,
  };

  // Handle enum values
  if (schema.enum) {
    result.enum = schema.enum;
  }

  // Handle array items
  if (schema.type === 'array' && schema.items) {
    result.items = {
      type: mapType(schema.items.type),
    };
    if (schema.items.description) {
      result.items.description = schema.items.description;
    }
  }

  // Handle nested object properties
  if (schema.type === 'object' && schema.properties) {
    result.properties = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      result.properties[propName] = convertParameter(propName, propSchema);
    }
    if (schema.required) {
      result.required = schema.required;
    }
  }

  return result;
}

/**
 * Convert tool parameters from JSON Schema to Gemini format
 */
function convertParameters(parameters) {
  if (!parameters || !parameters.properties) {
    return {};
  }

  const properties = {};
  for (const [name, schema] of Object.entries(parameters.properties)) {
    properties[name] = convertParameter(name, schema);
  }

  return properties;
}

/**
 * Convert a single tool to Gemini functionDeclaration format
 */
function convertToolToGemini(tool) {
  const schema = tool.toOpenAISchema ? tool.toOpenAISchema() : tool;
  const func = schema.function || schema;

  return {
    name: func.name,
    description: func.description || `Tool: ${func.name}`,
    parameters: {
      type: Type.OBJECT,
      properties: convertParameters(func.parameters),
      required: func.parameters?.required || [],
    },
  };
}

/**
 * Convert all tools from a ToolRegistry to Gemini format
 * @param {ToolRegistry} toolRegistry - Registry containing tools
 * @returns {Array} Gemini tools configuration
 */
export function convertToolsToGeminiFormat(toolRegistry) {
  const toolNames = toolRegistry.getToolNames();
  const functionDeclarations = [];

  for (const name of toolNames) {
    const tool = toolRegistry.getTool(name);
    if (tool) {
      functionDeclarations.push(convertToolToGemini(tool));
    }
  }

  return [{
    functionDeclarations,
  }];
}

/**
 * Create Gemini tool declarations for the core file system tools
 * This is a fallback if ToolRegistry is not available
 */
export function getCoreGeminiTools() {
  return [{
    functionDeclarations: [
      {
        name: 'read',
        description: 'Read a file from the virtual filesystem',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The path to the file to read',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write',
        description: 'Create or overwrite a file in the virtual filesystem',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The path where to write the file',
            },
            content: {
              type: Type.STRING,
              description: 'The content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'edit',
        description: 'Edit a portion of a file by replacing text',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The path to the file to edit',
            },
            search: {
              type: Type.STRING,
              description: 'The exact text to search for and replace',
            },
            replace: {
              type: Type.STRING,
              description: 'The text to replace the search text with',
            },
          },
          required: ['path', 'search', 'replace'],
        },
      },
      {
        name: 'glob',
        description: 'Search for files matching a glob pattern',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pattern: {
              type: Type.STRING,
              description: 'The glob pattern to match files against (e.g., "**/*.jsx")',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'grep',
        description: 'Search for text pattern in files',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pattern: {
              type: Type.STRING,
              description: 'The pattern to search for',
            },
            path: {
              type: Type.STRING,
              description: 'Optional path to limit search to',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'validate',
        description: 'Validate JavaScript/JSX code for syntax errors and common issues',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filename: {
              type: Type.STRING,
              description: 'The name of the file being validated',
            },
            content: {
              type: Type.STRING,
              description: 'The code content to validate',
            },
          },
          required: ['filename', 'content'],
        },
      },
    ],
  }];
}

export default {
  convertToolsToGeminiFormat,
  getCoreGeminiTools,
};
