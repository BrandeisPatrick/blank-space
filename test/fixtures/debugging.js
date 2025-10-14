/**
 * Debugging Test Scenarios
 * Tests the debugger agent's ability to identify and fix bugs
 */

export const brokenDeleteScenario = {
  name: "Broken Delete Function (Logic Error)",
  userRequest: "the delete button doesn't work",
  bugType: "logic_error",

  expectedIntent: {
    intent: "fix_bug",
    confidence: 0.9
  },

  expectedDiagnosis: {
    bugFound: true,
    bugType: "logic_error",
    affectedFiles: ["hooks/useTodos.js"],
    severity: "high"
  },

  bugDescription: "The removeTodo function uses === instead of !== in the filter, keeping items with matching ID instead of removing them",

  expectedFix: {
    file: "hooks/useTodos.js",
    shouldContain: ["todo.id !== id"],
    shouldNotContain: ["todo.id === id"]
  },

  validationChecks: {
    preservesExisting: ["addTodo", "useState", "setTodos"],
    fixesIssue: true,
    maintainsCodeQuality: true
  }
};

export const missingHandlerScenario = {
  name: "Missing onClick Handler",
  userRequest: "delete button does nothing when clicked",
  bugType: "missing_handler",

  expectedIntent: {
    intent: "fix_bug",
    confidence: 0.85
  },

  expectedDiagnosis: {
    bugFound: true,
    bugType: "missing_handler",
    affectedFiles: ["components/TodoItem.jsx"],
    severity: "high"
  },

  bugDescription: "The delete button is missing onClick handler",

  expectedFix: {
    file: "components/TodoItem.jsx",
    shouldContain: ["onClick={() => onRemove(todo.id)}", "onClick={()"],
    shouldNotContain: []
  },

  validationChecks: {
    preservesExisting: ["todo.text", "Delete", "button"],
    fixesIssue: true,
    maintainsCodeQuality: true
  }
};

export const brokenIncrementScenario = {
  name: "Broken Increment Function (Wrong Value)",
  userRequest: "increment button adds 2 instead of 1",
  bugType: "logic_error",

  expectedIntent: {
    intent: "fix_bug",
    confidence: 0.9
  },

  expectedDiagnosis: {
    bugFound: true,
    bugType: "logic_error",
    affectedFiles: ["components/Counter.jsx"],
    severity: "medium"
  },

  bugDescription: "The increment function adds 2 instead of 1",

  expectedFix: {
    file: "components/Counter.jsx",
    shouldContain: ["count + 1"],
    shouldNotContain: ["count + 2"]
  },

  validationChecks: {
    preservesExisting: ["decrement", "reset", "useState"],
    fixesIssue: true,
    maintainsCodeQuality: true
  }
};

export const stateUpdateIssueScenario = {
  name: "State Update Issue",
  userRequest: "state is not updating correctly",
  bugType: "state_issue",

  expectedIntent: {
    intent: "fix_bug",
    confidence: 0.8
  },

  expectedDiagnosis: {
    bugFound: true,
    bugType: "state_issue",
    severity: "medium"
  },

  bugDescription: "Generic state update issue that needs investigation",

  validationChecks: {
    preservesExisting: ["useState", "existing functionality"],
    fixesIssue: true,
    maintainsCodeQuality: true
  }
};

// Export all scenarios
export const debuggingScenarios = [
  brokenDeleteScenario,
  missingHandlerScenario,
  brokenIncrementScenario,
  stateUpdateIssueScenario
];

export default debuggingScenarios;
