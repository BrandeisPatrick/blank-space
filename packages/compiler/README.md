# Compiler

Code compilation and transformation utilities for UI Grid AI.

## Overview

The Compiler package provides code generation, transformation, and optimization utilities for converting grid layouts and AI-generated components into production-ready code.

## Features

- 🔄 JSX/TSX code generation
- ⚡ Bundle optimization
- 📦 Component transformation
- 🏗️ Type generation
- 🎯 Asset processing
- 🔧 Build pipeline integration

## Installation

```bash
npm install @ui-grid-ai/compiler
```

## Usage

```typescript
import { Compiler, CompilerOptions } from '@ui-grid-ai/compiler';

// Initialize compiler
const compiler = new Compiler({
  target: 'es2017',
  module: 'esm',
  jsx: 'react-jsx',
  outputDir: './dist'
});

// Compile grid layout to React components
const result = await compiler.compileLayout(gridLayout, {
  componentName: 'MyPage',
  typescript: true
});

console.log(result.code);
```

## API Reference

### Compiler

Main compiler class for code transformation.

#### Constructor Options

```typescript
interface CompilerOptions {
  target?: 'es5' | 'es2017' | 'es2020';     // Output JavaScript target
  module?: 'commonjs' | 'esm' | 'umd';      // Module system
  jsx?: 'react' | 'react-jsx' | 'preserve'; // JSX transformation
  typescript?: boolean;                      // Enable TypeScript output
  outputDir?: string;                        // Output directory
  sourceMap?: boolean;                       // Generate source maps
  minify?: boolean;                          // Minify output
}
```

#### Methods

- `compileLayout(layout, options)` - Compile grid layout to React
- `compileComponent(component, options)` - Compile single component
- `transformCode(code, options)` - Transform existing code
- `generateTypes(schema)` - Generate TypeScript types
- `optimizeBundle(bundle)` - Optimize code bundle
- `processAssets(assets)` - Process static assets

### Layout Compilation

Transform grid layouts into React components:

```typescript
import { GridItem } from '@ui-grid-ai/grid-engine';

const layout: GridItem[] = [
  { id: '1', x: 0, y: 0, w: 6, h: 2, component: 'Button' },
  { id: '2', x: 6, y: 0, w: 6, h: 2, component: 'Input' }
];

const result = await compiler.compileLayout(layout, {
  componentName: 'HomePage',
  typescript: true,
  responsive: true
});

// Generated React component:
/*
export interface HomePageProps {}

export const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="grid-container">
      <div className="grid-item" data-grid="0,0,6,2">
        <Button />
      </div>
      <div className="grid-item" data-grid="6,0,6,2">
        <Input />
      </div>
    </div>
  );
};
*/
```

### Component Compilation

Transform AI-generated component strings:

```typescript
const aiGeneratedCode = `
function MyButton({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
`;

const result = await compiler.compileComponent(aiGeneratedCode, {
  typescript: true,
  addTypes: true
});

// Output includes proper TypeScript types
```

### Code Transformation

Transform and optimize existing code:

```typescript
const code = `import React from 'react';`;

const transformed = await compiler.transformCode(code, {
  target: 'es2017',
  module: 'esm',
  removeUnusedImports: true
});
```

## Compilation Options

### Layout Compilation Options

```typescript
interface LayoutCompilationOptions {
  componentName: string;        // Generated component name
  typescript?: boolean;         // Generate TypeScript
  responsive?: boolean;         // Include responsive CSS
  cssFramework?: 'custom' | 'tailwind' | 'bootstrap'; // CSS framework
  exportDefault?: boolean;      // Export as default
  includeProps?: boolean;       // Generate prop interfaces
}
```

### Component Compilation Options

```typescript
interface ComponentCompilationOptions {
  typescript?: boolean;         // Convert to TypeScript
  addTypes?: boolean;          // Infer and add types
  formatCode?: boolean;        // Format output code
  addImports?: boolean;        // Auto-add missing imports
  removeComments?: boolean;    // Strip comments
}
```

## Code Generation

### JSX Generation

Generate clean, readable JSX:

```typescript
const jsx = compiler.generateJSX({
  type: 'div',
  props: { className: 'container' },
  children: [
    {
      type: 'h1',
      children: 'Hello World'
    }
  ]
});

// Output: <div className="container"><h1>Hello World</h1></div>
```

### CSS Generation

Generate CSS for grid layouts:

```typescript
const css = compiler.generateCSS(layout, {
  breakpoints: { md: 768, lg: 1024 },
  gridGap: '16px',
  containerMaxWidth: '1200px'
});
```

### TypeScript Types

Auto-generate TypeScript interfaces:

```typescript
const types = compiler.generateTypes({
  componentName: 'Button',
  props: {
    variant: ['primary', 'secondary'],
    size: ['small', 'medium', 'large'],
    onClick: 'function'
  }
});

// Generated:
// interface ButtonProps {
//   variant?: 'primary' | 'secondary';
//   size?: 'small' | 'medium' | 'large';  
//   onClick?: () => void;
// }
```

## Optimization

### Bundle Optimization

Optimize generated code bundles:

- **Tree shaking** - Remove unused code
- **Code splitting** - Split into smaller chunks
- **Minification** - Reduce file size
- **Dead code elimination** - Remove unreachable code

### Performance Optimizations

- **Lazy loading** - Generate dynamic imports
- **Memoization** - Add React.memo where beneficial
- **Bundle analysis** - Identify optimization opportunities

## Asset Processing

### Static Assets

Process images, fonts, and other assets:

```typescript
const assets = await compiler.processAssets([
  'images/logo.png',
  'fonts/custom.woff2'
], {
  optimize: true,
  generateWebP: true,
  outputDir: './dist/assets'
});
```

### CSS Processing

- **PostCSS integration** - Transform modern CSS
- **Autoprefixer** - Add vendor prefixes
- **CSS optimization** - Minimize and optimize
- **CSS modules** - Generate scoped styles

## Error Handling

Comprehensive error handling with:

- **Syntax error detection** - Catch invalid code
- **Type checking** - Validate TypeScript
- **Dependency resolution** - Check imports
- **Build warnings** - Non-fatal issues

## Source Maps

Generate source maps for debugging:

```typescript
const result = await compiler.compileLayout(layout, {
  sourceMap: true,
  sourceMapIncludeSources: true
});

// Includes .map file for debugging
```

## Integration

Compiler integrates with:

- **Grid Engine** - Layout compilation
- **Studio App** - Real-time compilation
- **Server** - Build API endpoints
- **Preview Sandbox** - Component rendering

## CLI Usage

Command-line interface for batch operations:

```bash
# Compile layouts
npx @ui-grid-ai/compiler compile-layouts ./src/layouts

# Generate types
npx @ui-grid-ai/compiler generate-types ./src/components

# Optimize bundle
npx @ui-grid-ai/compiler optimize ./dist/bundle.js
```

## Development

```bash
# Build package
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck
```

## Configuration

Configure compiler behavior through config files:

```json
{
  "target": "es2017",
  "module": "esm", 
  "jsx": "react-jsx",
  "typescript": true,
  "sourceMap": true,
  "optimization": {
    "minify": true,
    "treeshake": true
  }
}
```