/**
 * Reusable Prompt Templates
 * Extracted best practices from Dyad and other AI code generation systems
 *
 * NOTE: All prompt templates are now stored in prompts.json to avoid
 * JavaScript parsing issues with nested backticks and code examples.
 */

import prompts from "./prompts.json";

// Re-export all prompt templates for backward compatibility
export const THINKING_FRAMEWORK = prompts.THINKING_FRAMEWORK;
export const IMPORT_RESOLUTION_RULES = prompts.IMPORT_RESOLUTION_RULES;
export const COMPLETENESS_PRINCIPLES = prompts.COMPLETENESS_PRINCIPLES;
export const SIMPLICITY_GUIDELINES = prompts.SIMPLICITY_GUIDELINES;
export const COMPONENT_GRANULARITY = prompts.COMPONENT_GRANULARITY;
export const PRE_CHECK_INSTRUCTIONS = prompts.PRE_CHECK_INSTRUCTIONS;
export const FILE_NAMING_CONVENTIONS = prompts.FILE_NAMING_CONVENTIONS;
export const CODE_FORMATTING_STANDARDS = prompts.CODE_FORMATTING_STANDARDS;
export const FOLDER_STRUCTURE_REQUIREMENTS = prompts.FOLDER_STRUCTURE_REQUIREMENTS;
export const MODERN_UI_STANDARDS = prompts.MODERN_UI_STANDARDS;
export const RAW_CODE_OUTPUT_ONLY = prompts.RAW_CODE_OUTPUT_ONLY;
export const SINGLE_FILE_OUTPUT_ONLY = prompts.SINGLE_FILE_OUTPUT_ONLY;
export const DETAILED_PLANNING_GUIDANCE = prompts.DETAILED_PLANNING_GUIDANCE;
export const PACKAGE_MANAGEMENT_RULES = prompts.PACKAGE_MANAGEMENT_RULES;
export const SANDPACK_NAVIGATION_RULES = prompts.SANDPACK_NAVIGATION_RULES;

/**
 * Build enhanced system prompt from templates
 */
export function buildPrompt(basePrompt, templates = []) {
  const templateStrings = templates.join("\n\n");
  return `${basePrompt}\n\n${templateStrings}`;
}
