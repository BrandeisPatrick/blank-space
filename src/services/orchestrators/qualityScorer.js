/**
 * Quality Scoring System (Simplified)
 * Unified scoring for plans and code using simple heuristics
 * No separate LLM calls - just rule-based checks
 */

/**
 * Unified quality scorer
 * @param {Object} artifact - Plan or code to score
 * @param {string} type - 'plan' | 'code'
 * @returns {Object} Quality score (0-1) and suggestions
 */
export function scoreQuality(artifact, type = 'plan') {
  if (type === 'plan') {
    return scorePlan(artifact);
  } else {
    return scoreCode(artifact);
  }
}

/**
 * Score a plan
 */
function scorePlan(plan) {
  const checks = {
    hasAppIdentity: !!(plan.appIdentity?.name && plan.appIdentity?.tagline),
    hasFiles: !!(plan.filesToCreate && plan.filesToCreate.length > 0),
    hasFileDetails: !!(plan.fileDetails && Object.keys(plan.fileDetails).length > 0),
    hasLayoutApproach: !!plan.layoutApproach,
    hasDependencies: Array.isArray(plan.npmPackages),
    reasonableScope: (plan.filesToCreate?.length || 0) > 0 && (plan.filesToCreate?.length || 0) < 20
  };

  // Calculate score
  const weights = { hasAppIdentity: 0.2, hasFiles: 0.2, hasFileDetails: 0.3, hasLayoutApproach: 0.1, hasDependencies: 0.1, reasonableScope: 0.1 };
  let score = 0;

  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      score += weights[check] || 0;
    }
  }

  // Generate suggestions
  const suggestions = [];
  if (!checks.hasAppIdentity) suggestions.push('Add app name and tagline');
  if (!checks.hasFiles) suggestions.push('Define files to create');
  if (!checks.hasFileDetails) suggestions.push('Add detailed file specifications');
  if (!checks.hasLayoutApproach) suggestions.push('Describe layout organization');
  if (!checks.hasDependencies) suggestions.push('List npm dependencies');
  if (!checks.reasonableScope) suggestions.push('Adjust project scope');

  return {
    score,
    passed: score >= 0.85,
    suggestions
  };
}

/**
 * Score code
 */
function scoreCode(codeOrResult) {
  const code = typeof codeOrResult === 'string' ? codeOrResult : codeOrResult.code || '';

  const checks = {
    hasContent: code.length > 50,
    hasExports: code.includes('export'),
    hasBalancedBraces: countChar(code, '{') === countChar(code, '}'),
    hasBalancedBrackets: countChar(code, '[') === countChar(code, ']'),
    noVarUsage: !code.includes('var '),
    notTooLong: code.split('\n').length < 300
  };

  // Calculate score
  const weights = { hasContent: 0.2, hasExports: 0.2, hasBalancedBraces: 0.2, hasBalancedBrackets: 0.15, noVarUsage: 0.15, notTooLong: 0.1 };
  let score = 0;

  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      score += weights[check] || 0;
    }
  }

  // Generate suggestions
  const suggestions = [];
  if (!checks.hasContent) suggestions.push('Code is too short or empty');
  if (!checks.hasExports) suggestions.push('Add export statements');
  if (!checks.hasBalancedBraces) suggestions.push('Fix unbalanced braces');
  if (!checks.hasBalancedBrackets) suggestions.push('Fix unbalanced brackets');
  if (!checks.noVarUsage) suggestions.push('Replace var with const/let');
  if (!checks.notTooLong) suggestions.push('File is too long, consider splitting');

  return {
    score,
    passed: score >= 0.85,
    suggestions
  };
}

/**
 * Helper: Count character occurrences
 */
function countChar(str, char) {
  return (str.match(new RegExp('\\' + char, 'g')) || []).length;
}

// Legacy exports for backwards compatibility
export function evaluatePlanQuality(plan) {
  return scoreQuality(plan, 'plan');
}

export function evaluateCodeQuality(code) {
  return scoreQuality(code, 'code');
}

export default {
  scoreQuality,
  evaluatePlanQuality,
  evaluateCodeQuality
};
