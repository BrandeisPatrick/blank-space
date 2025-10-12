import { createPlan } from "./agents/planner.js";
import { generateCode } from "./agents/generator.js";
import { modifyCode } from "./agents/modifier.js";
import { reviewCode } from "./agents/reviewer.js";
import { reviewPlan } from "./agents/planReviewer.js";
import { analyze, AnalysisMode } from "./agents/analyzer.js";
import { diagnoseBug } from "./agents/debugger.js";
import { designUX } from "./agents/uxDesigner.js";
import { designArchitecture } from "./agents/architectureDesigner.js";
import { validateCode, ValidationMode } from "./agents/validator.js";
import { callLLMAndExtract } from "./utils/llmClient.js";
import { MODELS } from "./config/modelConfig.js";

/**
 * Hybrid Agent Orchestrator
 * Routes requests to intent-specific pipelines
 * Combines multi-agent decomposition with dynamic prompt optimization
 */

/**
 * Pipeline configuration for different intents
 */
const PIPELINE_CONFIG = {
  CREATE_NEW: {
    agents: ['planner', 'ux-designer', 'architecture-designer', 'generator', 'validator'],
    description: 'Full stack creation with UX and architecture design',
    estimatedTokens: 11300
  },
  MODIFY: {
    agents: ['analyzer', 'modifier', 'validator'],
    description: 'Lightweight modification of existing files',
    estimatedTokens: 6100
  },
  DEBUG: {
    agents: ['analyzer', 'debugger', 'modifier', 'validator'],
    description: 'Bug diagnosis and fix',
    estimatedTokens: 7800
  },
  STYLE_CHANGE: {
    agents: ['analyzer', 'ux-designer', 'modifier'],
    description: 'UX-focused redesign',
    estimatedTokens: 7200
  },
  EXPLAIN: {
    agents: ['analyzer'],
    description: 'Code explanation only',
    estimatedTokens: 2400
  }
};

/**
 * Main Hybrid Orchestrator Class
 */
export class HybridAgentOrchestrator {
  constructor() {
    this.cache = new Map(); // Cache for UX/Architecture outputs
    this.metrics = {
      totalTokens: 0,
      pipelineUsage: {},
      cacheHits: 0
    };
    this.context = {
      currentFiles: {},
      projectContext: null
    };
  }

  /**
   * Main entry point - routes to appropriate pipeline
   */
  async run(userMessage, currentFiles = {}, onUpdate = () => {}) {
    this.context.currentFiles = currentFiles;
    this.onUpdate = onUpdate;

    // Step 1: Classify intent
    this.sendUpdate('intent', 'Analyzing request intent...');
    const intentResult = await this.classifyIntent(userMessage, currentFiles);
    const confidence = Math.round(intentResult.confidence * 100);
    this.sendUpdate('intent', `Intent: ${intentResult.intent} (${confidence}% confidence)`);

    // Step 2: Route to appropriate pipeline
    const pipeline = PIPELINE_CONFIG[intentResult.intent];
    this.sendUpdate('pipeline', `Using ${intentResult.intent} pipeline (${pipeline.agents.join(' → ')})`);

    // Track metrics
    if (!this.metrics.pipelineUsage[intentResult.intent]) {
      this.metrics.pipelineUsage[intentResult.intent] = 0;
    }
    this.metrics.pipelineUsage[intentResult.intent]++;

    // Step 3: Execute pipeline
    let result;
    switch (intentResult.intent) {
      case 'CREATE_NEW':
        result = await this.createNewPipeline(userMessage, currentFiles);
        break;
      case 'MODIFY':
        result = await this.modifyPipeline(userMessage, currentFiles);
        break;
      case 'DEBUG':
        result = await this.debugPipeline(userMessage, currentFiles);
        break;
      case 'STYLE_CHANGE':
        result = await this.stylePipeline(userMessage, currentFiles);
        break;
      case 'EXPLAIN':
        result = await this.explainPipeline(userMessage, currentFiles);
        break;
      default:
        // Fallback to MODIFY pipeline
        result = await this.modifyPipeline(userMessage, currentFiles);
    }

    return {
      ...result,
      metadata: {
        intent: intentResult.intent,
        pipeline: pipeline.agents,
        estimatedTokens: pipeline.estimatedTokens,
        actualTokens: this.metrics.totalTokens,
        cacheHits: this.metrics.cacheHits
      }
    };
  }

  /**
   * Classify user intent
   */
  async classifyIntent(userMessage, currentFiles) {
    const hasFiles = Object.keys(currentFiles).length > 0;
    const message = userMessage.toLowerCase();

    // Rule-based classification (fast)
    if (!hasFiles && (message.includes('create') || message.includes('build') || message.includes('make'))) {
      return { intent: 'CREATE_NEW', confidence: 0.95 };
    }

    if (message.includes('debug') || message.includes('fix') || message.includes('error') || message.includes('bug')) {
      return { intent: 'DEBUG', confidence: 0.90 };
    }

    if (message.includes('explain') || message.includes('what does') || message.includes('how does')) {
      return { intent: 'EXPLAIN', confidence: 0.90 };
    }

    if (message.includes('change color') || message.includes('redesign') || message.includes('theme') || message.includes('style')) {
      return { intent: 'STYLE_CHANGE', confidence: 0.85 };
    }

    if (hasFiles && (message.includes('change') || message.includes('update') || message.includes('modify') || message.includes('edit'))) {
      return { intent: 'MODIFY', confidence: 0.85 };
    }

    // Default to MODIFY if files exist, CREATE_NEW otherwise
    if (hasFiles) {
      return { intent: 'MODIFY', confidence: 0.60 };
    } else {
      return { intent: 'CREATE_NEW', confidence: 0.60 };
    }
  }

  /**
   * CREATE_NEW Pipeline
   * Planner → UX Designer → Architecture Designer → Code Generator → Validator
   */
  async createNewPipeline(userMessage, currentFiles) {
    this.sendUpdate('agent', 'Planner: Creating project plan...');

    // Step 1: Planning
    const plan = await createPlan('CREATE_NEW', userMessage, currentFiles);

    // Step 2: Plan Review (optional reflection)
    this.sendUpdate('agent', 'Plan Reviewer: Reviewing plan...');
    const planReview = await reviewPlan({ plan, userMessage });

    if (!planReview.approved && planReview.revisedPlan) {
      this.sendUpdate('agent', 'Plan revised based on review');
      plan.filesToCreate = planReview.revisedPlan.filesToCreate || plan.filesToCreate;
      plan.fileDetails = planReview.revisedPlan.fileDetails || plan.fileDetails;
    }

    // Step 3: UX Design (run in parallel with Architecture if possible)
    this.sendUpdate('agent', 'UX Designer: Creating design system...');
    const cacheKey = `ux-${userMessage}`;
    let uxDesign;

    if (this.cache.has(cacheKey)) {
      uxDesign = this.cache.get(cacheKey);
      this.metrics.cacheHits++;
      this.sendUpdate('cache', 'Using cached UX design');
    } else {
      uxDesign = await designUX({
        appIdentity: plan.appIdentity,
        userRequest: userMessage,
        mode: 'create_new'
      });
      this.cache.set(cacheKey, uxDesign);
    }

    // Step 4: Architecture Design
    this.sendUpdate('agent', 'Architecture Designer: Organizing file structure...');
    const architecture = await designArchitecture({
      plan,
      mode: 'create_new',
      currentFiles
    });

    // Step 5: Generate Code for Each File
    this.sendUpdate('agent', 'Code Generator: Generating files...');
    const generatedFiles = {};
    const filesToCreate = plan.filesToCreate || Object.keys(plan.fileDetails || {});

    for (const filename of filesToCreate) {
      this.sendUpdate('file', `Generating ${filename}...`);

      const fileSpec = plan.fileDetails?.[filename] || { purpose: 'Component file' };
      const folderInfo = architecture.fileStructure?.[filename] || {};

      const generated = await generateCode({
        filename,
        purpose: fileSpec.purpose,
        features: fileSpec.features || [],
        uxDesign, // Reuse same UX design
        architecture,
        dependencies: architecture.dependencies?.[filename] || [],
        existingFiles: generatedFiles
      });

      // Step 6: Fast Validation
      const validation = validateCode({
        code: generated.code,
        filename,
        mode: ValidationMode.FAST
      });

      if (!validation.valid) {
        this.sendUpdate('validation', `Auto-fixing ${filename}...`);
        generated.code = validation.code; // Use auto-fixed code
      }

      generatedFiles[filename] = generated.code;
    }

    return {
      files: generatedFiles,
      plan,
      uxDesign,
      architecture,
      success: true
    };
  }

  /**
   * MODIFY Pipeline
   * Analyzer → Code Modifier → Validator
   */
  async modifyPipeline(userMessage, currentFiles) {
    this.sendUpdate('agent', 'Analyzer: Analyzing codebase...');

    // Step 1: Analyze what needs to change
    const analysis = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.MODIFICATION
    });

    if (!analysis.needsAnalysis || analysis.filesToModify.length === 0) {
      // Nothing to modify, might be a creation task
      this.sendUpdate('agent', 'No modifications needed, routing to CREATE_NEW...');
      return await this.createNewPipeline(userMessage, currentFiles);
    }

    // Step 2: Modify each file
    this.sendUpdate('agent', 'Code Modifier: Applying changes...');
    const modifiedFiles = {};

    for (const filename of analysis.filesToModify) {
      this.sendUpdate('file', `Modifying ${filename}...`);

      const currentCode = currentFiles[filename];
      const changeTargets = analysis.changeTargets?.[filename] || [];

      const modified = await modifyCode({
        filename,
        currentCode,
        userMessage,
        changeTargets,
        existingUX: analysis.existingUX,
        existingArchitecture: analysis.existingArchitecture
      });

      // Step 3: Fast Validation
      const validation = validateCode({
        code: modified.code,
        filename,
        mode: ValidationMode.FAST
      });

      if (!validation.valid) {
        this.sendUpdate('validation', `Auto-fixing ${filename}...`);
        modified.code = validation.code;
      }

      modifiedFiles[filename] = modified.code;
    }

    return {
      files: modifiedFiles,
      analysis,
      success: true
    };
  }

  /**
   * DEBUG Pipeline
   * Analyzer (debug mode) → Debugger → Code Modifier → Validator
   */
  async debugPipeline(userMessage, currentFiles) {
    this.sendUpdate('agent', 'Analyzer: Identifying error location...');

    // Step 1: Analyze error context
    const analysis = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.DEBUG
    });

    if (!analysis.errorFile) {
      return {
        files: {},
        error: 'Could not identify error location',
        success: false
      };
    }

    // Step 2: Deep diagnosis
    this.sendUpdate('agent', 'Debugger: Analyzing root cause...');
    const diagnosis = await diagnoseBug({
      errorContext: analysis,
      code: currentFiles[analysis.errorFile],
      userMessage
    });

    // Step 3: Apply fix
    this.sendUpdate('agent', 'Code Modifier: Applying fix...');
    const modified = await modifyCode({
      filename: analysis.errorFile,
      currentCode: currentFiles[analysis.errorFile],
      userMessage: `Fix: ${diagnosis.rootCause}`,
      fixStrategy: diagnosis.fixStrategy,
      existingUX: analysis.existingUX,
      existingArchitecture: analysis.existingArchitecture
    });

    // Step 4: Validation
    const validation = validateCode({
      code: modified.code,
      filename: analysis.errorFile,
      mode: ValidationMode.FULL
    });

    if (!validation.valid) {
      this.sendUpdate('validation', `Auto-fixing ${analysis.errorFile}...`);
      modified.code = validation.code;
    }

    return {
      files: { [analysis.errorFile]: modified.code },
      diagnosis,
      analysis,
      success: true
    };
  }

  /**
   * STYLE_CHANGE Pipeline
   * Analyzer (style mode) → UX Designer (redesign) → Code Modifier
   */
  async stylePipeline(userMessage, currentFiles) {
    this.sendUpdate('agent', 'Analyzer: Extracting current styles...');

    // Step 1: Extract current styles
    const analysis = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.STYLE_EXTRACTION
    });

    // Step 2: Redesign UX
    this.sendUpdate('agent', 'UX Designer: Creating new design...');
    const uxDesign = await designUX({
      appIdentity: analysis.currentStyles?.appIdentity,
      userRequest: userMessage,
      mode: 'redesign',
      currentStyles: analysis.currentStyles
    });

    // Step 3: Apply style changes to all styled files
    this.sendUpdate('agent', 'Code Modifier: Applying new styles...');
    const modifiedFiles = {};

    for (const filename of analysis.styledFiles || []) {
      this.sendUpdate('file', `Updating ${filename}...`);

      const modified = await modifyCode({
        filename,
        currentCode: currentFiles[filename],
        userMessage: 'Apply new UX design',
        uxDesign,
        existingArchitecture: analysis.existingArchitecture
      });

      modifiedFiles[filename] = modified.code;
    }

    return {
      files: modifiedFiles,
      uxDesign,
      analysis,
      success: true
    };
  }

  /**
   * EXPLAIN Pipeline
   * Analyzer (explain mode) only
   */
  async explainPipeline(userMessage, currentFiles) {
    this.sendUpdate('agent', 'Analyzer: Analyzing code...');

    const analysis = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.EXPLAIN
    });

    return {
      files: {},
      explanation: analysis.explanation,
      relevantFiles: analysis.relevantFiles,
      keyFeatures: analysis.keyFeatures,
      architecture: analysis.architecture,
      success: true
    };
  }

  /**
   * Helper: Send update to UI
   */
  sendUpdate(type, message) {
    if (this.onUpdate) {
      this.onUpdate({ type, message, timestamp: Date.now() });
    }
  }

  /**
   * Helper: Validate generated file
   */
  async validateFile(filename, code, mode = ValidationMode.FAST) {
    const validation = validateCode({ code, filename, mode });

    if (!validation.valid && validation.autoFixed) {
      this.sendUpdate('validation', `Auto-fixed ${filename}`);
    }

    return validation;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.metrics.cacheHits = 0;
  }
}

/**
 * Main export - create and run orchestrator
 */
export async function runHybridOrchestrator(userMessage, currentFiles = {}, onUpdate = () => {}) {
  const orchestrator = new HybridAgentOrchestrator();
  return await orchestrator.run(userMessage, currentFiles, onUpdate);
}

export default {
  HybridAgentOrchestrator,
  runHybridOrchestrator,
  PIPELINE_CONFIG
};
