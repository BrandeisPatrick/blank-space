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

// ========================================
// REAL-WORLD SCENARIO TESTS
// ========================================

export const todoListMutationScenario = {
  name: "Real: TodoList direct mutation bug",

  files: {
    "App.jsx": `import { useState } from 'react';
import TodoList from './components/TodoList';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    todos.push({ id: Date.now(), text: input });  // BUG: direct mutation
    setInput('');
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <TodoList todos={todos} />
    </div>
  );
}`,
    "components/TodoList.jsx": `export default function TodoList({ todos }) {
  return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}`
  },

  errorMessage: "Syntax error in App.jsx: Direct array mutation detected (line 8)\nSource: App.jsx:8\nfix this bug",

  expectedDiagnosis: {
    bugType: "state-mutation",
    pattern: "Direct array mutation (e.g., arr.push())"
  },

  expectedFix: {
    file: "App.jsx",
    shouldContain: ["setTodos([...todos,", "{ id:", "text: input }"],
    shouldNotContain: ["todos.push("],
    preserves: ["useState", "TodoList", "input", "setInput", "onChange"]
  }
};

export const counterOnClickBugScenario = {
  name: "Real: onClick calling function immediately",

  files: {
    "App.jsx": `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment()}>Increment</button>
    </div>
  );
}`
  },

  errorMessage: "Runtime error in App.jsx: Too many re-renders (line 13)\nSource: App.jsx:13\nfix this bug",

  expectedDiagnosis: {
    bugType: "event-handler",
    pattern: "Function called immediately: onClick={fn()}"
  },

  expectedFix: {
    file: "App.jsx",
    shouldContain: ["onClick={increment}"],
    shouldNotContain: ["onClick={increment()}"],
    preserves: ["useState", "count", "setCount", "increment"]
  }
};

export const formPreventDefaultScenario = {
  name: "Real: Form refresh without preventDefault",

  files: {
    "App.jsx": `import { useState } from 'react';

export default function App() {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    console.log('Logged in:', username);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}`
  },

  errorMessage: "Form submitting causes page refresh in App.jsx:6\nSource: App.jsx:6\nfix this bug",

  expectedDiagnosis: {
    bugType: "form-handling",
    pattern: "Form without preventDefault"
  },

  expectedFix: {
    file: "App.jsx",
    shouldContain: ["e.preventDefault()"],
    preserves: ["handleSubmit", "onSubmit", "username", "setUsername"]
  }
};

export const useEffectDepsScenario = {
  name: "Real: useEffect with stale closure",

  files: {
    "App.jsx": `import { useState, useEffect } from 'react';

export default function App() {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(\`/api/data?filter=\${filter}\`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return <div>{data.map(d => <div key={d.id}>{d.name}</div>)}</div>;
}`
  },

  errorMessage: "Warning in App.jsx: useEffect has missing dependency 'filter' (line 7)\nSource: App.jsx:7\nfix this bug",

  expectedDiagnosis: {
    bugType: "missing-dependencies",
    pattern: "Empty dependency array might be incorrect"
  },

  expectedFix: {
    file: "App.jsx",
    shouldContain: ["}, [filter])"],
    shouldNotContain: ["}, [])"],
    preserves: ["useEffect", "fetch", "setData", "filter"]
  }
};

export const asyncUnmountScenario = {
  name: "Real: Async state update on unmounted component",

  files: {
    "components/UserProfile.jsx": `import { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => setUser(data));
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}`
  },

  errorMessage: "Warning in components/UserProfile.jsx: Can't perform state update on unmounted component (line 8)\nSource: components/UserProfile.jsx:8\nfix this bug",

  expectedDiagnosis: {
    bugType: "async-state",
    pattern: "Async function with state updates"
  },

  expectedFix: {
    file: "components/UserProfile.jsx",
    shouldContain: ["let mounted = true", "mounted &&", "return () =>"],
    preserves: ["useEffect", "fetch", "setUser", "userId"]
  }
};

// Export all scenarios
export const debuggingScenarios = [
  brokenDeleteScenario,
  missingHandlerScenario,
  brokenIncrementScenario,
  stateUpdateIssueScenario
];

export const realWorldScenarios = [
  todoListMutationScenario,
  counterOnClickBugScenario,
  formPreventDefaultScenario,
  useEffectDepsScenario,
  asyncUnmountScenario
];

export default debuggingScenarios;
