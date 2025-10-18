import { callLLMForJSON } from "../utils/llmClient.js";
import { MODELS } from "../config/modelConfig.js";

/**
 * Intent Classifier Agent
 * Analyzes user message and determines the intent
 * Uses gpt-4o-mini for fast, reliable classification without reasoning overhead
 */
export async function classifyIntent(userMessage) {
  const systemPrompt = `You are an intent classifier for a React code generation tool.
Analyze the user's message and classify it into ONE of these categories:
- create_new: User wants to create a new component/app from scratch
- modify_existing: User wants to modify existing code
- add_feature: User wants to add a feature to existing code
- style_change: User wants to change styling/appearance
- fix_bug: User reports something is broken or not working correctly
- explain_code: User wants explanation or has questions

Respond ONLY with a JSON object in this format:
{
  "intent": "create_new",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;

  try {
    const result = await callLLMForJSON({
      model: MODELS.INTENT_CLASSIFIER,
      systemPrompt,
      userPrompt: userMessage,
      maxTokens: 500,
      temperature: 0.3
    });

    return result;
  } catch (error) {
    console.error("Intent classification error:", error);
    return { intent: "create_new", confidence: 0.5, reasoning: "Fallback intent" };
  }
}
