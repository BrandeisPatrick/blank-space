import { writeCode } from '../agents/codeWriter.js';
import { analyze, AnalysisMode } from '../agents/analyzer.js';
import { diagnoseBug, debugAndFixIterative } from '../agents/debugger.js';
import { validateCode, ValidationMode } from '../agents/validator.js';
import { designUX } from '../agents/designer.js';
import { scoreQuality } from './qualityScorer.js';

/**
 * Code Orchestrator
 * Smart code generation/modification with auto-detection of operation type
 */
export class CodeOrchestrator {
  constructor(config = {}) {
    this.config = {
      maxIterations: 2,
      qualityThreshold: 0.85,
      enableRefinement: true,
      ...config
    };
  }

  /**
   * Main entry point - generates or modifies code with automatic operation detection
   */
  async run(userMessage, currentFiles = {}, plan = null, onUpdate = () => {}) {
    this.onUpdate = onUpdate;

    // Step 1: Detect operation type
    const operation = this.detectOperation(userMessage, currentFiles, plan);
    this.sendUpdate('operation', `Operation: ${operation}`);

    // Step 2: Execute appropriate workflow
    let result;

    switch (operation) {
      case 'generate':
        result = await this.generateNewCode(plan, userMessage, onUpdate);
        break;

      case 'modify':
        result = await this.modifyExistingCode(userMessage, currentFiles, onUpdate);
        break;

      case 'debug':
        result = await this.fixBugs(userMessage, currentFiles, onUpdate);
        break;

      case 'refactor':
        result = await this.refactorCode(plan, userMessage, currentFiles, onUpdate);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      ...result,
      operation,
      success: true
    };
  }

  /**
   * Detect operation type
   */
  detectOperation(userMessage, currentFiles, plan) {
    const hasFiles = Object.keys(currentFiles).length > 0;
    const msg = userMessage.toLowerCase();

    if (!hasFiles) return 'generate';
    if (msg.includes('fix') || msg.includes('debug') || msg.includes('error') || msg.includes('bug')) {
      return 'debug';
    }
    if (msg.includes('refactor') || msg.includes('reorganize') || msg.includes('restructure')) {
      return 'refactor';
    }
    return 'modify';
  }

  /**
   * Generate new code (CREATE_NEW)
   */
  async generateNewCode(plan, userMessage, onUpdate) {
    this.sendUpdate('generate', 'Generating new application...');

    // Step 1: Get UX design (should be in plan already, but fallback if not)
    let uxDesign = plan?.uxDesign;
    if (!uxDesign) {
      this.sendUpdate('design', 'Creating design system...');
      uxDesign = await designUX({
        appIdentity: plan?.appIdentity,
        userRequest: userMessage,
        mode: 'create_new'
      });
    }

    // Step 2: Generate each file
    const filesToCreate = plan?.filesToCreate || Object.keys(plan?.fileDetails || {});
    const fileOperations = [];

    for (const filename of filesToCreate) {
      this.sendUpdate('file', `Generating ${filename}...`);

      const fileSpec = plan?.fileDetails?.[filename] || {};
      const code = await writeCode({
        mode: 'generate',
        filename,
        purpose: fileSpec.purpose,
        features: fileSpec.keyFeatures || [],
        uxDesign,
        plan,
        userMessage
      });

      // Validate
      const validation = validateCode({
        code,
        filename,
        mode: ValidationMode.FAST
      });

      fileOperations.push({
        type: 'create',
        filename,
        content: validation.autoFixed && validation.code ? validation.code : code,
        validated: validation.valid
      });
    }

    return {
      fileOperations,
      plan,
      uxDesign
    };
  }

  /**
   * Modify existing code (MODIFY)
   */
  async modifyExistingCode(userMessage, currentFiles, onUpdate) {
    this.sendUpdate('modify', 'Modifying existing code...');

    // Step 1: Analyze what needs to change
    this.sendUpdate('analysis', 'Analyzing codebase...');

    let analysis;
    try {
      analysis = await analyze({
        userMessage,
        currentFiles,
        mode: AnalysisMode.MODIFICATION
      });
    } catch (error) {
      // If analysis fails (e.g., JSON parsing error), proceed with simple modification
      console.warn(`Analysis failed: ${error.message}. Proceeding with direct modification...`);

      // Fallback: modify the first file (usually App.jsx)
      const firstFilename = Object.keys(currentFiles)[0];
      if (!firstFilename) {
        return {
          fileOperations: [],
          message: 'No files to modify'
        };
      }

      analysis = {
        filesToModify: [firstFilename],
        changeTargets: {},
        needsAnalysis: false,
        fallback: true
      };
    }

    if (!analysis.filesToModify || analysis.filesToModify.length === 0) {
      return {
        fileOperations: [],
        message: 'No files need modification'
      };
    }

    // Step 2: Modify each file
    const fileOperations = [];

    for (const filename of analysis.filesToModify) {
      this.sendUpdate('file', `Modifying ${filename}...`);

      const currentCode = currentFiles[filename];
      const changeTargets = analysis.changeTargets?.[filename] || [];

      const modifiedCode = await writeCode({
        mode: 'modify',
        filename,
        currentCode,
        userMessage,
        changeTargets,
        uxDesign: analysis.existingUX
      });

      // Validate
      const validation = validateCode({
        code: modifiedCode,
        filename,
        mode: ValidationMode.FAST
      });

      fileOperations.push({
        type: 'modify',
        filename,
        content: validation.autoFixed && validation.code ? validation.code : modifiedCode,
        validated: validation.valid
      });
    }

    return {
      fileOperations,
      analysis
    };
  }

  /**
   * Fix bugs (DEBUG)
   */
  async fixBugs(userMessage, currentFiles, onUpdate) {
    this.sendUpdate('debug', 'Debugging code...');

    // Use iterative debugger for complex bug fixes
    const result = await debugAndFixIterative({
      userMessage,
      currentFiles,
      maxAttempts: this.config.maxIterations,
      onUpdate: (update) => {
        this.sendUpdate('debug', update.message || update.step);
      }
    });

    // Convert to file operations (fixedFiles is an array of {filename, fixedCode})
    const fileOperations = (result.fixedFiles || []).map(file => ({
      type: 'modify',
      filename: file.filename,
      content: file.fixedCode,
      validated: true // debugger already validates
    }));

    return {
      fileOperations,
      diagnosis: result.diagnosis,
      fixApplied: result.success
    };
  }

  /**
   * Refactor code (REFACTOR)
   */
  async refactorCode(plan, userMessage, currentFiles, onUpdate) {
    this.sendUpdate('refactor', 'Refactoring code...');

    // Step 1: Analyze current structure
    this.sendUpdate('analysis', 'Analyzing code structure...');
    const analysis = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.REFACTOR
    });

    // Step 2: Apply refactoring plan
    const filesToModify = plan?.filesToModify || analysis.filesToModify || [];
    const fileOperations = [];

    for (const filename of filesToModify) {
      this.sendUpdate('file', `Refactoring ${filename}...`);

      const currentCode = currentFiles[filename];
      const modifiedCode = await writeCode({
        mode: 'modify',
        filename,
        currentCode,
        userMessage: `${userMessage}\n\nRefactoring plan: ${JSON.stringify(plan)}`,
        changeTargets: analysis.changeTargets?.[filename] || [],
        uxDesign: analysis.existingUX
      });

      // Validate
      const validation = validateCode({
        code: modifiedCode,
        filename,
        mode: ValidationMode.FAST
      });

      fileOperations.push({
        type: 'modify',
        filename,
        content: validation.autoFixed && validation.code ? validation.code : modifiedCode,
        validated: validation.valid
      });
    }

    return {
      fileOperations,
      plan,
      analysis
    };
  }

  /**
   * Send update to UI
   */
  sendUpdate(type, message) {
    if (this.onUpdate) {
      this.onUpdate({
        orchestrator: 'CodeOrchestrator',
        type,
        message,
        timestamp: Date.now()
      });
    }
  }
}

export default CodeOrchestrator;
