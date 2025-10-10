import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";

/**
 * Debugger Agent
 * Identifies and fixes bugs in existing code
 */

/**
 * Analyze code to identify the bug
 * @param {string} userMessage - User's description of the bug
 * @param {Object} currentFiles - Current project files
 * @returns {Object} Bug analysis with diagnosis
 */
export async function identifyBug(userMessage, currentFiles) {
  const filesList = Object.entries(currentFiles)
    .map(([filename, code]) => `=== ${filename} ===\n${code}`)
    .join("\n\n");

  const systemPrompt = `You are a debugging expert for React applications.
Analyze the user's bug report and the provided code to identify what's wrong.

Respond ONLY with a JSON object in this format:
{
  "bugFound": true/false,
  "diagnosis": "Clear explanation of what's wrong",
  "affectedFiles": ["filename1", "filename2"],
  "bugType": "logic_error|missing_handler|state_issue|prop_issue|syntax_error",
  "severity": "critical|high|medium|low",
  "suggestedFix": "Brief description of how to fix it"
}`;

  const userPrompt = `User reports: "${userMessage}"

Current code:
${filesList}

Analyze the code and identify the bug.`;

  try {
    const isGPT5 = MODELS.ANALYZER.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 500 } : { max_tokens: 500 };
    const tempParam = isGPT5 ? {} : { temperature: 0.3 };

    const response = await openai.chat.completions.create({
      model: MODELS.ANALYZER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      ...tempParam,
      ...tokenParam
    });

    let content = response.choices[0].message.content;
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    return JSON.parse(content);
  } catch (error) {
    console.error("Bug identification error:", error);
    return {
      bugFound: false,
      diagnosis: "Unable to identify the bug",
      affectedFiles: [],
      bugType: "unknown",
      severity: "unknown",
      suggestedFix: "Please provide more details about the issue"
    };
  }
}

/**
 * Fix the identified bug in the code
 * @param {string} filename - File to fix
 * @param {string} currentCode - Current code content
 * @param {Object} bugAnalysis - Bug analysis from identifyBug
 * @param {string} userMessage - Original user message
 * @returns {string} Fixed code
 */
export async function fixBug(filename, currentCode, bugAnalysis, userMessage) {
  const systemPrompt = `You are an expert React developer who fixes bugs.
Given a bug diagnosis and the current code, fix the bug.

IMPORTANT:
- Only fix the specific bug identified
- Preserve all existing functionality
- Maintain code style and formatting
- Don't add unnecessary features
- Return ONLY the fixed code, no explanations or markdown

The bug diagnosis:
${JSON.stringify(bugAnalysis, null, 2)}`;

  const userPrompt = `User reported: "${userMessage}"

Current code in ${filename}:
${currentCode}

Fix the bug and return the corrected code.`;

  try {
    const isGPT5 = MODELS.GENERATOR.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 2000 } : { max_tokens: 2000 };
    const tempParam = isGPT5 ? {} : { temperature: 0.2 };

    const response = await openai.chat.completions.create({
      model: MODELS.GENERATOR,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      ...tempParam,
      ...tokenParam
    });

    let fixedCode = response.choices[0].message.content;

    // Clean up markdown fences if present
    fixedCode = fixedCode.replace(/```(?:jsx|javascript|js|tsx|ts)?\s*/g, "").replace(/```\s*/g, "").trim();

    // Remove explanatory text before/after code
    const lines = fixedCode.split("\n");
    let startIndex = 0;
    let endIndex = lines.length;

    // Find first import or code line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("import") || lines[i].trim().startsWith("export") || lines[i].trim().startsWith("function") || lines[i].trim().startsWith("const")) {
        startIndex = i;
        break;
      }
    }

    // Find last export or closing brace
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith("export") || lines[i].trim() === "};") {
        endIndex = i + 1;
        break;
      }
    }

    fixedCode = lines.slice(startIndex, endIndex).join("\n");

    return fixedCode;
  } catch (error) {
    console.error("Bug fixing error:", error);
    return currentCode; // Return original code if fix fails
  }
}

/**
 * Debug and fix code (combined workflow)
 * @param {string} userMessage - User's bug report
 * @param {Object} currentFiles - Current project files
 * @returns {Object} Debug results with fixed files
 */
export async function debugAndFix(userMessage, currentFiles) {
  // Step 1: Identify the bug
  const bugAnalysis = await identifyBug(userMessage, currentFiles);

  if (!bugAnalysis.bugFound) {
    return {
      success: false,
      message: "No bug could be identified. Please provide more details.",
      diagnosis: bugAnalysis.diagnosis
    };
  }

  // Step 2: Fix affected files
  const fixedFiles = [];

  for (const filename of bugAnalysis.affectedFiles) {
    if (!currentFiles[filename]) {
      console.warn(`File ${filename} not found in current files`);
      continue;
    }

    const fixedCode = await fixBug(filename, currentFiles[filename], bugAnalysis, userMessage);

    fixedFiles.push({
      filename,
      originalCode: currentFiles[filename],
      fixedCode
    });
  }

  return {
    success: true,
    diagnosis: bugAnalysis.diagnosis,
    bugType: bugAnalysis.bugType,
    severity: bugAnalysis.severity,
    suggestedFix: bugAnalysis.suggestedFix,
    fixedFiles
  };
}
