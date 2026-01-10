/**
 * Framer Motion Knowledge Test
 * Verifies that the AI agent correctly uses Framer Motion patterns
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { callLLM, extractContent } from "../../../src/services/utils/llm/llmClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prompts = JSON.parse(readFileSync(join(__dirname, "../../../src/services/prompts.json"), "utf-8"));

// Patterns that should NOT be present (framer-motion is global, not imported)
const SHOULD_NOT_IMPORT = [
  "import { motion }",
  "import { AnimatePresence }",
  "from \"framer-motion\"",
  "from 'framer-motion'",
];

// Simple helper to check API key
function checkAPIKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set");
    console.log("Set the environment variable: export OPENAI_API_KEY=your_key_here\n");
    return false;
  }
  return true;
}

// Simple sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry helper
async function retryTest(testFn, maxRetries = 2, delay = 2000) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await testFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        console.log(`  ⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Generic test runner
async function runTest(name, userPrompt, requiredPatterns) {
  console.log(`\n📋 Test: ${name}\n`);

  const systemPrompt = `You are an expert React developer.
${prompts.FRAMER_MOTION_USAGE}
${prompts.BROWSER_RENDERABILITY_RULES}
${prompts.RAW_CODE_OUTPUT_ONLY}`;

  const response = await callLLM({
    model: "gpt-4o",
    systemPrompt,
    userPrompt,
    maxTokens: 1500,
    temperature: 0.7,
    timeout: 60000,
  });

  const code = extractContent(response);
  console.log("Generated code (first 600 chars):\n");
  console.log(code.substring(0, 600));
  console.log("\n...\n");

  // Check for required patterns
  const missingPatterns = requiredPatterns.filter(p => !code.includes(p));
  if (missingPatterns.length > 0) {
    throw new Error(`Missing patterns: ${missingPatterns.join(", ")}`);
  }
  console.log("✅ Found all required patterns");

  // Check that it doesn't try to import framer-motion
  const wrongImports = SHOULD_NOT_IMPORT.filter(p => code.includes(p));
  if (wrongImports.length > 0) {
    throw new Error(`Should NOT import framer-motion: found "${wrongImports[0]}"`);
  }
  console.log("✅ No framer-motion imports (correct)");

  return true;
}

// Test 1: Basic hover/tap animations (generic prompt)
async function test1_HoverTap() {
  return runTest(
    "1. Hover & Tap Animations",
    "Make a button that feels interactive and responsive when users hover or click it.",
    ["motion.", "whileHover", "whileTap"]
  );
}

// Test 2: Enter/Exit animations with AnimatePresence (generic prompt)
async function test2_AnimatePresence() {
  return runTest(
    "2. AnimatePresence (Enter/Exit)",
    "Create a modal that appears and disappears smoothly with a fade effect.",
    ["AnimatePresence", "motion.", "initial", "animate", "exit"]
  );
}

// Test 3: Staggered list animations (generic prompt)
async function test3_StaggeredList() {
  return runTest(
    "3. Staggered List Animations",
    "Show a list of items where each one fades in one after another, not all at once.",
    ["motion.", "initial", "animate", "delay", "index"]
  );
}

// Test 4: Draggable elements (generic prompt)
async function test4_Draggable() {
  return runTest(
    "4. Draggable Elements",
    "Make a card component that I can drag around the screen freely.",
    ["motion.", "drag", "dragConstraints"]
  );
}

// Test 5: Layout animations (generic prompt)
async function test5_LayoutAnimations() {
  return runTest(
    "5. Layout Animations",
    "Create a grid of items that animate smoothly when they get reordered or filtered.",
    ["motion.", "layout"]
  );
}

// Run all tests
async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("FRAMER MOTION KNOWLEDGE TESTS");
  console.log("═".repeat(60));

  if (!checkAPIKey()) {
    console.log("⚠️ Skipping tests: No API key available");
    process.exit(0);
  }

  const tests = [
    test1_HoverTap,
    test2_AnimatePresence,
    test3_StaggeredList,
    test4_Draggable,
    test5_LayoutAnimations,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await retryTest(test, 1, 2000);
      console.log("✅ PASS\n");
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${error.message}\n`);
      failed++;
    }
    // Small delay between tests
    await sleep(1000);
  }

  console.log("═".repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("═".repeat(60) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main();
