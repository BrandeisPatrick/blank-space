export const DEMO_APP_JS = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [color, setColor] = useState('#667eea');

  return (
    <div className="app">
      <h1 style={{ color }}>🎨 Live React Editor</h1>
      <p>Edit code and see instant updates!</p>

      <div className="counter">
        <button onClick={() => setCount(count - 1)}>−</button>
        <span className="count">{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>

      <div className="color-section">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
        />
        <div className="color-display" style={{ backgroundColor: color }}>
          {color}
        </div>
      </div>
    </div>
  );
}`

export const DEMO_STYLES_CSS = `body {
  font-family: sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.app {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.counter {
  margin: 30px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.counter button {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 10px;
  background: #667eea;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
}

.color-picker {
  width: 100px;
  height: 100px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.color-display {
  margin-top: 20px;
  padding: 20px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
}`

export function createDefaultArtifact() {
  const timestamp = Date.now()
  const artifactId = `artifact-${timestamp}`

  return {
    id: artifactId,
    title: 'React Demo',
    files: {
      '/App.js': DEMO_APP_JS,
      '/styles.css': DEMO_STYLES_CSS
    },
    actions: [],
    modifiedFiles: {},
    shellHistory: [],
    serverProcess: null,
    projectId: 'default-project',
    regionId: 'local',
    entry: '/App.js',
    metadata: {
      device: 'web',
      framework: 'react',
      projectType: 'react',
      isReact: true,
      dependencies: []
    },
    createdAt: new Date(timestamp).toISOString(),
    updatedAt: new Date(timestamp).toISOString()
  }
}
