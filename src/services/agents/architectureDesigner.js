import { callLLMForJSON } from "../utils/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import compressedPrompts from "../compressedPrompts.json" with { type: "json" };

/**
 * Architecture Agent
 * Specialized agent for designing folder structure and import paths
 * Handles file organization and module relationships
 */

/**
 * Design architecture for a new application
 * @param {Object} options - Architecture options
 * @param {Object} options.plan - Plan from planner with file list
 * @param {string} options.mode - 'create_new' | 'infer_from_existing'
 * @param {Object} [options.currentFiles] - Existing files for inference
 * @returns {Promise<Object>} Architecture specification
 */
export async function designArchitecture({ plan, mode = 'create_new', currentFiles = {} }) {
  const isNewProject = mode === 'create_new';
  const hasExistingFiles = Object.keys(currentFiles).length > 0;

  if (!isNewProject && hasExistingFiles) {
    // Infer architecture from existing files
    return inferArchitectureFromCode(currentFiles);
  }

  const systemPrompt = `You are a software architecture specialist for React applications.
Your job is to design clean, maintainable file structures with:
- Proper folder organization (components/, hooks/, lib/)
- Correct import paths based on file locations
- Module relationships and dependencies

${compressedPrompts.FOLDER_STRUCTURE_COMPRESSED}

📐 ARCHITECTURE PRINCIPLES:
1. **Clear Separation**: Components, hooks, utilities in separate folders
2. **Shallow Hierarchy**: Avoid deep nesting (max 2-3 levels)
3. **Consistent Imports**: Relative paths based on location
4. **Scalability**: Easy to add new files without refactoring

Respond ONLY with JSON in this format:
{
  "fileStructure": {
    "App.jsx": {
      "folder": "root",
      "purpose": "Main entry point",
      "imports": ["./components/Header", "./hooks/useTodos"]
    },
    "Header.jsx": {
      "folder": "components/",
      "purpose": "App header with branding",
      "imports": []
    },
    "useTodos.js": {
      "folder": "hooks/",
      "purpose": "Todo management hook",
      "imports": []
    }
  },
  "importPaths": {
    "App.jsx -> Header": "./components/Header",
    "App.jsx -> useTodos": "./hooks/useTodos",
    "TodoList.jsx -> TodoItem": "./TodoItem",
    "TodoList.jsx -> useTodos": "../hooks/useTodos"
  },
  "folderPurposes": {
    "components/": "All UI components",
    "hooks/": "Custom React hooks",
    "lib/": "Utility functions and helpers"
  },
  "dependencies": {
    "App.jsx": ["Header.jsx", "TodoList.jsx", "useTodos.js"],
    "TodoList.jsx": ["TodoItem.jsx", "useTodos.js"],
    "Header.jsx": []
  }
}`;

  const filesToOrganize = plan.filesToCreate || Object.keys(plan.fileDetails || {});
  const userPrompt = `Design architecture for these files:\n${filesToOrganize.join('\n')}\n\nOrganize into proper folders and specify import paths.`;

  try {
    const architecture = await callLLMForJSON({
      model: MODELS.ANALYZER, // Use lighter model (gpt-5-nano)
      systemPrompt,
      userPrompt,
      maxTokens: 6000,  // Increased for GPT-5-nano reasoning tokens + output
      temperature: 0.3 // Lower temperature for structural decisions
    });

    return {
      ...architecture,
      metadata: {
        createdAt: new Date().toISOString(),
        mode,
        fileCount: filesToOrganize.length
      }
    };
  } catch (error) {
    console.error("Architecture design error:", error);
    // Fallback to default structure
    return generateDefaultArchitecture(filesToOrganize);
  }
}

/**
 * Infer architecture from existing code
 * Analyzes current files to understand folder structure and import patterns
 * @param {Object} currentFiles - Map of filename to code
 * @returns {Object} Inferred architecture
 */
export function inferArchitectureFromCode(currentFiles) {
  const fileStructure = {};
  const importPaths = {};
  const dependencies = {};
  const folders = new Set();

  // Analyze each file
  for (const [filename, code] of Object.entries(currentFiles)) {
    // Extract folder
    const parts = filename.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : 'root';
    if (folder !== 'root') {
      folders.add(folder);
    }

    // Extract imports
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    fileStructure[filename] = {
      folder,
      purpose: `Existing ${getFileType(filename)}`,
      imports
    };

    // Track import relationships
    imports.forEach(importPath => {
      const key = `${filename} -> ${importPath}`;
      importPaths[key] = importPath;
    });

    dependencies[filename] = imports;
  }

  return {
    fileStructure,
    importPaths,
    folderPurposes: {
      ...Array.from(folders).reduce((acc, folder) => {
        acc[folder] = `Existing ${folder} folder`;
        return acc;
      }, {})
    },
    dependencies,
    metadata: {
      createdAt: new Date().toISOString(),
      mode: 'inferred',
      fileCount: Object.keys(currentFiles).length
    }
  };
}

/**
 * Generate default architecture when LLM fails
 * @param {Array<string>} fileNames - List of file names
 * @returns {Object} Default architecture
 */
function generateDefaultArchitecture(fileNames) {
  const fileStructure = {};
  const importPaths = {};
  const dependencies = {};

  fileNames.forEach(filename => {
    const type = getFileType(filename);
    let folder = 'root';

    if (filename !== 'App.jsx' && filename !== 'App.tsx') {
      if (type === 'component') {
        folder = 'components/';
      } else if (type === 'hook') {
        folder = 'hooks/';
      } else if (type === 'util') {
        folder = 'lib/';
      }
    }

    fileStructure[filename] = {
      folder,
      purpose: `${type.charAt(0).toUpperCase() + type.slice(1)} file`,
      imports: []
    };
  });

  // Generate basic import paths for App.jsx
  const componentFiles = fileNames.filter(f => getFileType(f) === 'component' && f !== 'App.jsx');
  const hookFiles = fileNames.filter(f => getFileType(f) === 'hook');

  if (fileNames.includes('App.jsx')) {
    componentFiles.forEach(comp => {
      const compName = comp.replace(/\.(jsx|tsx)$/, '');
      importPaths[`App.jsx -> ${compName}`] = `./components/${compName}`;
    });
    hookFiles.forEach(hook => {
      const hookName = hook.replace(/\.js$/, '');
      importPaths[`App.jsx -> ${hookName}`] = `./hooks/${hookName}`;
    });
  }

  return {
    fileStructure,
    importPaths,
    folderPurposes: {
      "components/": "UI components",
      "hooks/": "Custom React hooks",
      "lib/": "Utility functions"
    },
    dependencies,
    metadata: {
      createdAt: new Date().toISOString(),
      mode: 'fallback',
      fileCount: fileNames.length
    }
  };
}

/**
 * Determine file type from filename
 * @param {string} filename - File name
 * @returns {string} File type (component, hook, util)
 */
function getFileType(filename) {
  if (filename.match(/\.(jsx|tsx)$/)) {
    return 'component';
  } else if (filename.startsWith('use') || filename.includes('/use')) {
    return 'hook';
  } else {
    return 'util';
  }
}

/**
 * Generate import path between two files
 * @param {string} fromFile - Source file
 * @param {string} toFile - Target file
 * @param {Object} architecture - Architecture specification
 * @returns {string} Relative import path
 */
export function generateImportPath(fromFile, toFile, architecture) {
  const fromFolder = architecture.fileStructure[fromFile]?.folder || 'root';
  const toFolder = architecture.fileStructure[toFile]?.folder || 'root';

  // Remove file extension
  const toFileNoExt = toFile.replace(/\.(jsx|tsx|js)$/, '');

  if (fromFolder === toFolder) {
    // Same folder
    return `./${toFileNoExt}`;
  } else if (fromFolder === 'root') {
    // From root to subfolder
    return `./${toFolder}${toFileNoExt}`;
  } else if (toFolder === 'root') {
    // From subfolder to root
    const levels = fromFolder.split('/').length - 1;
    const upLevels = '../'.repeat(levels);
    return `${upLevels}${toFileNoExt}`;
  } else {
    // Between different subfolders
    const fromLevels = fromFolder.split('/').length - 1;
    const upLevels = '../'.repeat(fromLevels);
    return `${upLevels}${toFolder}${toFileNoExt}`;
  }
}

export default {
  designArchitecture,
  inferArchitectureFromCode,
  generateImportPath
};
