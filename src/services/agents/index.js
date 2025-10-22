/**
 * Agents Module - Barrel Export
 * Centralized exports for all AI agents
 */

// Analyzer Agent
export {
  analyze,
  AnalysisMode,
  analyzeCodebaseForModification
} from './analyzer.js';

// Architecture Designer Agent
export {
  designArchitecture,
  inferArchitectureFromCode,
  generateImportPath
} from './architectureDesigner.js';

// Debugger Agent
export {
  diagnoseBug,
  debugAndFix,
  debugAndFixIterative,
  getFixSuggestions,
  quickDiagnose
} from './debugger.js';

// Generator Agent
export {
  generateCode
} from './generator.js';

// Intent Classifier Agent
export {
  classifyIntent
} from './intentClassifier.js';

// Modifier Agent
export {
  modifyCode
} from './modifier.js';

// Planner Agent
export {
  createPlan
} from './planner.js';

// Plan Reviewer Agent
export {
  reviewPlan,
  generatePlanImprovementInstructions,
  hasPlanImproved
} from './planReviewer.js';

// Reviewer Agent
export {
  reviewCode,
  generateImprovementInstructions,
  hasImproved,
  aggregateReviews
} from './reviewer.js';

// UX Designer Agent
export {
  designUX,
  extractUXFromCode
} from './uxDesigner.js';

// Validator Agent
export {
  validateCode,
  quickValidate,
  ValidationMode
} from './validator.js';

// File Scanner Agent
export {
  scanForIssue
} from './fileScanner.js';
