/**
 * Tool Formatter
 * Shared utility for formatting tool actions into human-readable text
 */

/**
 * Format tool action into human-readable text for UI updates
 * @param {string} tool - Tool name
 * @param {Object} params - Tool parameters
 * @returns {string} Human-readable action description
 */
export function formatToolAction(tool, params = {}) {
  switch (tool) {
    case 'read':
      return `Reading ${params.path}...`;
    case 'write':
      return `Writing ${params.path}...`;
    case 'edit':
      return `Editing ${params.path}...`;
    case 'glob':
      return `Searching files...`;
    case 'grep':
      return `Searching for "${params.pattern}"...`;
    case 'validate':
      return `Validating ${params.filename}...`;
    default:
      return `Running ${tool}...`;
  }
}
