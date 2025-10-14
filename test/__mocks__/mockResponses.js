/**
 * Mock AI Responses for Testing
 * Includes both good and bad responses to test validation and cleanup
 */

/**
 * GOOD RESPONSE: Clean, well-formatted single file
 */
export const goodResponse_AppJsx = `import React from "react";
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

export default App;`;

/**
 * BAD RESPONSE: Wrapped in markdown code fences
 */
export const badResponse_WithMarkdown = `\`\`\`jsx
import React from "react";

function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <h1>My App</h1>
    </header>
  );
}

export default Header;
\`\`\``;

/**
 * BAD RESPONSE: Multi-file concatenation
 */
export const badResponse_MultiFile = `import React from "react";

function App() {
  return <div>App</div>;
}

export default App;

// components/Header.jsx
import React from "react";

function Header() {
  return <header>Header</header>;
}

export default Header;

// components/Footer.jsx
import React from "react";

function Footer() {
  return <footer>Footer</footer>;
}

export default Footer;`;

/**
 * BAD RESPONSE: Single quotes instead of double quotes
 */
export const badResponse_SingleQuotes = `import React from 'react';
import Header from './components/Header';

function App() {
  return (
    <div className='container'>
      <Header />
    </div>
  );
}

export default App;`;

/**
 * BAD RESPONSE: Duplicate imports
 */
export const badResponse_DuplicateImports = `import React from "react";
import { useState } from "react";
import React from "react";

function TodoList() {
  const [todos, setTodos] = useState([]);
  return <div>Todos</div>;
}

export default TodoList;`;

/**
 * BAD RESPONSE: No Tailwind classes (basic unstyled code)
 */
export const badResponse_NoStyling = `import React from "react";

function Button() {
  return (
    <button>
      Click me
    </button>
  );
}

export default Button;`;

/**
 * BAD RESPONSE: Has explanatory text before code
 */
export const badResponse_WithExplanation = `Here's the code for the Header component:

import React from "react";

function Header() {
  return <header>Header</header>;
}

export default Header;

This component displays a simple header.`;

/**
 * BAD RESPONSE: Wrong import paths (flat structure)
 */
export const badResponse_WrongImports = `import React from "react";
import Header from "./Header";
import TodoList from "./TodoList";

function App() {
  return (
    <div>
      <Header />
      <TodoList />
    </div>
  );
}

export default App;`;

/**
 * GOOD RESPONSE: Component with modern Tailwind styling
 */
export const goodResponse_ComponentWithStyling = `import React from "react";

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg rounded-lg p-6">
      <h1 className="text-3xl font-bold">My Todo List</h1>
      <p className="text-blue-100 mt-2">Stay organized and productive</p>
    </header>
  );
}

export default Header;`;

/**
 * GOOD RESPONSE: Hook with proper structure
 */
export const goodResponse_CustomHook = `import { useState } from "react";

export const useTodos = () => {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text, completed: false }
    ]);
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return { todos, addTodo, removeTodo, toggleTodo };
};`;

/**
 * Test files object (good structure)
 */
export const goodFilesStructure = {
  "App.jsx": goodResponse_AppJsx,
  "components/Header.jsx": goodResponse_ComponentWithStyling,
  "components/TodoList.jsx": `import React, { useState } from "react";
import { useTodos } from "../hooks/useTodos";

function TodoList() {
  const { todos, addTodo } = useTodos();
  const [input, setInput] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2"
      />
    </div>
  );
}

export default TodoList;`,
  "hooks/useTodos.js": goodResponse_CustomHook
};

/**
 * Test files object (bad structure - flat)
 */
export const badFilesStructure = {
  "App.jsx": goodResponse_AppJsx,
  "Header.jsx": goodResponse_ComponentWithStyling,  // Should be components/Header.jsx
  "TodoList.jsx": `import React from "react";

function TodoList() {
  return <div>Todos</div>;
}

export default TodoList;`,
  "useTodos.js": goodResponse_CustomHook  // Should be hooks/useTodos.js
};
