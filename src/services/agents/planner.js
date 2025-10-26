import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import { MemoryBank } from "../utils/memory/MemoryBank.js";
import { getPromptLoader } from "../utils/prompts/PromptLoader.js";

/**
 * Planning Agent
 * Creates a step-by-step plan for code generation/modification
 * @param {Object} options - Planning options
 * @param {string} options.intent - Intent classification
 * @param {string} options.userMessage - User's request
 * @param {Object} [options.currentFiles={}] - Current project files
 * @param {Object} [options.analysisResult=null] - Analysis from analyzer agent
 * @param {ConversationLogger} [options.logger=null] - Optional conversation logger
 */
export async function createPlan(intent, userMessage, currentFiles = {}, analysisResult = null, logger = null) {
  // Load persistent rules from Memory Bank
  const memory = new MemoryBank();
  const persistentRules = await memory.loadRules();

  const filesContext = Object.keys(currentFiles).length > 0
    ? `\n\nCurrent files in the project:\n${Object.keys(currentFiles).map(f => `- ${f}`).join("\n")}`
    : "\n\nThis is a new empty project.";

  // Include analysis result if available
  const analysisContext = analysisResult
    ? `\n\nCodebase Analysis Result:\n${JSON.stringify(analysisResult, null, 2)}`
    : "";

  // Load externalized prompt using PromptLoader
  const promptLoader = getPromptLoader();
  const systemPrompt = await promptLoader.loadPlannerPrompt({
    persistentRules,
    filesContext,
    analysisContext,
    analysisResult
  });

  try {
    return await callLLMForJSON({
      model: MODELS.PLANNER,
      systemPrompt,
      userPrompt: `Intent: ${intent}\nRequest: ${userMessage}`,
      maxTokens: 6000,  // Increased for GPT-5 reasoning tokens + output
      temperature: 0.5,
      logger  // Pass logger to LLM client
    });
  } catch (error) {
    console.error("Planning error:", error);
    return {
      steps: ["Generate basic component"],
      filesToCreate: ["App.jsx"],
      filesToModify: [],
      summary: "Create a basic React component"
    };
  }
}
