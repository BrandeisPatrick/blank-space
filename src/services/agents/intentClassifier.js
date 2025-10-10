import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";

/**
 * Intent Classifier Agent
 * Analyzes user message and determines the intent
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
    // GPT-5 models have different parameter requirements
    const isGPT5 = MODELS.INTENT_CLASSIFIER.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 150 } : { max_tokens: 150 };
    const tempParam = isGPT5 ? {} : { temperature: 0.3 }; // GPT-5 only supports default temperature

    const response = await openai.chat.completions.create({
      model: MODELS.INTENT_CLASSIFIER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      ...tempParam,
      ...tokenParam
    });

    let content = response.choices[0].message.content;

    // Clean markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    return JSON.parse(content);
  } catch (error) {
    console.error("Intent classification error:", error);
    return { intent: "create_new", confidence: 0.5, reasoning: "Fallback intent" };
  }
}
