# Grid Engine

Core grid layout and interaction system for UI Grid AI.

## Overview

Grid Engine provides the fundamental grid-based layout system that powers the visual UI builder. It handles drag-and-drop interactions, responsive breakpoints, and component positioning within a flexible grid system.

## Features

- 🎯 Precise grid-based positioning
- 🖱️ Drag-and-drop interface
- 📱 Responsive breakpoint handling
- 📐 Automatic layout calculations
- 🔄 Real-time grid updates
- ⚡ Optimized for performance

## Installation

```bash
npm install @ui-grid-ai/grid-engine
```

## Usage

```typescript
import { GridEngine, GridItem } from '@ui-grid-ai/grid-engine';

// Initialize grid engine
const gridEngine = new GridEngine({
  columns: 12,
  rowHeight: 100,
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480
  }
});

// Add grid item
const item = gridEngine.addItem({
  x: 0,
  y: 0,
  w: 4,
  h: 2,
  component: 'Button'
});
```

## API Reference

### GridEngine

Main grid engine class that manages the grid system.

#### Constructor Options

```typescript
interface GridEngineOptions {
  columns?: number;           // Number of grid columns (default: 12)
  rowHeight?: number;         // Height of each grid row in pixels (default: 100)
  margin?: [number, number];  // Grid margins [x, y] (default: [10, 10])
  breakpoints?: Breakpoints;  // Responsive breakpoints
  compactType?: 'vertical' | 'horizontal' | null; // Compaction direction
}
```

#### Methods

- `addItem(item: GridItem)` - Add item to grid
- `removeItem(id: string)` - Remove item from grid
- `updateItem(id: string, updates: Partial<GridItem>)` - Update grid item
- `moveItem(id: string, x: number, y: number)` - Move item to position
- `resizeItem(id: string, w: number, h: number)` - Resize grid item
- `getLayout()` - Get current grid layout
- `setLayout(layout: GridItem[])` - Set grid layout
- `compact()` - Compact grid items

### GridItem

Individual grid item interface.

```typescript
interface GridItem {
  id: string;          // Unique item identifier
  x: number;           // Grid column position
  y: number;           // Grid row position
  w: number;           // Width in grid columns
  h: number;           // Height in grid rows
  component?: string;   // Component type
  props?: any;         // Component properties
  static?: boolean;    // Prevent dragging/resizing
  isDraggable?: boolean; // Allow dragging
  isResizable?: boolean; // Allow resizing
}
```

### Breakpoints

Responsive breakpoint configuration.

```typescript
interface Breakpoints {
  lg?: number;  // Large screens
  md?: number;  // Medium screens  
  sm?: number;  // Small screens
  xs?: number;  // Extra small screens
}
```

## Grid System

### Coordinates

The grid uses a coordinate system where:
- X-axis represents columns (0 to columns-1)
- Y-axis represents rows (0 to infinity)
- Width and height are measured in grid units

### Layout Algorithm

The grid engine uses an optimized layout algorithm that:
1. Prevents item overlapping
2. Maintains item constraints
3. Compacts items when possible
4. Handles responsive breakpoint changes

### Collision Detection

Efficient collision detection ensures:
- Items cannot overlap
- Dragged items push other items
- Layout remains valid during interactions

## Responsive Design

Grid Engine supports responsive design through:

### Breakpoint System
Different layouts for different screen sizes:

```typescript
const layouts = {
  lg: [{ id: '1', x: 0, y: 0, w: 6, h: 2 }],
  md: [{ id: '1', x: 0, y: 0, w: 8, h: 2 }],
  sm: [{ id: '1', x: 0, y: 0, w: 12, h: 2 }]
};
```

### Auto-responsive
Items automatically adjust when breakpoints change while maintaining proportions.

## Events

Grid Engine emits events for layout changes:

```typescript
gridEngine.on('layoutChange', (layout) => {
  console.log('Layout changed:', layout);
});

gridEngine.on('dragStart', (item) => {
  console.log('Drag started:', item);
});

gridEngine.on('dragEnd', (item) => {
  console.log('Drag ended:', item);
});

gridEngine.on('resizeStart', (item) => {
  console.log('Resize started:', item);
});

gridEngine.on('resizeEnd', (item) => {
  console.log('Resize ended:', item);
});
```

## Performance

Grid Engine is optimized for performance through:

- **Virtual rendering** - Only visible items are rendered
- **Batched updates** - Multiple changes are batched together
- **Efficient collision detection** - Optimized algorithms for overlap checking
- **Memory management** - Automatic cleanup of unused items

## Integration

Grid Engine integrates with:

- **Studio App** - Visual grid interface
- **Compiler Package** - Layout code generation
- **Preview Sandbox** - Component rendering

## Development

```bash
# Build package
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions for all APIs and interfaces.

## Browser Support

Compatible with all modern browsers supporting ES2017+ features.