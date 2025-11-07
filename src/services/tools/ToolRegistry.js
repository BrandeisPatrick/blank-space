/**
 * Tool Registry
 * Manages registration and discovery of available tools
 */

export class ToolRegistry {
  constructor() {
    this.tools = new Map(); // name → Tool
  }

  /**
   * Register a tool
   * @param {Tool} tool - Tool to register
   */
  registerTool(tool) {
    if (!tool.name) {
      throw new Error('Tool must have a name');
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get tool by name
   * @param {string} name - Tool name
   * @returns {Tool|null}
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Get all tools
   * @returns {Tool[]}
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Check if tool exists
   * @param {string} name - Tool name
   * @returns {boolean}
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Get tools list
   * @returns {string[]} - Array of tool names
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Convert all tools to OpenAI function schemas
   * @returns {Object[]} - Array of OpenAI function definitions
   */
  toOpenAISchema() {
    return this.getAllTools().map(tool => tool.toOpenAISchema());
  }

  /**
   * Remove a tool
   * @param {string} name - Tool name
   * @returns {boolean} - True if removed
   */
  removeTool(name) {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools
   */
  clear() {
    this.tools.clear();
  }
}

export default ToolRegistry;
