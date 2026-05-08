export const SANDPACK_DEMO_FILES = {
  '/App.js': `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
      <h1>Hello from Sandpack</h1>
      <p>Count: {count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #888',
          background: '#007AFF',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Increment
      </button>
    </div>
  );
}`,
};

export const MONACO_DEMO_VALUE = `// Sample TypeScript file — Monaco running inside WKWebView via DOM Component.
function greet(name: string): string {
  return \`Hello, \${name}\`;
}

console.log(greet('blank space'));
`;
