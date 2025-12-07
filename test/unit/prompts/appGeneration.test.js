/**
 * App Generation Test
 * Verifies that the AI agent can generate complete, working apps from generic prompts
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { callLLM, extractContent } from "../../../src/services/utils/llm/llmClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prompts = JSON.parse(readFileSync(join(__dirname, "../../../src/services/prompts.json"), "utf-8"));

// Basic patterns that should be in every generated app
const CORE_PATTERNS = [
  "function",      // Should have function components
  "return",        // Should return JSX
  "export default" // Should export the component
];

// Patterns that should NOT be present
const SHOULD_NOT_HAVE = [
  "import React from",           // React is global
  "from \"framer-motion\"",      // framer-motion is global
  "from 'framer-motion'",
];

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

async function retryTest(testFn, maxRetries = 1, delay = 2000) {
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

async function runTest(name, userPrompt, requiredPatterns = []) {
  console.log(`\n📋 Test: ${name}\n`);

  const systemPrompt = `You are an expert React developer.
${prompts.FRAMER_MOTION_USAGE}
${prompts.BROWSER_RENDERABILITY_RULES}
${prompts.RAW_CODE_OUTPUT_ONLY}`;

  const response = await callLLM({
    model: "gpt-4o",
    systemPrompt,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 60000,
  });

  const code = extractContent(response);
  console.log("Generated code (first 800 chars):\n");
  console.log(code.substring(0, 800));
  console.log("\n...\n");

  // Check core patterns
  const missingCore = CORE_PATTERNS.filter(p => !code.includes(p));
  if (missingCore.length > 0) {
    throw new Error(`Missing core patterns: ${missingCore.join(", ")}`);
  }
  console.log("✅ Has core React patterns");

  // Check required patterns for this specific test
  if (requiredPatterns.length > 0) {
    const missingPatterns = requiredPatterns.filter(p => !code.includes(p));
    if (missingPatterns.length > 0) {
      throw new Error(`Missing patterns: ${missingPatterns.join(", ")}`);
    }
    console.log("✅ Has required feature patterns");
  }

  // Check for wrong imports
  const wrongImports = SHOULD_NOT_HAVE.filter(p => code.includes(p));
  if (wrongImports.length > 0) {
    throw new Error(`Should NOT have: "${wrongImports[0]}"`);
  }
  console.log("✅ No incorrect imports");

  return true;
}

// ============ SIMPLE APPS ============

async function test_TipCalculator() {
  return runTest(
    "Tip Calculator",
    "Make a tip calculator",
    ["useState", "%", "tip"]
  );
}

async function test_CountdownTimer() {
  return runTest(
    "Countdown Timer",
    "Create a countdown timer",
    ["useState", "setInterval", "setTimeout"]
  );
}

async function test_ColorPalette() {
  return runTest(
    "Color Palette Generator",
    "Build a color palette generator",
    ["useState", "color", "#"]
  );
}

// ============ INTERACTIVE APPS ============

async function test_QuizGame() {
  return runTest(
    "Quiz Game",
    "Build a quiz game with score tracking",
    ["useState", "score", "question"]
  );
}

async function test_TypingTest() {
  return runTest(
    "Typing Speed Test",
    "Make a typing speed test",
    ["useState", "onChange", "time"]
  );
}

// ============ UTILITY APPS ============

async function test_UnitConverter() {
  return runTest(
    "Unit Converter",
    "Build a unit converter",
    ["useState", "convert", "onChange"]
  );
}

async function test_PasswordGenerator() {
  return runTest(
    "Password Generator",
    "Create a password generator",
    ["useState", "random", "length"]
  );
}

// ============ FUN APPS ============

async function test_Magic8Ball() {
  return runTest(
    "Magic 8-Ball",
    "Build a magic 8-ball",
    ["useState", "random", "onClick"]
  );
}

async function test_VirtualPet() {
  return runTest(
    "Virtual Pet",
    "Create a virtual pet",
    ["useState", "onClick"]
  );
}

// ============ GAMES ============

async function test_MemoryGame() {
  return runTest(
    "Memory Card Game",
    "Build a memory card game",
    ["useState", "onClick", "match"]
  );
}

async function test_WhackAMole() {
  return runTest(
    "Whack-a-Mole",
    "Make a whack-a-mole game",
    ["useState", "setInterval", "score"]
  );
}

// ============ VISUALLY IMPRESSIVE ============

async function test_WeatherDashboard() {
  return runTest(
    "Weather Dashboard",
    "Create an animated weather dashboard",
    ["useState", "motion."]
  );
}

async function test_SolarSystem() {
  return runTest(
    "Interactive Solar System",
    "Make an interactive solar system",
    ["useState", "planet"]
  );
}

// Run all tests
async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("APP GENERATION TESTS");
  console.log("═".repeat(60));

  if (!checkAPIKey()) {
    console.log("⚠️ Skipping tests: No API key available");
    process.exit(0);
  }

  const tests = [
    // Simple
    test_TipCalculator,
    test_CountdownTimer,
    test_ColorPalette,
    // Interactive
    test_QuizGame,
    test_TypingTest,
    // Utility
    test_UnitConverter,
    test_PasswordGenerator,
    // Fun
    test_Magic8Ball,
    test_VirtualPet,
    // Games
    test_MemoryGame,
    test_WhackAMole,
    // Visual
    test_WeatherDashboard,
    test_SolarSystem,
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
