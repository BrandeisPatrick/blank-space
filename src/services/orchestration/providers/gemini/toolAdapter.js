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

export default {
  convertToolsToGeminiFormat,
};
