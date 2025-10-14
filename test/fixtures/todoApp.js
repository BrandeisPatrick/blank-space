/**
 * Todo App Test Scenario
 * Expected file structure and requirements
 */

export const todoAppScenario = {
  name: "Todo List Application",
  userRequest: "build a todo list",

  expectedIntent: {
    intent: "create_new",
    confidence: 0.9
  },

  expectedPlan: {
    filesToCreate: [
      "App.jsx",
      "components/Header.jsx",
      "components/TodoList.jsx",
      "components/TodoItem.jsx",
      "hooks/useTodos.js"
    ],
    filesToModify: [],
    npmPackages: []
  },

  requiredFeatures: [
    "Add new todos",
    "Remove todos",
    "Display todo list",
    "Input field for new todos",
    "Submit button"
  ],

  codeQualityChecks: {
    "App.jsx": {
      mustImport: ["Header", "TodoList"],
      mustNotImport: ["useState", "useEffect"], // State should be in components/hooks
      folderImports: ["./components/Header", "./components/TodoList"]
    },
    "components/Header.jsx": {
      mustExport: "default",
      mustHaveTailwind: true,
      requiredClasses: ["bg-", "text-", "p-", "font-"]
    },
    "components/TodoList.jsx": {
      mustImport: ["useState", "useTodos", "TodoItem"],
      mustHaveTailwind: true,
      requiredElements: ["<form", "<input", "<button"]
    },
    "components/TodoItem.jsx": {
      mustHaveProps: ["todo", "onRemove"],
      mustHaveTailwind: true,
      requiredElements: ["<button"]
    },
    "hooks/useTodos.js": {
      mustExport: "useTodos",
      mustHaveFunctions: ["addTodo", "removeTodo"],
      mustImport: ["useState"]
    }
  },

  stylingRequirements: {
    modernUI: true,
    tailwindClasses: true,
    shadowsAndRounded: true,
    hoverStates: true,
    gradients: true
  }
};

export default todoAppScenario;
