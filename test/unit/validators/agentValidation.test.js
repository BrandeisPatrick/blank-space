/**
 * Test Runner for AI Agent Code Generation
 * Tests validation, cleanup, and code quality
 */

import {
  validateFile,
  validateFiles,
  validateNoMarkdown,
  validateDoubleQuotes,
  validateFolderStructure,
  validateTailwindClasses,
  validateSingleFileOutput,
  validateNoDuplicates
} from "./codeQuality.test.js";

import {
  goodResponse_AppJsx,
  badResponse_WithMarkdown,
  badResponse_MultiFile,
  badResponse_SingleQuotes,
  badResponse_DuplicateImports,
  badResponse_NoStyling,
  badResponse_WithExplanation,
  goodResponse_ComponentWithStyling,
  goodResponse_CustomHook,
  goodFilesStructure,
  badFilesStructure
} from "../../__mocks__/mockResponses.js";

import { cleanGeneratedCode } from "../../../src/services/utils/code/codeCleanup.js";

/**
 * Test Suite: Code Cleanup
 */
function testCodeCleanup() {
  console.log("\n========================================");
  console.log("TEST SUITE: Code Cleanup");
  console.log("========================================\n");

  const tests = [
    {
      name: "Clean markdown fences",
      input: badResponse_WithMarkdown,
      shouldPass: (output) => !output.includes("```")
    },
    {
      name: "Extract first file from multi-file response",
      input: badResponse_MultiFile,
      shouldPass: (output) => !output.includes("// components/Header.jsx")
    },
    {
      name: "Remove explanatory text",
      input: badResponse_WithExplanation,
      shouldPass: (output) => !output.includes("Here's the code")
    },
    {
      name: "Keep good code unchanged",
      input: goodResponse_AppJsx,
      shouldPass: (output) => output.includes("function App()")
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const output = cleanGeneratedCode(test.input);
    const success = test.shouldPass(output);

    if (success) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log("   Output:", output.substring(0, 100) + "...");
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite: Individual Validators
 */
function testValidators() {
  console.log("\n========================================");
  console.log("TEST SUITE: Validators");
  console.log("========================================\n");

  const tests = [
    {
      name: "Detect markdown fences",
      validator: () => validateNoMarkdown(badResponse_WithMarkdown),
      shouldFail: true
    },
    {
      name: "Pass clean code (no markdown)",
      validator: () => validateNoMarkdown(goodResponse_AppJsx),
      shouldFail: false
    },
    {
      name: "Detect single quotes",
      validator: () => validateDoubleQuotes(badResponse_SingleQuotes),
      shouldFail: true
    },
    {
      name: "Pass double quotes",
      validator: () => validateDoubleQuotes(goodResponse_AppJsx),
      shouldFail: false
    },
    {
      name: "Detect multi-file output",
      validator: () => validateSingleFileOutput(badResponse_MultiFile),
      shouldFail: true
    },
    {
      name: "Pass single file output",
      validator: () => validateSingleFileOutput(goodResponse_AppJsx),
      shouldFail: false
    },
    {
      name: "Detect duplicate imports",
      validator: () => validateNoDuplicates(badResponse_DuplicateImports),
      shouldFail: true
    },
    {
      name: "Pass no duplicates",
      validator: () => validateNoDuplicates(goodResponse_CustomHook),
      shouldFail: false
    },
    {
      name: "Detect missing Tailwind classes",
      validator: () => validateTailwindClasses(badResponse_NoStyling),
      shouldFail: true
    },
    {
      name: "Pass modern Tailwind styling",
      validator: () => validateTailwindClasses(goodResponse_ComponentWithStyling),
      shouldFail: false
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const result = test.validator();
    const success = test.shouldFail ? !result.valid : result.valid;

    if (success) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log("   Errors:", result.errors);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite: File Structure Validation
 */
function testFileStructure() {
  console.log("\n========================================");
  console.log("TEST SUITE: File Structure");
  console.log("========================================\n");

  const tests = [
    {
      name: "Pass good folder structure",
      files: goodFilesStructure,
      shouldPass: true
    },
    {
      name: "Fail flat file structure",
      files: badFilesStructure,
      shouldPass: false
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const result = validateFiles(test.files);
    const success = test.shouldPass ? result.valid : !result.valid;

    if (success) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log("   Structure Errors:", result.structureErrors);
      result.fileResults.forEach((fileResult) => {
        if (!fileResult.valid) {
          console.log(`   ${fileResult.filename}:`, fileResult.errors);
        }
      });
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Run All Tests
 */
export function runAllTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   AI CODE GENERATION TEST SUITE       ║");
  console.log("╚════════════════════════════════════════╝");

  const cleanupResults = testCodeCleanup();
  const validatorResults = testValidators();
  const structureResults = testFileStructure();

  const totalPassed = cleanupResults.passed + validatorResults.passed + structureResults.passed;
  const totalFailed = cleanupResults.failed + validatorResults.failed + structureResults.failed;
  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║           FINAL RESULTS                ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);

  return {
    totalPassed,
    totalFailed,
    totalTests,
    successRate: (totalPassed / totalTests) * 100
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
