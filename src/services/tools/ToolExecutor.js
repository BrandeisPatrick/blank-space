/**
 * Tool Executor
 * Executes tools with proper error handling and context
 */

export class ToolExecutor {
  constructor(toolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Execute a tool
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context (fs, sessionId, etc.)
   * @returns {Promise<ToolResult>}
   */
  async execute(toolName, params, context) {
    const tool = this.toolRegistry.getTool(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        errorType: 'NOT_FOUND'
      };
    }

    try {
      // Validate parameters
      const validation = this._validateParams(tool, params);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error}`,
          errorType: 'INVALID_PARAMS'
        };
      }

      // Execute tool
      console.log(`🔧 Executing tool: ${toolName}`, params);
      const result = await tool.execute(params, context);
      console.log(`✅ Tool result: ${toolName}`, result);

      return {
        success: true,
        result,
        tool: toolName
      };
    } catch (error) {
      console.error(`❌ Tool execution failed: ${toolName}`, error);

      return {
        success: false,
        error: error.message,
        errorType: 'EXECUTION_ERROR',
        tool: toolName
      };
    }
  }

  /**
   * Execute multiple tools sequentially
   * @param {Array<{name: string, params: Object}>} toolCalls - Array of tool calls
   * @param {Object} context - Execution context
   * @returns {Promise<ToolResult[]>}
   */
  async executeSequence(toolCalls, context) {
    const results = [];

    for (const call of toolCalls) {
      const result = await this.execute(call.name, call.params, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute multiple tools in parallel
   * @param {Array<{name: string, params: Object}>} toolCalls - Array of tool calls
   * @param {Object} context - Execution context
   * @returns {Promise<ToolResult[]>}
   */
  async executeParallel(toolCalls, context) {
    const promises = toolCalls.map(call =>
      this.execute(call.name, call.params, context)
    );

    return Promise.all(promises);
  }

  /**
   * Validate tool parameters
   * @private
   */
  _validateParams(tool, params) {
    // Get required parameters
    const requiredParams = Object.entries(tool.parameters)
      .filter(([_, param]) => param.required !== false)
      .map(([name]) => name);

    // Check required parameters
    for (const required of requiredParams) {
      if (params[required] === undefined || params[required] === null) {
        return {
          valid: false,
          error: `Missing required parameter: ${required}`
        };
      }
    }

    return { valid: true };
  }
}

export default ToolExecutor;
