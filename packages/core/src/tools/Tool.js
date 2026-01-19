/**
 * Tool Interface Definition
 * Defines the structure of tools for LLM function calling
 */

/**
 * @typedef {Object} ToolParameter
 * @property {string} type - Parameter type (string, number, boolean, array, object)
 * @property {string} description - Parameter description
 * @property {any} default - Default value (optional)
 * @property {string[]} enum - Allowed values (optional)
 */

/**
 * @typedef {Object} Tool
 * @property {string} name - Tool name (e.g., "read")
 * @property {string} description - Tool description
 * @property {Object} parameters - Parameter definitions
 * @property {Function} execute - Async function that executes the tool
 */

/**
 * Base Tool class
 */
export class Tool {
  constructor(config) {
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters || {};
    this.execute = config.execute;
  }

  /**
   * Convert to OpenAI function schema
   * @returns {Object} - OpenAI function definition
   */
  toOpenAISchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: this._parametersToSchema(),
          required: this._getRequiredParameters()
        }
      }
    };
  }

  /**
   * Convert parameters to JSON schema
   * @private
   */
  _parametersToSchema() {
    const schema = {};

    for (const [name, param] of Object.entries(this.parameters)) {
      schema[name] = {
        type: param.type || 'string',
        description: param.description || '',
        ...(param.enum && { enum: param.enum }),
        ...(param.default !== undefined && { default: param.default })
      };
    }

    return schema;
  }

  /**
   * Get required parameters
   * @private
   */
  _getRequiredParameters() {
    return Object.entries(this.parameters)
      .filter(([_, param]) => param.required !== false)
      .map(([name]) => name);
  }
}

export default Tool;
