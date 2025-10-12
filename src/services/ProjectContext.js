/**
 * Project Context System
 * Maintains understanding of the current project's structure, theme, and identity
 * Enables consistent modifications that respect the existing design
 */

/**
 * ProjectContext Class
 * Stores and manages project-level context
 */
export class ProjectContext {
  constructor() {
    this.projectInfo = {
      appName: null,
      tagline: null,
      tone: null,
      theme: null, // 'dark' | 'light'
      colorScheme: {},
      designStyle: {},
      architecture: {
        hasRouter: false,
        hasStateManagement: false,
        fileStructure: {},
        mainComponents: []
      },
      fileCount: 0,
      lastUpdated: null
    };
    this.initialized = false;
  }

  /**
   * Initialize or update project context from a plan
   * @param {Object} plan - Plan from planner agent
   */
  updateFromPlan(plan) {
    if (plan.appIdentity) {
      this.projectInfo.appName = plan.appIdentity.name || this.projectInfo.appName;
      this.projectInfo.tagline = plan.appIdentity.tagline || this.projectInfo.tagline;
      this.projectInfo.tone = plan.appIdentity.tone || this.projectInfo.tone;
    }

    if (plan.colorScheme) {
      this.projectInfo.theme = plan.colorScheme.theme || this.projectInfo.theme;
      this.projectInfo.colorScheme = {
        ...this.projectInfo.colorScheme,
        ...plan.colorScheme
      };
    }

    if (plan.designStyle) {
      this.projectInfo.designStyle = {
        ...this.projectInfo.designStyle,
        ...plan.designStyle
      };
    }

    this.projectInfo.lastUpdated = Date.now();
    this.initialized = true;
  }

  /**
   * Update project context from file operations
   * @param {Array} fileOperations - File operations performed
   * @param {Object} currentFiles - Current project files
   */
  updateFromFileOperations(fileOperations, currentFiles) {
    this.projectInfo.fileCount = Object.keys(currentFiles).length;

    // Analyze file structure
    const fileNames = Object.keys(currentFiles);
    this.projectInfo.architecture.fileStructure = this.analyzeFileStructure(fileNames);

    // Detect main components
    this.projectInfo.architecture.mainComponents = fileNames
      .filter(f => f.endsWith('.jsx') || f.endsWith('.tsx'))
      .map(f => f.split('/').pop().replace(/\.(jsx|tsx)$/, ''));

    // Detect routing
    this.projectInfo.architecture.hasRouter = fileNames.some(f =>
      f.includes('Router') || f.includes('Routes')
    );

    // Detect state management
    this.projectInfo.architecture.hasStateManagement = fileNames.some(f =>
      f.includes('store') || f.includes('context') || f.includes('redux')
    );

    this.projectInfo.lastUpdated = Date.now();
  }

  /**
   * Analyze file structure from file names
   * @param {Array} fileNames - Array of file names
   * @returns {Object} File structure analysis
   */
  analyzeFileStructure(fileNames) {
    const structure = {
      hasComponents: false,
      hasHooks: false,
      hasUtils: false,
      hasStyles: false,
      folders: new Set()
    };

    fileNames.forEach(fileName => {
      const parts = fileName.split('/');

      // Track folders
      if (parts.length > 1) {
        structure.folders.add(parts[0]);
      }

      // Check for common patterns
      if (fileName.includes('components/')) structure.hasComponents = true;
      if (fileName.includes('hooks/')) structure.hasHooks = true;
      if (fileName.includes('utils/')) structure.hasUtils = true;
      if (fileName.endsWith('.css')) structure.hasStyles = true;
    });

    structure.folders = Array.from(structure.folders);
    return structure;
  }

  /**
   * Get context string for including in agent prompts
   * @returns {string} Project context description
   */
  getContextString() {
    if (!this.initialized) {
      return '';
    }

    let context = '\n\n=== PROJECT CONTEXT ===\n';

    if (this.projectInfo.appName) {
      context += `App Name: ${this.projectInfo.appName}\n`;
    }

    if (this.projectInfo.tagline) {
      context += `Tagline: ${this.projectInfo.tagline}\n`;
    }

    if (this.projectInfo.tone) {
      context += `Tone: ${this.projectInfo.tone}\n`;
    }

    if (this.projectInfo.theme) {
      context += `Theme: ${this.projectInfo.theme}\n`;
    }

    if (this.projectInfo.colorScheme.primary) {
      context += `Primary Color: ${this.projectInfo.colorScheme.primary}\n`;
    }

    if (this.projectInfo.colorScheme.secondary) {
      context += `Secondary Color: ${this.projectInfo.colorScheme.secondary}\n`;
    }

    if (this.projectInfo.designStyle.aesthetic) {
      context += `Design Aesthetic: ${this.projectInfo.designStyle.aesthetic}\n`;
    }

    context += `\nArchitecture:\n`;
    context += `- Components: ${this.projectInfo.architecture.mainComponents.slice(0, 5).join(', ')}\n`;
    context += `- File Count: ${this.projectInfo.fileCount}\n`;
    context += `- Has Router: ${this.projectInfo.architecture.hasRouter}\n`;

    context += '\n**IMPORTANT**: Maintain consistency with the existing project style and theme in all modifications.\n';
    context += '===========================\n\n';

    return context;
  }

  /**
   * Get color scheme for modifications
   * @returns {Object|null} Color scheme object
   */
  getColorScheme() {
    return this.initialized && this.projectInfo.colorScheme
      ? this.projectInfo.colorScheme
      : null;
  }

  /**
   * Get design style for modifications
   * @returns {Object|null} Design style object
   */
  getDesignStyle() {
    return this.initialized && this.projectInfo.designStyle
      ? this.projectInfo.designStyle
      : null;
  }

  /**
   * Get app identity for branding
   * @returns {Object|null} App identity object
   */
  getAppIdentity() {
    if (!this.initialized) return null;

    return {
      name: this.projectInfo.appName,
      tagline: this.projectInfo.tagline,
      tone: this.projectInfo.tone
    };
  }

  /**
   * Check if project has been initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Clear project context
   */
  clear() {
    this.projectInfo = {
      appName: null,
      tagline: null,
      tone: null,
      theme: null,
      colorScheme: {},
      designStyle: {},
      architecture: {
        hasRouter: false,
        hasStateManagement: false,
        fileStructure: {},
        mainComponents: []
      },
      fileCount: 0,
      lastUpdated: null
    };
    this.initialized = false;
  }

  /**
   * Get project statistics
   * @returns {Object} Project stats
   */
  getStats() {
    return {
      initialized: this.initialized,
      appName: this.projectInfo.appName,
      fileCount: this.projectInfo.fileCount,
      componentCount: this.projectInfo.architecture.mainComponents.length,
      theme: this.projectInfo.theme,
      hasRouter: this.projectInfo.architecture.hasRouter,
      lastUpdated: this.projectInfo.lastUpdated
        ? new Date(this.projectInfo.lastUpdated).toISOString()
        : null
    };
  }
}

/**
 * Global project context instance (singleton)
 */
let globalContext = null;

/**
 * Get or create global project context
 * @returns {ProjectContext} Global context instance
 */
export function getProjectContext() {
  if (!globalContext) {
    globalContext = new ProjectContext();
  }
  return globalContext;
}

/**
 * Reset global project context
 */
export function resetProjectContext() {
  if (globalContext) {
    globalContext.clear();
  } else {
    globalContext = new ProjectContext();
  }
}

export default {
  ProjectContext,
  getProjectContext,
  resetProjectContext
};
