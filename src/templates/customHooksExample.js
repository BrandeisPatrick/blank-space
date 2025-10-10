// Custom hooks example demonstrating hook composition
export const customHooksFiles = {
  "/App.js": {
    code: `import { useState } from 'react';
import ThemeToggle from './components/ThemeToggle';
import LocalStorageDemo from './components/LocalStorageDemo';
import DebounceSearch from './components/DebounceSearch';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <h1>Custom Hooks Demo</h1>

      <section className="demo-section">
        <h2>useToggle Hook</h2>
        <ThemeToggle />
      </section>

      <section className="demo-section">
        <h2>useLocalStorage Hook</h2>
        <LocalStorageDemo />
      </section>

      <section className="demo-section">
        <h2>useDebounce Hook</h2>
        <DebounceSearch />
      </section>
    </div>
  );
}`,
  },
  "/hooks/useToggle.js": {
    code: `import { useState, useCallback } from 'react';

export default function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}`,
  },
  "/hooks/useLocalStorage.js": {
    code: `import { useState, useEffect } from 'react';

export default function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}`,
  },
  "/hooks/useDebounce.js": {
    code: `import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
  },
  "/components/ThemeToggle.js": {
    code: `import useToggle from '../hooks/useToggle';

export default function ThemeToggle() {
  const [isDark, toggle] = useToggle(false);

  return (
    <div className={isDark ? 'theme-card dark' : 'theme-card light'}>
      <div className="theme-content">
        <h3>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</h3>
        <p>Click the button to toggle theme</p>
        <button onClick={toggle} className="toggle-btn">
          Toggle Theme
        </button>
      </div>
    </div>
  );
}`,
  },
  "/components/LocalStorageDemo.js": {
    code: `import useLocalStorage from '../hooks/useLocalStorage';

export default function LocalStorageDemo() {
  const [name, setName] = useLocalStorage('userName', '');
  const [count, setCount] = useLocalStorage('clickCount', 0);

  return (
    <div className="storage-demo">
      <div className="input-group">
        <label>Your Name (saved to localStorage):</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
        />
        {name && <p className="greeting">Hello, {name}! 👋</p>}
      </div>

      <div className="counter-group">
        <p>You've clicked the button: <strong>{count}</strong> times</p>
        <button onClick={() => setCount(count + 1)}>
          Click Me
        </button>
        <button onClick={() => setCount(0)} className="reset-btn">
          Reset
        </button>
      </div>

      <p className="info">
        💡 Your data persists across page reloads!
      </p>
    </div>
  );
}`,
  },
  "/components/DebounceSearch.js": {
    code: `import { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';

const mockItems = [
  'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry',
  'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
  'Mango', 'Nectarine', 'Orange', 'Papaya', 'Quince'
];

export default function DebounceSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Simulate API call when debounced value changes
  useEffect(() => {
    if (debouncedSearch) {
      setSearchCount(count => count + 1);
    }
  }, [debouncedSearch]);

  const filteredItems = mockItems.filter(item =>
    item.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="search-demo">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search fruits..."
        className="search-input"
      />

      <p className="search-info">
        API Calls made: <strong>{searchCount}</strong>
        <span className="hint">(without debounce it would be {searchTerm.length})</span>
      </p>

      <div className="results">
        {debouncedSearch && (
          <>
            <p className="results-count">
              Found {filteredItems.length} results for "{debouncedSearch}"
            </p>
            <ul className="results-list">
              {filteredItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}`,
  },
  "/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f7fa;
  padding: 20px;
}

.app {
  max-width: 900px;
  margin: 0 auto;
}

.app h1 {
  color: #1f2937;
  margin-bottom: 30px;
  text-align: center;
}

.demo-section {
  background: white;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.demo-section h2 {
  color: #374151;
  margin-bottom: 16px;
  font-size: 1.25rem;
}

/* Theme Toggle */
.theme-card {
  padding: 40px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.theme-card.light {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
}

.theme-card.dark {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  color: #f3f4f6;
}

.theme-content {
  text-align: center;
}

.theme-content h3 {
  font-size: 2rem;
  margin-bottom: 12px;
}

.toggle-btn {
  margin-top: 20px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  transform: scale(1.05);
}

/* Local Storage Demo */
.storage-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group, .counter-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group label {
  font-weight: 600;
  color: #374151;
}

.input-group input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.greeting {
  color: #10b981;
  font-size: 1.25rem;
  font-weight: 600;
}

.counter-group {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.counter-group p {
  color: #374151;
  margin-bottom: 12px;
}

.counter-group button {
  padding: 10px 24px;
  margin-right: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.counter-group button:hover {
  background: #2563eb;
}

.reset-btn {
  background: #6b7280 !important;
}

.reset-btn:hover {
  background: #4b5563 !important;
}

.info {
  color: #6b7280;
  font-size: 14px;
  font-style: italic;
}

/* Debounce Search */
.search-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-info {
  color: #374151;
  font-size: 14px;
}

.search-info strong {
  color: #3b82f6;
  font-size: 18px;
}

.hint {
  color: #6b7280;
  font-size: 12px;
  margin-left: 8px;
}

.results-count {
  color: #374151;
  font-weight: 600;
  margin-bottom: 12px;
}

.results-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.results-list li {
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 6px;
  color: #374151;
  text-align: center;
}`,
  },
};
