/**
 * Scenario Evaluation Test
 * Tests real-world scenarios and evaluates code quality
 */

import { runHybridOrchestrator } from "../../src/services/hybridOrchestrator.js";
import { checkAPIKey, mockHybridUpdate } from "../utils/hybridTestHelpers.js";

/**
 * Check for branding duplication
 */
function checkBrandingDuplication(code, appIdentity) {
  if (!appIdentity || !appIdentity.name) {
    return { score: 10, issues: [], count: 0 };
  }

  const appName = appIdentity.name;
  const tagline = appIdentity.tagline || '';

  // Count occurrences of app name (case-insensitive, but not in comments/imports)
  const codeWithoutComments = code
    .replace(/\/\/.*/g, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

  // Match app name in JSX or strings, not in variable names
  const nameMatches = (codeWithoutComments.match(new RegExp(`[>"'\`]${appName}[<"'\`]`, 'gi')) || []).length;

  // Count tagline if it exists
  const taglineMatches = tagline ? (codeWithoutComments.match(new RegExp(tagline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0;

  const totalBrandingOccurrences = nameMatches + taglineMatches;

  if (totalBrandingOccurrences === 0) {
    return { score: 10, issues: [], count: 0, details: 'No branding found' };
  } else if (totalBrandingOccurrences === 1 || (nameMatches === 1 && taglineMatches === 1)) {
    return { score: 10, issues: [], count: totalBrandingOccurrences, details: 'Branding appears once' };
  } else {
    return {
      score: Math.max(0, 10 - (totalBrandingOccurrences - 1) * 3),
      issues: [`Branding duplication: "${appName}" appears ${nameMatches} times${tagline ? `, tagline appears ${taglineMatches} times` : ''}`],
      count: totalBrandingOccurrences,
      details: `${nameMatches} name + ${taglineMatches} tagline = ${totalBrandingOccurrences} total`
    };
  }
}

/**
 * Evaluate code quality
 */
function evaluateCodeQuality(code, scenario, appIdentity = null) {
  const evaluation = {
    scenario: scenario.name,
    scores: {},
    issues: [],
    strengths: []
  };

  // Check 1: Code completeness (no TODOs, no placeholders)
  const hasTodos = code.includes('TODO') || code.includes('FIXME');
  const hasPlaceholders = code.includes('...') || code.includes('// Add');
  evaluation.scores.completeness = (!hasTodos && !hasPlaceholders) ? 10 : 5;
  if (hasTodos || hasPlaceholders) {
    evaluation.issues.push('Contains TODOs or placeholders');
  } else {
    evaluation.strengths.push('Complete implementation with no placeholders');
  }

  // Check 2: Modern styling (uses Tailwind classes)
  const tailwindPatterns = [
    'bg-', 'text-', 'rounded-', 'shadow-', 'hover:', 'flex', 'grid'
  ];
  const stylingScore = tailwindPatterns.filter(pattern => code.includes(pattern)).length;
  evaluation.scores.styling = Math.min(10, stylingScore * 1.5);
  if (stylingScore >= 5) {
    evaluation.strengths.push(`Rich styling with ${stylingScore} different patterns`);
  } else {
    evaluation.issues.push('Limited styling patterns');
  }

  // Check 3: Import correctness
  const hasImports = code.includes('import ');
  const hasReactImport = code.includes('import React') || code.includes('from "react"') || code.includes('from \'react\'');
  evaluation.scores.imports = hasImports ? 10 : 0;
  if (!hasReactImport && code.includes('useState')) {
    evaluation.issues.push('Missing React import but using hooks');
  }

  // Check 4: Functional patterns (hooks, functional components)
  const usesHooks = code.includes('useState') || code.includes('useEffect') || code.includes('useCallback');
  const usesFunctionalComponent = code.includes('function ') || code.includes('const ') && code.includes('=>');
  evaluation.scores.modernPatterns = (usesHooks ? 5 : 0) + (usesFunctionalComponent ? 5 : 0);
  if (usesHooks) {
    evaluation.strengths.push('Uses React hooks');
  }

  // Check 5: Code length (not too short, not too long)
  const lineCount = code.split('\n').length;
  evaluation.scores.length = lineCount >= 20 && lineCount <= 200 ? 10 : 5;
  evaluation.lineCount = lineCount;

  // Check 6: Export statement
  const hasExport = code.includes('export default') || code.includes('export {');
  evaluation.scores.exports = hasExport ? 10 : 0;
  if (!hasExport) {
    evaluation.issues.push('Missing export statement');
  }

  // Check 7: Branding duplication (if appIdentity provided)
  if (appIdentity) {
    const brandingCheck = checkBrandingDuplication(code, appIdentity);
    evaluation.scores.branding = brandingCheck.score;
    evaluation.brandingCount = brandingCheck.count;

    if (brandingCheck.issues.length > 0) {
      evaluation.issues.push(...brandingCheck.issues);
    } else if (brandingCheck.count > 0) {
      evaluation.strengths.push(`Proper branding placement (${brandingCheck.details})`);
    }
  }

  // Calculate overall score
  const scores = Object.values(evaluation.scores);
  evaluation.overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

  return evaluation;
}

/**
 * Test Scenario 1: Create a new calculator app
 */
async function testCalculatorCreation() {
  console.log('\n📝 SCENARIO 1: Create Calculator App');
  console.log('═'.repeat(70));

  const updateCallback = mockHybridUpdate({ showAgents: true, showPipeline: true });

  try {
    const result = await runHybridOrchestrator(
      "build a calculator with basic operations (add, subtract, multiply, divide)",
      {},
      updateCallback
    );

    console.log(`\n✅ Generation complete`);
    console.log(`📊 Pipeline: ${result.metadata.intent}`);
    console.log(`📁 Files generated: ${Object.keys(result.files).length}`);
    console.log(`🎨 Color scheme: ${result.uxDesign?.colorScheme?.primary || 'N/A'}`);

    // Evaluate each file
    const evaluations = [];
    const appIdentity = result.plan?.appIdentity || result.uxDesign?.appIdentity;

    for (const [filename, code] of Object.entries(result.files)) {
      const evaluation = evaluateCodeQuality(code, { name: `Calculator - ${filename}` }, appIdentity);
      evaluations.push(evaluation);

      console.log(`\n📄 ${filename}:`);
      console.log(`   Overall Score: ${evaluation.overallScore}/10`);
      console.log(`   Lines: ${evaluation.lineCount}`);
      if (evaluation.brandingCount !== undefined) {
        console.log(`   Branding: ${evaluation.brandingCount} occurrences`);
      }
      console.log(`   Strengths: ${evaluation.strengths.slice(0, 2).join(', ') || 'None'}`);
      if (evaluation.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${evaluation.issues.join(', ')}`);
      }
    }

    return {
      success: true,
      evaluations,
      metadata: result.metadata
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 2: Add feature to existing code
 */
async function testFeatureAddition() {
  console.log('\n📝 SCENARIO 2: Add Feature to Existing App');
  console.log('═'.repeat(70));

  const existingApp = {
    "App.jsx": `import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Counter</h1>
        <p className="text-4xl font-bold text-blue-600 mb-4">{count}</p>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default App;`
  };

  const updateCallback = mockHybridUpdate({ showAgents: true, showPipeline: true });

  try {
    const result = await runHybridOrchestrator(
      "add a decrement button and a reset button",
      existingApp,
      updateCallback
    );

    console.log(`\n✅ Modification complete`);
    console.log(`📊 Pipeline: ${result.metadata.intent}`);
    console.log(`📁 Files modified: ${Object.keys(result.files).length}`);

    // Evaluate modifications
    const evaluations = [];
    for (const [filename, code] of Object.entries(result.files)) {
      const evaluation = evaluateCodeQuality(code, { name: `Counter Mod - ${filename}` });
      evaluations.push(evaluation);

      // Check if new features were added
      const hasDecrement = code.includes('Decrement') || code.includes('count - 1');
      const hasReset = code.includes('Reset') || code.includes('setCount(0)');

      console.log(`\n📄 ${filename}:`);
      console.log(`   Overall Score: ${evaluation.overallScore}/10`);
      console.log(`   Lines: ${evaluation.lineCount}`);
      console.log(`   ✓ Decrement button: ${hasDecrement ? 'Yes' : 'No'}`);
      console.log(`   ✓ Reset button: ${hasReset ? 'Yes' : 'No'}`);
      if (evaluation.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${evaluation.issues.join(', ')}`);
      }

      evaluation.featuresAdded = { decrement: hasDecrement, reset: hasReset };
    }

    return {
      success: true,
      evaluations,
      metadata: result.metadata
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 3: Style change (dark mode)
 */
async function testStyleChange() {
  console.log('\n📝 SCENARIO 3: Apply Dark Mode');
  console.log('═'.repeat(70));

  const lightApp = {
    "App.jsx": `import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My App</h1>
        <p className="text-gray-600">Welcome to my application</p>
        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;`
  };

  const updateCallback = mockHybridUpdate({ showAgents: true, showPipeline: true });

  try {
    const result = await runHybridOrchestrator(
      "change to dark theme",
      lightApp,
      updateCallback
    );

    console.log(`\n✅ Style change complete`);
    console.log(`📊 Pipeline: ${result.metadata.intent}`);
    console.log(`🎨 New theme: ${result.uxDesign?.colorScheme?.theme || 'N/A'}`);

    // Evaluate style changes
    const evaluations = [];
    for (const [filename, code] of Object.entries(result.files)) {
      const evaluation = evaluateCodeQuality(code, { name: `Dark Mode - ${filename}` });
      evaluations.push(evaluation);

      // Check for dark mode patterns
      const darkPatterns = {
        darkBg: code.includes('bg-gray-900') || code.includes('bg-slate-900') || code.includes('bg-black'),
        darkText: code.includes('text-white') || code.includes('text-gray-100'),
        darkSurface: code.includes('bg-gray-800') || code.includes('bg-slate-800')
      };

      const darkScore = Object.values(darkPatterns).filter(Boolean).length;

      console.log(`\n📄 ${filename}:`);
      console.log(`   Overall Score: ${evaluation.overallScore}/10`);
      console.log(`   Dark Mode Score: ${darkScore}/3`);
      console.log(`   ✓ Dark background: ${darkPatterns.darkBg ? 'Yes' : 'No'}`);
      console.log(`   ✓ Light text: ${darkPatterns.darkText ? 'Yes' : 'No'}`);
      console.log(`   ✓ Dark surfaces: ${darkPatterns.darkSurface ? 'Yes' : 'No'}`);

      evaluation.darkModeScore = darkScore;
    }

    return {
      success: true,
      evaluations,
      metadata: result.metadata
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Scenario 4: Debug a broken component
 */
async function testBugFix() {
  console.log('\n📝 SCENARIO 4: Fix Bug in Component');
  console.log('═'.repeat(70));

  const brokenApp = {
    "App.jsx": `import React, { useState } from "react";

function App() {
  const [items, setItems] = useState(['Apple', 'Banana', 'Cherry']);

  // BUG: This removes the wrong item
  const removeItem = (index) => {
    setItems(items.filter((item, i) => i === index));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Fruit List</h1>
      <ul>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 mb-2">
            <span>{item}</span>
            <button
              onClick={() => removeItem(index)}
              className="bg-red-500 text-white px-2 py-1 rounded text-sm"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;`
  };

  const updateCallback = mockHybridUpdate({ showAgents: true, showPipeline: true });

  try {
    const result = await runHybridOrchestrator(
      "the remove button is keeping the clicked item instead of removing it",
      brokenApp,
      updateCallback
    );

    console.log(`\n✅ Bug fix complete`);
    console.log(`📊 Pipeline: ${result.metadata.intent}`);

    // Evaluate fix
    const evaluations = [];
    for (const [filename, code] of Object.entries(result.files)) {
      const evaluation = evaluateCodeQuality(code, { name: `Bug Fix - ${filename}` });
      evaluations.push(evaluation);

      // Check if bug is fixed (should filter with !== instead of ===)
      const hasCorrectFilter = code.includes('i !== index') || code.includes('i != index');
      const stillHasBug = code.includes('i === index') && code.includes('filter');

      console.log(`\n📄 ${filename}:`);
      console.log(`   Overall Score: ${evaluation.overallScore}/10`);
      console.log(`   ✓ Bug fixed: ${hasCorrectFilter ? 'Yes' : 'No'}`);
      console.log(`   ✗ Still has bug: ${stillHasBug ? 'Yes' : 'No'}`);

      evaluation.bugFixed = hasCorrectFilter && !stillHasBug;
    }

    return {
      success: true,
      evaluations,
      metadata: result.metadata
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Generate final report
 */
function generateReport(results) {
  console.log('\n\n' + '═'.repeat(70));
  console.log('                    EVALUATION REPORT');
  console.log('═'.repeat(70));

  let totalTests = 0;
  let successfulTests = 0;
  let totalScore = 0;
  let scoreCount = 0;

  results.forEach((result, index) => {
    totalTests++;
    if (result.success) successfulTests++;

    console.log(`\nScenario ${index + 1}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);

    if (result.evaluations) {
      result.evaluations.forEach(evaluation => {
        console.log(`  ${evaluation.scenario}: ${evaluation.overallScore}/10`);
        totalScore += parseFloat(evaluation.overallScore);
        scoreCount++;
      });
    }

    if (result.metadata) {
      console.log(`  Pipeline: ${result.metadata.intent}`);
      console.log(`  Estimated Tokens: ${result.metadata.estimatedTokens}`);
    }

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;
  const successRate = totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(1) : 0;

  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Scenarios: ${totalTests}`);
  console.log(`Successful: ${successfulTests} (${successRate}%)`);
  console.log(`Average Code Quality: ${avgScore}/10`);
  console.log('═'.repeat(70) + '\n');
}

/**
 * Run all scenario evaluations
 */
async function runAllScenarios() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   SCENARIO EVALUATION TEST SUITE       ║');
  console.log('╚════════════════════════════════════════╝');

  if (!checkAPIKey()) {
    return;
  }

  const results = [];

  // Run all scenarios
  results.push(await testCalculatorCreation());
  results.push(await testFeatureAddition());
  results.push(await testStyleChange());
  results.push(await testBugFix());

  // Generate final report
  generateReport(results);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllScenarios();
}

export default {
  testCalculatorCreation,
  testFeatureAddition,
  testStyleChange,
  testBugFix,
  runAllScenarios
};
