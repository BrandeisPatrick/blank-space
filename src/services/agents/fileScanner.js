/**
 * File Scanner Agent
 * Specialist agent that finds which file contains a specific issue
 *
 * Inspired by Microsoft AutoGen's "Agent as Tool" pattern:
 * - Single responsibility: Find files with specific patterns
 * - Can be invoked by other agents (debugger, analyzer, etc.)
 * - Returns structured results for further processing
 *
 * @module fileScanner
 */

/**
 * Extract local (relative) imports from source code
 * Ignores node_modules imports, only tracks project files
 *
 * @param {string} code - Source code to scan
 * @returns {Array<string>} - Array of import paths like "./hooks/useTodos"
 */
function extractImports(code) {
  if (!code || typeof code !== 'string') return [];

  const imports = [];

  // Match ES6 imports: import X from "./path" or "../path"
  const importRegex = /import\s+(?:[\w\s{},*]*)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolve relative import path considering current file location
 *
 * @param {string} currentFile - Current file path (e.g., "src/App.jsx")
 * @param {string} importPath - Relative import (e.g., "./hooks/useTodos")
 * @returns {string} - Resolved path
 */
function resolveImportPath(currentFile, importPath) {
  // Get directory of current file
  const parts = currentFile.split('/');
  const currentDir = parts.slice(0, -1).join('/');

  let resolved = importPath;

  // Handle ./relative paths
  if (importPath.startsWith('./')) {
    resolved = currentDir ? `${currentDir}/${importPath.slice(2)}` : importPath.slice(2);
  }
  // Handle ../parent paths
  else if (importPath.startsWith('../')) {
    const dirParts = currentDir.split('/');
    let path = importPath;

    while (path.startsWith('../') && dirParts.length > 0) {
      dirParts.pop();
      path = path.slice(3);
    }

    resolved = dirParts.length > 0 ? `${dirParts.join('/')}/${path}` : path;
  }

  return resolved;
}

/**
 * Try to find file in available files with possible extensions
 * Handles cases where import doesn't specify .js/.jsx extension
 *
 * @param {Object} availableFiles - Map of filename to code
 * @param {string} basePath - Path without extension
 * @returns {string|null} - Found filename or null
 */
function findFileWithExtension(availableFiles, basePath) {
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx'];

  // Try each extension
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (availableFiles[fullPath]) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Scan files iteratively to find the one containing a specific pattern
 * Uses breadth-first search through import graph
 *
 * AutoGen Pattern: This agent is invoked as a tool by the debugger agent
 *
 * @param {Object} params - Scan parameters
 * @param {Object} params.currentFiles - Available files {filename: code}
 * @param {string} params.startFile - File to start scanning from
 * @param {string} params.searchPattern - Pattern to find (e.g., "require(", "process.")
 * @param {number} [params.maxDepth=5] - Maximum import depth to scan
 * @returns {Promise<Object>} Scan result:
 *   - found: boolean - Whether pattern was found
 *   - filename: string|null - File containing the pattern
 *   - scannedFiles: Array<string> - All files that were scanned
 *   - importPath: Array<string> - Path through imports to the file
 */
export async function scanForIssue({
  currentFiles,
  startFile,
  searchPattern,
  maxDepth = 5
}) {
  // Guard: Validate inputs
  if (!currentFiles || typeof currentFiles !== 'object') {
    return {
      found: false,
      filename: null,
      scannedFiles: [],
      importPath: [],
      error: 'Invalid currentFiles object'
    };
  }

  if (!startFile || !currentFiles[startFile]) {
    return {
      found: false,
      filename: null,
      scannedFiles: [],
      importPath: [],
      error: `Start file not found: ${startFile}`
    };
  }

  console.log(`📂 File Scanner Agent: Searching for "${searchPattern}"`);
  console.log(`   Starting from: ${startFile}`);
  console.log(`   Max depth: ${maxDepth}`);

  const scanned = new Set();
  const queue = [{ file: startFile, depth: 0, path: [startFile] }];

  while (queue.length > 0) {
    const { file, depth, path } = queue.shift();

    // Skip if already scanned or beyond max depth
    if (scanned.has(file) || depth > maxDepth) {
      continue;
    }

    scanned.add(file);

    // Check if file is available
    if (!currentFiles[file]) {
      console.warn(`  ⚠️ File not available: ${file}`);
      continue;
    }

    const code = currentFiles[file];
    const indent = '  '.repeat(depth);

    console.log(`  ${indent}📄 Scanning [depth ${depth}]: ${file}`);

    // Check if this file contains the search pattern
    if (code.includes(searchPattern)) {
      console.log(`  ${indent}🎯 FOUND "${searchPattern}" in: ${file}`);
      console.log(`  ${indent}   Import path: ${path.join(' → ')}`);

      return {
        found: true,
        filename: file,
        scannedFiles: Array.from(scanned),
        importPath: path
      };
    }

    // Extract imports and add to queue (only if not at max depth)
    if (depth < maxDepth) {
      const imports = extractImports(code);

      if (imports.length > 0) {
        console.log(`  ${indent}   Found ${imports.length} import(s)`);
      }

      for (const importPath of imports) {
        const resolved = resolveImportPath(file, importPath);
        const foundFile = findFileWithExtension(currentFiles, resolved);

        if (foundFile && !scanned.has(foundFile)) {
          console.log(`  ${indent}   ↳ Queued: ${foundFile}`);
          queue.push({
            file: foundFile,
            depth: depth + 1,
            path: [...path, foundFile]
          });
        } else if (!foundFile && depth < 2) {
          // Log missing files only at shallow depths to avoid spam
          console.log(`  ${indent}   ↳ Not available: ${importPath}`);
        }
      }
    }
  }

  console.log(`  ❌ "${searchPattern}" not found in ${scanned.size} scanned file(s)`);

  return {
    found: false,
    filename: null,
    scannedFiles: Array.from(scanned),
    importPath: []
  };
}

/**
 * Export helper functions for testing and reuse
 */
export const helpers = {
  extractImports,
  resolveImportPath,
  findFileWithExtension
};

export default {
  scanForIssue,
  helpers
};
