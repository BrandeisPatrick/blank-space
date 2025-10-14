/**
 * Modification Test Scenarios
 * Tests the agent's ability to modify existing files correctly
 */

export const addDarkModeScenario = {
  name: "Add Dark Mode Toggle",
  userRequest: "add a dark mode toggle button",

  expectedIntent: {
    intent: "add_feature",
    confidence: 0.85
  },

  currentFiles: {
    "App.jsx": `import React from "react";
import Header from "./components/Header";
import TodoList from "./components/TodoList";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TodoList />
      </main>
    </div>
  );
}

export default App;`,

    "components/Header.jsx": `import React from "react";

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg p-6">
      <h1 className="text-3xl font-bold">My Todo List</h1>
    </header>
  );
}

export default Header;`
  },

  expectedPlan: {
    filesToCreate: [],
    filesToModify: ["App.jsx", "components/Header.jsx"],
    reason: "Need to add dark mode state in App and toggle button in Header"
  },

  modificationRequirements: {
    "App.jsx": {
      mustAdd: ["useState", "dark mode state", "className toggle"],
      mustPreserve: ["Header", "TodoList", "existing structure"]
    },
    "components/Header.jsx": {
      mustAdd: ["toggle button", "onClick handler", "dark mode prop"],
      mustPreserve: ["title", "existing styling"]
    }
  }
};

export const addDeleteFunctionalityScenario = {
  name: "Add Delete Functionality to Todos",
  userRequest: "add a delete button to each todo item",

  expectedIntent: {
    intent: "add_feature",
    confidence: 0.9
  },

  currentFiles: {
    "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo }) {
  return (
    <li className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <span className="flex-1 text-gray-800">{todo.text}</span>
    </li>
  );
}

export default TodoItem;`,

    "hooks/useTodos.js": `import { useState } from "react";

export const useTodos = () => {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos((prev) => [...prev, { id: Date.now(), text }]);
  };

  return { todos, addTodo };
};`
  },

  expectedPlan: {
    filesToCreate: [],
    filesToModify: ["components/TodoItem.jsx", "hooks/useTodos.js"],
    reason: "Need removeTodo function in hook and delete button in TodoItem"
  },

  modificationRequirements: {
    "components/TodoItem.jsx": {
      mustAdd: ["delete button", "onClick handler", "removeTodo prop"],
      mustPreserve: ["todo display", "existing styling", "list item structure"]
    },
    "hooks/useTodos.js": {
      mustAdd: ["removeTodo function", "filter logic"],
      mustPreserve: ["addTodo", "existing state logic"]
    }
  }
};

export const addFilterScenario = {
  name: "Add Filter (All/Active/Completed)",
  userRequest: "add filter buttons to show all, active, or completed todos",

  expectedIntent: {
    intent: "add_feature",
    confidence: 0.85
  },

  currentFiles: {
    "components/TodoList.jsx": `import React, { useState } from "react";
import TodoItem from "./TodoItem";
import { useTodos } from "../hooks/useTodos";

function TodoList() {
  const { todos, addTodo } = useTodos();
  const [input, setInput] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form className="flex gap-3 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
          Add
        </button>
      </form>
      <ul className="space-y-3">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`
  },

  expectedPlan: {
    filesToCreate: [],
    filesToModify: ["components/TodoList.jsx"],
    reason: "Need filter state and filter buttons in TodoList"
  },

  modificationRequirements: {
    "components/TodoList.jsx": {
      mustAdd: ["filter state", "filter buttons", "filtering logic"],
      mustPreserve: ["add todo form", "todo list display", "existing imports"]
    }
  }
};

export const changeButtonColorScenario = {
  name: "Change Button Color",
  userRequest: "change all button colors from blue to green",

  expectedIntent: {
    intent: "style_change",
    confidence: 0.9
  },

  currentFiles: {
    "components/TodoList.jsx": `import React from "react";

function TodoList() {
  return (
    <div>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
        Add
      </button>
    </div>
  );
}

export default TodoList;`,

    "components/Header.jsx": `import React from "react";

function Header() {
  return (
    <header className="bg-blue-600 text-white p-6">
      <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
        Toggle
      </button>
    </header>
  );
}

export default Header;`
  },

  expectedPlan: {
    filesToCreate: [],
    filesToModify: ["components/TodoList.jsx", "components/Header.jsx"],
    reason: "Need to replace blue color classes with green"
  },

  modificationRequirements: {
    "components/TodoList.jsx": {
      mustChange: ["bg-blue-600 → bg-green-600", "hover:bg-blue-700 → hover:bg-green-700"],
      mustPreserve: ["button structure", "other styling", "functionality"]
    },
    "components/Header.jsx": {
      mustChange: ["bg-blue-500 → bg-green-500", "bg-blue-600 → bg-green-600"],
      mustPreserve: ["header structure", "other content"]
    }
  }
};

export const addEditFunctionalityScenario = {
  name: "Add Edit Functionality",
  userRequest: "add the ability to edit existing todo items",

  expectedIntent: {
    intent: "add_feature",
    confidence: 0.85
  },

  currentFiles: {
    "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo, onRemove }) {
  return (
    <li className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <span className="flex-1 text-gray-800">{todo.text}</span>
      <button onClick={() => onRemove(todo.id)} className="text-red-600">
        Delete
      </button>
    </li>
  );
}

export default TodoItem;`,

    "hooks/useTodos.js": `import { useState } from "react";

export const useTodos = () => {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos((prev) => [...prev, { id: Date.now(), text }]);
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return { todos, addTodo, removeTodo };
};`
  },

  expectedPlan: {
    filesToCreate: [],
    filesToModify: ["components/TodoItem.jsx", "hooks/useTodos.js"],
    reason: "Need edit mode in TodoItem and updateTodo function in hook"
  },

  modificationRequirements: {
    "components/TodoItem.jsx": {
      mustAdd: ["edit mode state", "input field", "save/cancel buttons", "edit button"],
      mustPreserve: ["delete functionality", "todo display when not editing"]
    },
    "hooks/useTodos.js": {
      mustAdd: ["updateTodo function", "map logic to update specific todo"],
      mustPreserve: ["addTodo", "removeTodo", "existing state"]
    }
  }
};

// Export all scenarios
export const modificationScenarios = [
  addDarkModeScenario,
  addDeleteFunctionalityScenario,
  addFilterScenario,
  changeButtonColorScenario,
  addEditFunctionalityScenario
];

export default modificationScenarios;
