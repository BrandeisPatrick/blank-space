# Preview Sandbox

Isolated component preview and rendering system for UI Grid AI.

## Overview

Preview Sandbox provides a secure, isolated environment for rendering and previewing AI-generated components with hot reload support, error boundary handling, and performance monitoring.

## Features

- 🔒 Secure code execution in isolated environment
- 🔥 Hot reload for real-time updates
- 🛡️ Error boundary handling and recovery
- 📊 Performance monitoring and profiling
- 🎨 Multi-framework support (React, Vue, etc.)
- 🔍 Developer tools integration

## Installation

```bash
npm install @ui-grid-ai/preview-sandbox
```

## Usage

```typescript
import { PreviewSandbox, SandboxOptions } from '@ui-grid-ai/preview-sandbox';

// Initialize sandbox
const sandbox = new PreviewSandbox({
  framework: 'react',
  container: document.getElementById('preview'),
  hot: true
});

// Render component
await sandbox.render(`
  export default function Button({ children }) {
    return <button className="btn">{children}</button>;
  }
`, {
  props: { children: 'Click me' }
});
```

## API Reference

### PreviewSandbox

Main sandbox class for component rendering.

#### Constructor Options

```typescript
interface SandboxOptions {
  framework: 'react' | 'vue' | 'vanilla';  // Target framework
  container: HTMLElement;                   // Container element
  hot?: boolean;                           // Enable hot reload
  timeout?: number;                        // Execution timeout (ms)
  memoryLimit?: number;                    // Memory limit (MB)
  allowedAPIs?: string[];                  // Allowed browser APIs
  styling?: 'inline' | 'external';        // CSS handling
}
```

#### Methods

- `render(code, options)` - Render component in sandbox
- `update(code)` - Update component code (hot reload)
- `destroy()` - Clean up sandbox resources
- `getPerformanceMetrics()` - Get performance data
- `captureError(callback)` - Set error handler
- `enableDebugMode()` - Enable debugging features

### Rendering Options

```typescript
interface RenderOptions {
  props?: Record<string, any>;      // Component props
  wrapper?: string;                 // Wrapper component
  styles?: string;                  // Additional CSS
  dependencies?: string[];          // Required dependencies
  context?: Record<string, any>;    // React context providers
}
```

## Security Features

### Code Sandboxing

Safe execution of user-generated code:

- **Isolated execution context** - Code runs in separate context
- **API restrictions** - Limited access to browser APIs
- **Memory limits** - Prevent memory leaks and overconsumption
- **Timeout protection** - Prevent infinite loops
- **DOM isolation** - Scoped DOM access

### CSP Integration

Content Security Policy integration:

```typescript
const sandbox = new PreviewSandbox({
  csp: {
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
});
```

## Error Handling

### Error Boundaries

Automatic error boundary wrapping:

```typescript
// Automatic error boundary for React components
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <div className="error">Component failed to render</div>;
  }
  
  return children;
};
```

### Error Recovery

Graceful error handling and recovery:

```typescript
sandbox.captureError((error, errorInfo) => {
  console.error('Sandbox error:', error);
  
  // Attempt recovery
  if (error.type === 'SyntaxError') {
    // Show syntax highlighting for errors
    highlightSyntaxError(error.line, error.column);
  }
  
  // Log for debugging
  logError(error, errorInfo);
});
```

### Error Types

Different error types with specific handling:

- **Syntax errors** - Code parsing failures
- **Runtime errors** - Execution failures
- **Type errors** - TypeScript type mismatches
- **Timeout errors** - Execution timeouts
- **Memory errors** - Out of memory conditions

## Hot Reload System

### File Watching

Monitor code changes for hot reload:

```typescript
const sandbox = new PreviewSandbox({ hot: true });

// Automatically reloads when code changes
sandbox.render(componentCode);

// Manual update
sandbox.update(newComponentCode);
```

### State Preservation

Preserve component state during hot reloads:

```typescript
const sandbox = new PreviewSandbox({
  hot: true,
  preserveState: true
});

// Component state is maintained across updates
```

### Fast Refresh Integration

React Fast Refresh support:

```typescript
// Enable React Fast Refresh
const sandbox = new PreviewSandbox({
  framework: 'react',
  hot: true,
  fastRefresh: true
});
```

## Performance Monitoring

### Metrics Collection

Comprehensive performance monitoring:

```typescript
const metrics = sandbox.getPerformanceMetrics();

console.log({
  renderTime: metrics.renderTime,        // Time to render (ms)
  memoryUsage: metrics.memoryUsage,      // Memory consumption (MB)
  domNodes: metrics.domNodes,            // DOM node count
  bundleSize: metrics.bundleSize,        // Code bundle size (KB)
  errorCount: metrics.errorCount         // Number of errors
});
```

### Performance Profiling

Built-in React profiler integration:

```typescript
const sandbox = new PreviewSandbox({
  profiling: true
});

const profile = await sandbox.profileRender(componentCode);

console.log({
  phases: profile.phases,                // Render phases
  interactions: profile.interactions,    // User interactions
  commitTime: profile.commitTime         // Commit phase timing
});
```

### Memory Management

Automatic memory management:

- **Garbage collection** - Automatic cleanup
- **Memory leak detection** - Monitor for leaks
- **Resource cleanup** - Clean up event listeners
- **DOM cleanup** - Remove unused DOM nodes

## Multi-Framework Support

### React Support

Full React ecosystem support:

```typescript
const reactSandbox = new PreviewSandbox({
  framework: 'react',
  version: '18.2.0'
});

await reactSandbox.render(`
  import React, { useState } from 'react';
  
  export default function Counter() {
    const [count, setCount] = useState(0);
    return (
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    );
  }
`);
```

### Vue Support

Vue.js component rendering:

```typescript
const vueSandbox = new PreviewSandbox({
  framework: 'vue',
  version: '3.3.0'
});

await vueSandbox.render(`
  <template>
    <button @click="increment">Count: {{ count }}</button>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  const count = ref(0);
  const increment = () => count.value++;
  </script>
`);
```

### Vanilla JavaScript

Plain JavaScript component support:

```typescript
const vanillaSandbox = new PreviewSandbox({
  framework: 'vanilla'
});

await vanillaSandbox.render(`
  function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = () => alert('Clicked!');
    return button;
  }
  
  export default createButton;
`);
```

## Styling Support

### CSS Integration

Multiple CSS handling approaches:

```typescript
// Inline styles
await sandbox.render(componentCode, {
  styles: `
    .btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
    }
  `
});

// External stylesheet
await sandbox.render(componentCode, {
  stylesheets: ['./styles/components.css']
});
```

### CSS-in-JS Support

Support for styled-components and emotion:

```typescript
await sandbox.render(`
  import styled from 'styled-components';
  
  const Button = styled.button\`
    background: \${props => props.primary ? '#007bff' : '#6c757d'};
    color: white;
    border: none;
    padding: 8px 16px;
  \`;
  
  export default Button;
`);
```

### Tailwind CSS

Built-in Tailwind CSS support:

```typescript
const sandbox = new PreviewSandbox({
  styling: 'tailwind'
});

await sandbox.render(`
  export default function Card() {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-2">Card Title</h2>
        <p className="text-gray-600">Card content</p>
      </div>
    );
  }
`);
```

## Developer Tools

### Debug Mode

Enhanced debugging capabilities:

```typescript
sandbox.enableDebugMode();

// Provides:
// - Component tree visualization
// - Props inspector
// - State debugging
// - Performance profiler
// - Error stack traces
```

### Console Integration

Capture console output from sandbox:

```typescript
sandbox.onConsole((level, message) => {
  console[level](`[Sandbox] ${message}`);
});
```

### Breakpoint Support

Debug components with breakpoints:

```typescript
// Enable debugging with source maps
const sandbox = new PreviewSandbox({
  sourceMaps: true,
  debugging: true
});
```

## Integration

Preview Sandbox integrates with:

- **Studio App** - Real-time component preview
- **Compiler** - Code compilation pipeline
- **Grid Engine** - Layout preview
- **Server API** - Remote component rendering

## Development

```bash
# Build package
npm run build

# Run tests
npm run test

# Start development server
npm run dev
```

## Configuration

Configure sandbox behavior:

```json
{
  "security": {
    "timeout": 5000,
    "memoryLimit": 100,
    "allowedAPIs": ["fetch", "localStorage"]
  },
  "performance": {
    "monitoring": true,
    "profiling": false,
    "memoryTracking": true
  },
  "debugging": {
    "sourceMaps": true,
    "errorBoundaries": true,
    "consoleCapture": true
  }
}
```