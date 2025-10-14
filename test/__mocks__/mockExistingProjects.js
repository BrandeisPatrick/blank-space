/**
 * Mock Existing Projects
 * Complete baseline projects for testing modifications
 */

/**
 * Complete Todo App (Baseline for Modifications)
 */
export const completeTodoApp = {
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
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg rounded-lg p-6">
      <h1 className="text-3xl font-bold">My Todo List</h1>
      <p className="text-blue-100 mt-2">Stay organized and productive</p>
    </header>
  );
}

export default Header;`,

  "components/TodoList.jsx": `import React, { useState } from "react";
import TodoItem from "./TodoItem";
import { useTodos } from "../hooks/useTodos";

function TodoList() {
  const { todos, addTodo, removeTodo } = useTodos();
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input);
      setInput("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-colors"
        >
          Add
        </button>
      </form>
      <ul className="space-y-3">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onRemove={removeTodo} />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`,

  "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo, onRemove }) {
  return (
    <li className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="flex-1 text-gray-800">{todo.text}</span>
      <button
        onClick={() => onRemove(todo.id)}
        className="text-red-600 hover:text-red-700 font-medium"
      >
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
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text, completed: false }
    ]);
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return { todos, addTodo, removeTodo };
};`
};

/**
 * Simple Calculator App (Baseline for Modifications)
 */
export const simpleCalculatorApp = {
  "App.jsx": `import React from "react";
import Calculator from "./components/Calculator";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Calculator />
    </div>
  );
}

export default App;`,

  "components/Calculator.jsx": `import React from "react";
import Display from "./Display";
import Button from "./Button";
import { useCalculator } from "../hooks/useCalculator";

function Calculator() {
  const { display, handleNumber, handleOperator, calculate, clear } = useCalculator();

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <Display value={display} />
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Button value="7" onClick={handleNumber} />
        <Button value="8" onClick={handleNumber} />
        <Button value="9" onClick={handleNumber} />
        <Button value="/" onClick={handleOperator} className="bg-blue-500 text-white" />

        <Button value="4" onClick={handleNumber} />
        <Button value="5" onClick={handleNumber} />
        <Button value="6" onClick={handleNumber} />
        <Button value="*" onClick={handleOperator} className="bg-blue-500 text-white" />

        <Button value="1" onClick={handleNumber} />
        <Button value="2" onClick={handleNumber} />
        <Button value="3" onClick={handleNumber} />
        <Button value="-" onClick={handleOperator} className="bg-blue-500 text-white" />

        <Button value="0" onClick={handleNumber} />
        <Button value="." onClick={handleNumber} />
        <Button value="=" onClick={calculate} className="bg-green-500 text-white" />
        <Button value="+" onClick={handleOperator} className="bg-blue-500 text-white" />
      </div>
      <button
        onClick={clear}
        className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

export default Calculator;`,

  "components/Display.jsx": `import React from "react";

function Display({ value }) {
  return (
    <div className="bg-gray-900 text-white text-right text-3xl font-bold p-6 rounded-lg">
      {value || "0"}
    </div>
  );
}

export default Display;`,

  "components/Button.jsx": `import React from "react";

function Button({ value, onClick, className = "" }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={\`py-4 text-xl font-semibold rounded-lg transition-colors \${
        className || "bg-gray-200 hover:bg-gray-300 text-gray-800"
      }\`}
    >
      {value}
    </button>
  );
}

export default Button;`,

  "hooks/useCalculator.js": `import { useState } from "react";

export const useCalculator = () => {
  const [display, setDisplay] = useState("");
  const [operator, setOperator] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);

  const handleNumber = (num) => {
    setDisplay((prev) => prev + num);
  };

  const handleOperator = (op) => {
    if (display) {
      setPreviousValue(parseFloat(display));
      setOperator(op);
      setDisplay("");
    }
  };

  const calculate = () => {
    if (previousValue !== null && operator && display) {
      const current = parseFloat(display);
      let result;

      switch (operator) {
        case "+":
          result = previousValue + current;
          break;
        case "-":
          result = previousValue - current;
          break;
        case "*":
          result = previousValue * current;
          break;
        case "/":
          result = previousValue / current;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
    }
  };

  const clear = () => {
    setDisplay("");
    setOperator(null);
    setPreviousValue(null);
  };

  return { display, handleNumber, handleOperator, calculate, clear };
};`
};

/**
 * Simple Counter App (Minimal for Testing Basic Modifications)
 */
export const simpleCounterApp = {
  "App.jsx": `import React from "react";
import Counter from "./components/Counter";

function App() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <Counter />
    </div>
  );
}

export default App;`,

  "components/Counter.jsx": `import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Counter</h1>
      <div className="text-6xl font-bold text-blue-600 mb-8">{count}</div>
      <div className="flex gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Decrement
        </button>
        <button
          onClick={() => setCount(0)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default Counter;`
};

/**
 * Basic Todo App (No Delete Functionality - For Testing Add Feature)
 */
export const basicTodoAppNoDelete = {
  "App.jsx": `import React from "react";
import TodoList from "./components/TodoList";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TodoList />
    </div>
  );
}

export default App;`,

  "components/TodoList.jsx": `import React, { useState } from "react";
import TodoItem from "./TodoItem";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input }]);
      setInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">To Do List</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`,

  "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo }) {
  return (
    <li className="p-3 bg-gray-50 rounded">
      {todo.text}
    </li>
  );
}

export default TodoItem;`
};

/**
 * Todo App with Broken Delete (Logic Error)
 * Bug: Delete function uses wrong comparison operator
 */
export const todoAppBrokenDelete = {
  "App.jsx": `import React from "react";
import TodoList from "./components/TodoList";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TodoList />
    </div>
  );
}

export default App;`,

  "components/TodoList.jsx": `import React, { useState } from "react";
import TodoItem from "./TodoItem";
import { useTodos } from "../hooks/useTodos";

function TodoList() {
  const { todos, addTodo, removeTodo } = useTodos();
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input);
      setInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">To Do List</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onRemove={removeTodo} />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`,

  "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo, onRemove }) {
  return (
    <li className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
      <span>{todo.text}</span>
      <button
        onClick={() => onRemove(todo.id)}
        className="text-red-600 hover:text-red-700 font-medium"
      >
        Delete
      </button>
    </li>
  );
}

export default TodoItem;`,

  "hooks/useTodos.js": `import { useState } from "react";

export const useTodos = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: "Sample task 1" },
    { id: 2, text: "Sample task 2" }
  ]);

  const addTodo = (text) => {
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text }
    ]);
  };

  const removeTodo = (id) => {
    // BUG: This keeps items with matching ID instead of removing them
    setTodos((prev) => prev.filter((todo) => todo.id === id));
  };

  return { todos, addTodo, removeTodo };
};`
};

/**
 * Counter App with Broken Increment (Wrong Value)
 * Bug: Increment adds wrong amount
 */
export const counterAppBrokenIncrement = {
  "App.jsx": `import React from "react";
import Counter from "./components/Counter";

function App() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <Counter />
    </div>
  );
}

export default App;`,

  "components/Counter.jsx": `import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    // BUG: Should add 1, but adds 2
    setCount(count + 2);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Counter</h1>
      <div className="text-6xl font-bold text-blue-600 mb-8">{count}</div>
      <div className="flex gap-4">
        <button
          onClick={decrement}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Decrement
        </button>
        <button
          onClick={reset}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={increment}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default Counter;`
};

/**
 * Todo App with Missing onClick Handler
 * Bug: Delete button has no handler attached
 */
export const todoAppMissingHandler = {
  "App.jsx": `import React from "react";
import TodoList from "./components/TodoList";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TodoList />
    </div>
  );
}

export default App;`,

  "components/TodoList.jsx": `import React, { useState } from "react";
import TodoItem from "./TodoItem";

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Sample task 1" },
    { id: 2, text: "Sample task 2" }
  ]);
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input }]);
      setInput("");
    }
  };

  const removeTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">To Do List</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onRemove={removeTodo} />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`,

  "components/TodoItem.jsx": `import React from "react";

function TodoItem({ todo, onRemove }) {
  return (
    <li className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
      <span>{todo.text}</span>
      <button
        className="text-red-600 hover:text-red-700 font-medium"
      >
        Delete
      </button>
    </li>
  );
}

export default TodoItem;`
};

export const mockExistingProjects = {
  completeTodoApp,
  simpleCalculatorApp,
  simpleCounterApp,
  basicTodoAppNoDelete,
  todoAppBrokenDelete,
  counterAppBrokenIncrement,
  todoAppMissingHandler
};

export default mockExistingProjects;
