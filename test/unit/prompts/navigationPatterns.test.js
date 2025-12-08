/**
 * Navigation Pattern Model Comparison Test (with Validation Loop)
 *
 * Tests the REAL flow: LLM generates → Validator catches errors → LLM fixes → repeat
 * This mimics how the actual ToolOrchestrator works.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as parser from "@babel/parser";
import { callLLM, extractContent } from "../../../src/services/utils/llm/llmClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prompts = JSON.parse(readFileSync(join(__dirname, "../../../src/services/prompts.json"), "utf-8"));

// ============ CONFIGURATION ============

const MODELS = [
  { name: "GPT-5.1-codex", id: "gpt-5.1-codex-mini" },
  { name: "GPT-5-mini", id: "gpt-5-mini" },
  { name: "GPT-5-nano", id: "gpt-5-nano" },
  { name: "GPT-4.1-mini", id: "gpt-4.1-mini" },
  { name: "GPT-4.1-nano", id: "gpt-4.1-nano" },
  { name: "GPT-4o-mini", id: "gpt-4o-mini" },
  { name: "o1-mini", id: "o1-mini" },
  { name: "o3-mini", id: "o3-mini" },
  { name: "o4-mini", id: "o4-mini" },
  { name: "Codex-latest", id: "codex-mini-latest" }
];

// Timeout configuration - generous timeouts for potentially slow models
const TIMEOUT_CONFIG = {
  default: 120000,      // 2 min for standard models
  reasoning: 300000,    // 5 min for o1/o3/o4 reasoning models
  gpt5: 300000,         // 5 min for GPT-5 models
  codex: 300000         // 5 min for codex models
};

function getTimeout(modelId) {
  if (modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
    return TIMEOUT_CONFIG.reasoning;
  }
  if (modelId.includes('gpt-5')) {
    return TIMEOUT_CONFIG.gpt5;
  }
  if (modelId.includes('codex')) {
    return TIMEOUT_CONFIG.codex;
  }
  return TIMEOUT_CONFIG.default;
}

const TEST_PROMPTS = [
  {
    name: "Browser with nav bar",
    prompt: "Create a browser app with a navigation bar that has Home, About, Services, and Contact links"
  },
  {
    name: "Responsive navbar",
    prompt: "Build a responsive navbar component with a mobile hamburger menu"
  },
  {
    name: "Dashboard navigation",
    prompt: "Create a dashboard layout with a sidebar navigation menu"
  }
];

const MAX_VALIDATION_LOOPS = 3; // Max attempts to fix code

// ============ VALIDATOR (mirrors validate.js) ============

function validateCode(code) {
  const errors = [];

  // 1. Check JSX syntax
  try {
    parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "classProperties"]
    });
  } catch (parseError) {
    errors.push({
      type: "SYNTAX_ERROR",
      message: `Syntax error: ${parseError.message}`,
      fix: "Fix the syntax error - check for missing brackets, quotes, or semicolons."
    });
    return { valid: false, errors };
  }

  // 2. Check for href="#" patterns
  if (/href\s*=\s*["']#[^"']*["']/.test(code)) {
    errors.push({
      type: "NAVIGATION_ERROR",
      message: 'href="#" causes page reload in Sandpack. Use button with onClick instead.',
      fix: 'Replace <a href="#"> with: <button onClick={handleClick}>Text</button>'
    });
  }

  // 3. Check for mismatched tags (<button>...</a>)
  if (/<button[^>]*>(?:(?!<\/button>).)*?<\/a>/s.test(code)) {
    errors.push({
      type: "MISMATCHED_TAGS",
      message: "Mismatched tags: <button> opened but </a> closed.",
      fix: "Use matching tags: <button onClick={handleClick}>Text</button>"
    });
  }

  // 4. Check for mismatched tags (<a>...</button>)
  if (/<a[^>]*>(?:(?!<\/a>).)*?<\/button>/s.test(code)) {
    errors.push({
      type: "MISMATCHED_TAGS",
      message: "Mismatched tags: <a> opened but </button> closed.",
      fix: "Use matching tags: <button onClick={handleClick}>Text</button>"
    });
  }

  // 5. Check for duplicate className attributes
  if (/className\s*=\s*["'][^"']*["']\s+className\s*=\s*["'][^"']*["']/.test(code)) {
    errors.push({
      type: "DUPLICATE_ATTRIBUTE",
      message: "Duplicate className attributes on same element.",
      fix: 'Merge into single className: className="class1 class2"'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    checks: {
      validJSX: !errors.some(e => e.type === "SYNTAX_ERROR"),
      noHrefHash: !errors.some(e => e.type === "NAVIGATION_ERROR"),
      noMismatchedTags: !errors.some(e => e.type === "MISMATCHED_TAGS"),
      noDuplicateAttrs: !errors.some(e => e.type === "DUPLICATE_ATTRIBUTE")
    }
  };
}

// ============ HELPER FUNCTIONS ============

function checkAPIKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set");
    console.log("Set the environment variable: export OPENAI_API_KEY=your_key_here\n");
    return false;
  }
  return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCheck(passed) {
  return passed ? "✅" : "❌";
}

function printHeader(title) {
  console.log("\n╔" + "═".repeat(68) + "╗");
  console.log("║" + title.padStart(34 + title.length / 2).padEnd(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");
}

function printSectionHeader(title) {
  console.log("\n" + "─".repeat(70));
  console.log(title);
  console.log("─".repeat(70));
}

// ============ PRE-FLIGHT MODEL AVAILABILITY CHECK ============

async function checkModelAvailability(models) {
  console.log("\n🔍 Checking model availability...\n");
  const available = [];
  const unavailable = [];

  for (const model of models) {
    try {
      process.stdout.write(`   ${model.name.padEnd(16)} `);
      const start = Date.now();
      // Some models require minimum token counts, use 50 to be safe
      await callLLM({
        model: model.id,
        systemPrompt: "You are a test assistant.",
        userPrompt: "Say hello in one word.",
        maxTokens: 50,
        timeout: 60000  // 60s timeout for availability check
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✅ Available (${elapsed}s)`);
      available.push(model);
    } catch (error) {
      console.log(`❌ Unavailable: ${error.message}`);
      unavailable.push({ model, error: error.message });
    }
    await sleep(500); // Rate limiting
  }

  console.log(`\n   Summary: ${available.length}/${models.length} models available\n`);

  if (unavailable.length > 0) {
    console.log("   Unavailable models will be skipped:");
    unavailable.forEach(u => console.log(`     - ${u.model.name}: ${u.error}`));
    console.log("");
  }

  return { available, unavailable };
}

// ============ CORE TEST WITH VALIDATION LOOP ============

async function runTestWithLoop(model, testCase) {
  const baseSystemPrompt = `You are an expert React developer.

${prompts.BROWSER_RENDERABILITY_RULES}
${prompts.RAW_CODE_OUTPUT_ONLY}

Generate a complete React component. For navigation links, use <button> with onClick handlers.`;

  let currentCode = null;
  let iteration = 0;
  let validationResult = null;
  const iterationHistory = [];
  const startTime = Date.now();
  const tokenUsage = { prompt: 0, completion: 0, reasoning: 0 };

  // Initial generation
  try {
    console.log(`   Iteration 1: Initial generation...`);

    // Use configured timeout based on model type
    const timeout = getTimeout(model.id);

    const response = await callLLM({
      model: model.id,
      systemPrompt: baseSystemPrompt,
      userPrompt: testCase.prompt,
      maxTokens: 2000,
      temperature: 0.7,
      timeout
    });

    // Track token usage
    if (response.usage) {
      tokenUsage.prompt += response.usage.prompt_tokens || 0;
      tokenUsage.completion += response.usage.completion_tokens || 0;
      tokenUsage.reasoning += response.usage.completion_tokens_details?.reasoning_tokens || 0;
    }

    currentCode = extractContent(response);
    validationResult = validateCode(currentCode);
    iteration = 1;

    iterationHistory.push({
      iteration: 1,
      valid: validationResult.valid,
      errors: validationResult.errors.map(e => e.type)
    });

    // Validation loop - keep fixing until valid or max iterations
    while (!validationResult.valid && iteration < MAX_VALIDATION_LOOPS) {
      iteration++;
      console.log(`   Iteration ${iteration}: Fixing ${validationResult.errors.length} error(s)...`);

      // Build fix prompt with error details
      const errorMessages = validationResult.errors
        .map(e => `- ${e.message}\n  Fix: ${e.fix}`)
        .join("\n");

      const fixPrompt = `The following code has validation errors:

\`\`\`jsx
${currentCode}
\`\`\`

ERRORS FOUND:
${errorMessages}

IMPORTANT - How to fix MISMATCHED_TAGS:
❌ WRONG: <button onClick={...}>Text</a>  (opens button, closes a)
✅ RIGHT: <button onClick={...}>Text</button>  (both must match!)

❌ WRONG: <a href="#" onClick={...}>Text</a>
✅ RIGHT: <button onClick={...}>Text</button>

Please COMPLETELY REWRITE the navigation elements. Do NOT just change the opening tag - you must change BOTH opening AND closing tags to match.

Return ONLY the fixed code, no explanations.`;

      const fixResponse = await callLLM({
        model: model.id,
        systemPrompt: baseSystemPrompt,
        userPrompt: fixPrompt,
        maxTokens: 2000,
        temperature: 0.3, // Lower temperature for fixes
        timeout // Use same timeout as initial generation
      });

      // Track token usage from fix iterations
      if (fixResponse.usage) {
        tokenUsage.prompt += fixResponse.usage.prompt_tokens || 0;
        tokenUsage.completion += fixResponse.usage.completion_tokens || 0;
        tokenUsage.reasoning += fixResponse.usage.completion_tokens_details?.reasoning_tokens || 0;
      }

      currentCode = extractContent(fixResponse);
      validationResult = validateCode(currentCode);

      iterationHistory.push({
        iteration,
        valid: validationResult.valid,
        errors: validationResult.errors.map(e => e.type)
      });

      await sleep(500); // Small delay between iterations
    }

    const endTime = Date.now();

    return {
      success: true,
      code: currentCode,
      validation: validationResult,
      iterations: iteration,
      iterationHistory,
      duration: endTime - startTime,
      passedAfterLoop: validationResult.valid,
      tokenUsage
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      iterations: iteration,
      iterationHistory,
      validation: { valid: false, checks: {} },
      passedAfterLoop: false,
      tokenUsage
    };
  }
}

// ============ MAIN ============

async function main() {
  printHeader("NAVIGATION PATTERN TEST (WITH VALIDATION LOOP)");
  console.log(`Max iterations per test: ${MAX_VALIDATION_LOOPS}`);
  console.log(`Models to test: ${MODELS.length}`);
  console.log("This test mimics the real ToolOrchestrator validation feedback loop.\n");

  if (!checkAPIKey()) {
    console.log("⚠️  Skipping tests: No API key available");
    process.exit(0);
  }

  // Pre-flight: Check which models are available
  const { available: availableModels, unavailable: unavailableModels } = await checkModelAvailability(MODELS);

  if (availableModels.length === 0) {
    console.log("❌ No models available. Exiting.");
    process.exit(1);
  }

  const results = {};

  // Initialize results structure (only for available models)
  for (const model of availableModels) {
    results[model.id] = {
      name: model.name,
      tests: [],
      passedFirstTry: 0,
      passedAfterLoop: 0,
      totalFailed: 0,
      totalIterations: 0,
      totalDuration: 0,
      totalTokens: { prompt: 0, completion: 0, reasoning: 0 }
    };
  }

  // Run tests (only on available models)
  for (const testCase of TEST_PROMPTS) {
    printSectionHeader(`Test: "${testCase.name}"`);

    for (const model of availableModels) {
      console.log(`\n🧪 ${model.name}:`);

      const result = await runTestWithLoop(model, testCase);

      if (result.success) {
        const v = result.validation;

        // Show iteration history
        console.log(`   History: ${result.iterationHistory.map(h =>
          h.valid ? "✅" : `❌(${h.errors.join(",")})`
        ).join(" → ")}`);

        // Debug: Show problematic code if failed
        if (!result.passedAfterLoop && result.code) {
          // Find the mismatched tag pattern
          const match = result.code.match(/<button[^>]*>(?:(?!<\/button>).)*?<\/a>/s);
          if (match) {
            console.log(`   🔍 Problematic code: "${match[0].substring(0, 80)}..."`);
          }
        }

        // Final result
        if (result.passedAfterLoop) {
          if (result.iterations === 1) {
            console.log(`   ✅ PASSED on first try!`);
            results[model.id].passedFirstTry++;
          } else {
            console.log(`   ✅ PASSED after ${result.iterations} iterations`);
            results[model.id].passedAfterLoop++;
          }
        } else {
          console.log(`   ❌ FAILED after ${result.iterations} iterations`);
          console.log(`   Remaining errors: ${v.errors.map(e => e.type).join(", ")}`);
          results[model.id].totalFailed++;
        }

        results[model.id].tests.push(result);
        results[model.id].totalIterations += result.iterations;
        results[model.id].totalDuration += result.duration;
        // Aggregate token usage
        if (result.tokenUsage) {
          results[model.id].totalTokens.prompt += result.tokenUsage.prompt;
          results[model.id].totalTokens.completion += result.tokenUsage.completion;
          results[model.id].totalTokens.reasoning += result.tokenUsage.reasoning;
        }
      } else {
        console.log(`   ❌ ERROR: ${result.error}`);
        results[model.id].totalFailed++;
      }

      await sleep(1000); // Rate limiting
    }
  }

  // Print summary
  printHeader("SUMMARY");

  console.log("Model".padEnd(16) + "1st Try".padEnd(8) + "Fixed".padEnd(8) +
              "Failed".padEnd(8) + "Avg Time".padEnd(10) + "Tokens (P/C/R)");
  console.log("═".repeat(78));

  for (const model of availableModels) {
    const r = results[model.id];
    const totalTests = r.passedFirstTry + r.passedAfterLoop + r.totalFailed;
    const avgTime = totalTests > 0 ? (r.totalDuration / totalTests / 1000).toFixed(1) + "s" : "N/A";
    const tokenStr = `${r.totalTokens.prompt}/${r.totalTokens.completion}/${r.totalTokens.reasoning}`;

    console.log(
      r.name.padEnd(16) +
      r.passedFirstTry.toString().padEnd(8) +
      r.passedAfterLoop.toString().padEnd(8) +
      r.totalFailed.toString().padEnd(8) +
      avgTime.padEnd(10) +
      tokenStr
    );
  }

  console.log("═".repeat(78));
  console.log("Tokens: P=Prompt, C=Completion, R=Reasoning (internal chain-of-thought)");

  // Analysis
  console.log("\n📊 ANALYSIS:");

  for (const model of availableModels) {
    const r = results[model.id];
    const total = r.passedFirstTry + r.passedAfterLoop + r.totalFailed;
    const firstTryRate = total > 0 ? ((r.passedFirstTry / total) * 100).toFixed(0) : 0;
    const loopSuccessRate = total > 0 ? (((r.passedFirstTry + r.passedAfterLoop) / total) * 100).toFixed(0) : 0;

    console.log(`\n   ${r.name}:`);
    console.log(`     • First-try success rate: ${firstTryRate}%`);
    console.log(`     • After validation loop:  ${loopSuccessRate}%`);
    console.log(`     • Average iterations:     ${(r.totalIterations / total).toFixed(1)}`);
  }

  // Comparison
  console.log("\n📈 VALIDATION LOOP EFFECTIVENESS:");
  for (const model of availableModels) {
    const r = results[model.id];
    const fixedByLoop = r.passedAfterLoop;
    if (fixedByLoop > 0) {
      console.log(`   ✅ ${r.name}: Validation loop fixed ${fixedByLoop} test(s) that would have failed!`);
    } else if (r.passedFirstTry === TEST_PROMPTS.length) {
      console.log(`   🎯 ${r.name}: All tests passed on first try (loop not needed)`);
    } else {
      console.log(`   ⚠️  ${r.name}: Validation loop couldn't fix ${r.totalFailed} failure(s)`);
    }
  }

  console.log("\n");

  // Show unavailable models at the end
  if (unavailableModels.length > 0) {
    console.log("⚠️  SKIPPED MODELS (unavailable):");
    unavailableModels.forEach(u => console.log(`   - ${u.model.name}: ${u.error}`));
    console.log("");
  }

  // Exit code - don't fail if some models were unavailable, only fail if available models failed
  const totalFailed = availableModels.reduce((sum, m) => sum + results[m.id].totalFailed, 0);
  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
