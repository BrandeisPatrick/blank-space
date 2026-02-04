/**
 * Tool Formatters for Assistant Agent
 * Formats tool actions and results for the Thought UI
 */

/**
 * Format tool action for display
 * e.g., list_directory("docs") or read_file("todo.md")
 */
export function formatToolAction(toolName, params) {
  switch (toolName) {
    case 'list_directory':
      return params.path ? `list_directory("${params.path}")` : 'list_directory()';
    case 'read_file':
      return `read_file("${params.path}")`;
    case 'write_file':
      return `write_file("${params.path}", ${params.content?.length || 0} chars)`;
    case 'edit_file':
      return `edit_file("${params.path}")`;
    case 'delete_file':
      return `delete_file("${params.path}")`;
    case 'create_directory':
      return `create_directory("${params.path}")`;
    default:
      return `${toolName}(${JSON.stringify(params)})`;
  }
}

/**
 * Format tool result for display
 * e.g., "4 folders: Documents, Photos..." or "125 chars: # Todo..."
 */
export function formatToolResult(toolName, result) {
  if (!result.success) {
    return `error: ${result.error}`;
  }

  switch (toolName) {
    case 'list_directory': {
      const folderCount = result.folders?.length || 0;
      const fileCount = result.files?.length || 0;
      const total = result.total || (folderCount + fileCount);
      if (total === 0) return 'empty';
      const parts = [];
      if (folderCount > 0) {
        const names = result.folders.slice(0, 3).map(f => f.name).join(', ');
        parts.push(`${folderCount} folder${folderCount > 1 ? 's' : ''}: ${names}${folderCount > 3 ? '...' : ''}`);
      }
      if (fileCount > 0) {
        const names = result.files.slice(0, 3).map(f => f.name).join(', ');
        parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}: ${names}${fileCount > 3 ? '...' : ''}`);
      }
      return parts.join('; ');
    }
    case 'read_file': {
      const content = result.content || '';
      const preview = content.slice(0, 50).replace(/\n/g, ' ');
      return `${content.length} chars: "${preview}${content.length > 50 ? '...' : ''}"`;
    }
    case 'write_file':
      return `saved to ${result.path}`;
    case 'edit_file':
      return `updated ${result.path}`;
    case 'delete_file':
      return `deleted ${result.path}`;
    case 'create_directory':
      return `created ${result.path}`;
    default:
      return 'ok';
  }
}

/**
 * Format a complete tool call with action and result
 * e.g., "list_directory() → 4 folders: Documents, Photos..."
 */
export function formatToolCall(toolName, params, result) {
  const action = formatToolAction(toolName, params);
  const resultStr = formatToolResult(toolName, result);
  return `${action} → ${resultStr}`;
}
