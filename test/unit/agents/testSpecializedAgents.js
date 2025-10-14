/**
 * Test Specialized Agents
 * Tests for UX Designer, Architecture Designer, Debugger, and Validator agents
 */

import { designUX, extractUXFromCode } from "../../../src/services/agents/uxDesigner.js";
import { designArchitecture, inferArchitectureFromCode, generateImportPath } from "../../../src/services/agents/architectureDesigner.js";
import { validateCode, quickValidate, ValidationMode } from "../../../src/services/agents/validator.js";
import { analyze, AnalysisMode } from "../../../src/services/agents/analyzer.js";
import { completeTodoApp, todoAppBrokenDelete } from "../../__mocks__/mockExistingProjects.js";
import { hasAPIKey, checkAPIKey, assertAgentOutput, createCounters, assert, countersToResults, printHybridSuiteHeader, printHybridTestResults } from "../../utils/hybridTestHelpers.js";

/**
 * Test UX Designer Agent
 */
async function testUXDesigner() {
  printHybridSuiteHeader("UX DESIGNER AGENT TESTS", "Design system generation and extraction");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 4 };
  }

  const counters = createCounters();

  try {
    // Test 1: Create new design system
    console.log("\n📝 Test 1: Create new design system");
    const uxDesign = await designUX({
      appIdentity: { name: "Test App", tagline: "Testing UX", tone: "professional" },
      userRequest: "build a modern todo app",
      mode: 'create_new'
    });

    assert(
      uxDesign.colorScheme && uxDesign.designStyle && uxDesign.uxPatterns,
      "UX design has required properties",
      counters
    );

    // Test 2: Check color creativity (3+ distinct colors)
    console.log("\n📝 Test 2: Color creativity check");
    const hasMultipleColors = uxDesign.colorScheme?.primary && 
                              uxDesign.colorScheme?.secondary && 
                              uxDesign.colorScheme?.accent;
    assert(hasMultipleColors, "Design uses 3+ distinct colors", counters);

    // Test 3: Extract UX from existing code
    console.log("\n📝 Test 3: Extract UX from existing code");
    const extractedUX = extractUXFromCode(completeTodoApp);
    assert(
      extractedUX.colorScheme && extractedUX.designStyle,
      "UX extraction successful",
      counters
    );

    // Test 4: Redesign mode
    console.log("\n📝 Test 4: Redesign mode");
    const redesign = await designUX({
      appIdentity: uxDesign.appIdentity,
      userRequest: "make it dark mode",
      mode: 'redesign',
      currentStyles: extractedUX
    });
    assert(
      redesign.colorScheme?.theme === "dark",
      "Redesign produces dark theme",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed++;
  }

  return countersToResults(counters);
}

/**
 * Test Architecture Designer Agent
 */
async function testArchitectureDesigner() {
  printHybridSuiteHeader("ARCHITECTURE DESIGNER AGENT TESTS", "File organization and imports");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  const counters = createCounters();

  try {
    // Test 1: Design architecture for new files
    console.log("\n📝 Test 1: Design architecture for new project");
    const plan = {
      filesToCreate: ["App.jsx", "Header.jsx", "TodoList.jsx", "useTodos.js"],
      fileDetails: {}
    };
    const architecture = await designArchitecture({ plan, mode: 'create_new', currentFiles: {} });
    
    assert(
      architecture.fileStructure && architecture.importPaths,
      "Architecture has required properties",
      counters
    );

    // Test 2: Infer architecture from existing code
    console.log("\n📝 Test 2: Infer architecture from existing code");
    const inferred = inferArchitectureFromCode(completeTodoApp);
    const fileCount = Object.keys(inferred.fileStructure).length;
    assert(
      fileCount === Object.keys(completeTodoApp).length,
      `Inferred all ${fileCount} files`,
      counters
    );

    // Test 3: Generate import paths
    console.log("\n📝 Test 3: Generate correct import paths");
    const path = generateImportPath("App.jsx", "Header.jsx", architecture);
    assert(
      path.startsWith("./"),
      "Import path is relative",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed++;
  }

  return countersToResults(counters);
}

// Debugger tests removed - use testDebugger.js instead

/**
 * Test Validator Agent
 */
function testValidator() {
  printHybridSuiteHeader("VALIDATOR AGENT TESTS", "Code validation and auto-fix");

  const counters = createCounters();

  try {
    // Test 1: Syntax validation
    console.log("\n📝 Test 1: Syntax validation (balanced braces)");
    const badSyntax = "function test() { return 'unclosed";
    const result1 = validateCode({ code: badSyntax, filename: "test.js", mode: ValidationMode.SYNTAX_ONLY });
    assert(!result1.valid, "Detects syntax errors", counters);

    // Test 2: Format validation (quotes)
    console.log("\n📝 Test 2: Format validation (double quotes)");
    const singleQuotes = "import React from 'react';";
    const result2 = validateCode({ code: singleQuotes, filename: "test.js", mode: ValidationMode.FORMAT_ONLY });
    assert(result2.warnings.length > 0, "Detects single quotes", counters);

    // Test 3: Package validation
    console.log("\n📝 Test 3: Package validation (banned packages)");
    const bannedImport = "import axios from 'axios';\nconst x = 1;";
    const result3 = validateCode({ code: bannedImport, filename: "test.js", mode: ValidationMode.FAST });
    assert(!result3.valid, "Detects banned packages", counters);

    // Test 4: Initialization validation
    console.log("\n📝 Test 4: Initialization validation (no ReactDOM)");
    const reactDomCode = "import ReactDOM from 'react-dom';\nReactDOM.render(<App />, root);";
    const result4 = validateCode({ code: reactDomCode, filename: "test.js", mode: ValidationMode.FULL });
    assert(!result4.valid, "Detects ReactDOM usage", counters);

    // Test 5: Auto-fix capability
    console.log("\n📝 Test 5: Auto-fix application");
    const fixableCode = "import React from 'react';\nfunction App() { return <div className='test'></div>; }";
    const result5 = validateCode({ code: fixableCode, filename: "test.jsx", mode: ValidationMode.FULL });
    assert(result5.code.includes('"'), "Auto-fixes quotes", counters);

    // Test 6: Quick validate (syntax only)
    console.log("\n📝 Test 6: Quick validate");
    const validCode = "const x = 1;";
    const quickValid = quickValidate(validCode);
    assert(quickValid, "Quick validate passes for valid code", counters);

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed++;
  }

  return countersToResults(counters);
}

/**
 * Test Enhanced Analyzer Agent
 */
async function testEnhancedAnalyzer() {
  printHybridSuiteHeader("ENHANCED ANALYZER AGENT TESTS", "Mode-specific analysis");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 4 };
  }

  const counters = createCounters();

  try {
    // Test 1: MODIFICATION mode
    console.log("\n📝 Test 1: MODIFICATION mode analysis");
    const modResult = await analyze({
      userMessage: "change colors to green",
      currentFiles: completeTodoApp,
      mode: AnalysisMode.MODIFICATION
    });
    assert(
      modResult.filesToModify && modResult.filesToModify.length > 0,
      `Identified ${modResult.filesToModify?.length || 0} files to modify`,
      counters
    );

    // Test 2: DEBUG mode
    console.log("\n📝 Test 2: DEBUG mode analysis");
    const debugResult = await analyze({
      userMessage: "delete button not working",
      currentFiles: todoAppBrokenDelete,
      mode: AnalysisMode.DEBUG
    });
    assert(
      debugResult.errorFile,
      "Identified error location",
      counters
    );

    // Test 3: STYLE_EXTRACTION mode
    console.log("\n📝 Test 3: STYLE_EXTRACTION mode analysis");
    const styleResult = await analyze({
      userMessage: "make it dark",
      currentFiles: completeTodoApp,
      mode: AnalysisMode.STYLE_EXTRACTION
    });
    assert(
      styleResult.currentStyles && styleResult.styledFiles,
      "Extracted current styles",
      counters
    );

    // Test 4: EXPLAIN mode
    console.log("\n📝 Test 4: EXPLAIN mode analysis");
    const explainResult = await analyze({
      userMessage: "how does this work?",
      currentFiles: completeTodoApp,
      mode: AnalysisMode.EXPLAIN
    });
    assert(
      explainResult.explanation,
      "Generated explanation",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed++;
  }

  return countersToResults(counters);
}

/**
 * Run all specialized agent tests
 */
export async function runSpecializedAgentTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   SPECIALIZED AGENT TEST SUITE         ║");
  console.log("╚════════════════════════════════════════╝");

  if (!checkAPIKey()) {
    return { totalPassed: 0, totalFailed: 0, totalTests: 0, skipped: true };
  }

  const uxResults = await testUXDesigner();
  const archResults = await testArchitectureDesigner();
  const validatorResults = testValidator();
  const analyzerResults = await testEnhancedAnalyzer();

  const totalPassed =
    uxResults.totalPassed +
    archResults.totalPassed +
    validatorResults.totalPassed +
    analyzerResults.totalPassed;

  const totalFailed =
    uxResults.totalFailed +
    archResults.totalFailed +
    validatorResults.totalFailed +
    analyzerResults.totalFailed;

  const totalTests = totalPassed + totalFailed;

  printHybridTestResults({
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped: 0
  });

  return {
    totalPassed,
    totalFailed,
    totalTests,
    successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSpecializedAgentTests();
}

export default {
  testUXDesigner,
  testArchitectureDesigner,
  testValidator,
  testEnhancedAnalyzer,
  runSpecializedAgentTests
};
