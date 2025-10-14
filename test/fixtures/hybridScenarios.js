/**
 * Hybrid Orchestrator Test Scenarios
 * Test scenarios specific to the hybrid agent system
 */

import { completeTodoApp, basicTodoAppNoDelete, simpleCounterApp, todoAppBrokenDelete, counterAppBrokenIncrement, todoAppMissingHandler } from "../mockExistingProjects.js";

/**
 * CREATE_NEW Pipeline Scenarios
 */
export const createNewScenarios = [
  {
    name: "Weather App Creation",
    userRequest: "build a weather app",
    expectedIntent: "CREATE_NEW",
    currentFiles: {},
    expectedPipeline: ['planner', 'ux-designer', 'architecture-designer', 'generator', 'validator'],
    expectedFiles: ["App.jsx", "components", "hooks"],
    requiredFeatures: ["weather display", "search location", "temperature"],
    estimatedTokens: 11300
  },
  {
    name: "Calculator Creation",
    userRequest: "create a calculator app",
    expectedIntent: "CREATE_NEW",
    currentFiles: {},
    expectedPipeline: ['planner', 'ux-designer', 'architecture-designer', 'generator', 'validator'],
    expectedFiles: ["App.jsx", "components", "hooks"],
    requiredFeatures: ["number buttons", "operators", "display", "calculate"],
    estimatedTokens: 11300
  },
  {
    name: "Kanban Board Creation",
    userRequest: "make a kanban board",
    expectedIntent: "CREATE_NEW",
    currentFiles: {},
    expectedPipeline: ['planner', 'ux-designer', 'architecture-designer', 'generator', 'validator'],
    expectedFiles: ["App.jsx", "components", "hooks"],
    requiredFeatures: ["drag and drop", "columns", "cards", "add task"],
    estimatedTokens: 11300
  }
];

/**
 * MODIFY Pipeline Scenarios
 */
export const modifyScenarios = [
  {
    name: "Add Delete Functionality",
    userRequest: "add delete functionality to each todo",
    expectedIntent: "MODIFY",
    currentFiles: basicTodoAppNoDelete,
    expectedPipeline: ['analyzer', 'modifier', 'validator'],
    expectedFilesToModify: ["components/TodoList.jsx", "components/TodoItem.jsx"],
    requiredChanges: ["delete button", "removeTodo function"],
    estimatedTokens: 6100
  },
  {
    name: "Change Color Theme",
    userRequest: "change all blue to green",
    expectedIntent: "MODIFY",
    currentFiles: completeTodoApp,
    expectedPipeline: ['analyzer', 'modifier', 'validator'],
    expectedFilesToModify: ["components/Header.jsx", "components/TodoList.jsx"],
    requiredChanges: ["bg-green", "text-green"],
    estimatedTokens: 6100
  },
  {
    name: "Add Dark Mode Toggle",
    userRequest: "add a dark mode toggle button",
    expectedIntent: "MODIFY",
    currentFiles: completeTodoApp,
    expectedPipeline: ['analyzer', 'modifier', 'validator'],
    expectedFilesToModify: ["App.jsx", "components/Header.jsx"],
    requiredChanges: ["dark mode", "toggle", "useState"],
    estimatedTokens: 6100
  }
];

/**
 * DEBUG Pipeline Scenarios
 */
export const debugScenarios = [
  {
    name: "Fix Broken Delete Logic",
    userRequest: "fix the delete button - it's not working",
    expectedIntent: "DEBUG",
    currentFiles: todoAppBrokenDelete,
    expectedPipeline: ['analyzer', 'debugger', 'modifier', 'validator'],
    expectedError: {
      file: "hooks/useTodos.js",
      type: "state-mutation",
      pattern: "filter logic error"
    },
    expectedFix: "Change '===' to '!==' in filter",
    estimatedTokens: 7800
  },
  {
    name: "Fix Broken Increment",
    userRequest: "the increment button adds 2 instead of 1",
    expectedIntent: "DEBUG",
    currentFiles: counterAppBrokenIncrement,
    expectedPipeline: ['analyzer', 'debugger', 'modifier', 'validator'],
    expectedError: {
      file: "components/Counter.jsx",
      type: "logic-error",
      pattern: "count + 2"
    },
    expectedFix: "Change 'count + 2' to 'count + 1'",
    estimatedTokens: 7800
  },
  {
    name: "Fix Missing Event Handler",
    userRequest: "delete button doesn't do anything when clicked",
    expectedIntent: "DEBUG",
    currentFiles: todoAppMissingHandler,
    expectedPipeline: ['analyzer', 'debugger', 'modifier', 'validator'],
    expectedError: {
      file: "components/TodoItem.jsx",
      type: "event-handler",
      pattern: "missing onClick"
    },
    expectedFix: "Add onClick={() => onRemove(todo.id)}",
    estimatedTokens: 7800
  }
];

/**
 * STYLE_CHANGE Pipeline Scenarios
 */
export const styleChangeScenarios = [
  {
    name: "Dark Mode Redesign",
    userRequest: "make it dark theme",
    expectedIntent: "STYLE_CHANGE",
    currentFiles: completeTodoApp,
    expectedPipeline: ['analyzer', 'ux-designer', 'modifier'],
    expectedStyleChanges: {
      theme: "dark",
      background: "dark gradients",
      textColors: "light text"
    },
    estimatedTokens: 7200
  },
  {
    name: "Modern UI Redesign",
    userRequest: "make it look more modern with glassmorphism",
    expectedIntent: "STYLE_CHANGE",
    currentFiles: simpleCounterApp,
    expectedPipeline: ['analyzer', 'ux-designer', 'modifier'],
    expectedStyleChanges: {
      aesthetic: "glassmorphism",
      effects: "backdrop-blur",
      shadows: "heavy"
    },
    estimatedTokens: 7200
  }
];

/**
 * EXPLAIN Pipeline Scenarios
 */
export const explainScenarios = [
  {
    name: "Explain Todo App",
    userRequest: "explain how this todo app works",
    expectedIntent: "EXPLAIN",
    currentFiles: completeTodoApp,
    expectedPipeline: ['analyzer'],
    expectedExplanation: {
      relevantFiles: ["App.jsx", "components/TodoList.jsx", "hooks/useTodos.js"],
      keyFeatures: ["add todos", "remove todos", "list display"]
    },
    estimatedTokens: 2400
  },
  {
    name: "Explain Counter Logic",
    userRequest: "what does the counter component do?",
    expectedIntent: "EXPLAIN",
    currentFiles: simpleCounterApp,
    expectedPipeline: ['analyzer'],
    expectedExplanation: {
      relevantFiles: ["components/Counter.jsx"],
      keyFeatures: ["increment", "decrement", "reset"]
    },
    estimatedTokens: 2400
  }
];

/**
 * All scenarios grouped by pipeline type
 */
export const allHybridScenarios = {
  CREATE_NEW: createNewScenarios,
  MODIFY: modifyScenarios,
  DEBUG: debugScenarios,
  STYLE_CHANGE: styleChangeScenarios,
  EXPLAIN: explainScenarios
};

/**
 * Get scenarios by pipeline type
 * @param {string} pipelineType - Pipeline type
 * @returns {Array} Scenarios for that pipeline
 */
export function getScenariosByPipeline(pipelineType) {
  return allHybridScenarios[pipelineType] || [];
}

/**
 * Get all scenarios
 * @returns {Array} All scenarios
 */
export function getAllScenarios() {
  return [
    ...createNewScenarios,
    ...modifyScenarios,
    ...debugScenarios,
    ...styleChangeScenarios,
    ...explainScenarios
  ];
}

/**
 * Calculate total estimated token savings
 * Baseline: Old orchestrator uses ~20,000 tokens per request
 * @param {Array} scenarios - Scenarios to calculate for
 * @returns {Object} Token savings calculation
 */
export function calculateEstimatedSavings(scenarios = getAllScenarios()) {
  const oldOrchestratorTokensPerRequest = 20000;
  
  let totalOldTokens = 0;
  let totalHybridTokens = 0;

  scenarios.forEach(scenario => {
    totalOldTokens += oldOrchestratorTokensPerRequest;
    totalHybridTokens += scenario.estimatedTokens || 10000;
  });

  const savings = totalOldTokens - totalHybridTokens;
  const savingsPercentage = ((savings / totalOldTokens) * 100).toFixed(1);

  return {
    scenarioCount: scenarios.length,
    totalOldTokens,
    totalHybridTokens,
    totalSavings: savings,
    savingsPercentage: savingsPercentage + '%'
  };
}

export default {
  createNewScenarios,
  modifyScenarios,
  debugScenarios,
  styleChangeScenarios,
  explainScenarios,
  allHybridScenarios,
  getScenariosByPipeline,
  getAllScenarios,
  calculateEstimatedSavings
};
