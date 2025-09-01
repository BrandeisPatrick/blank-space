# Studio - Frontend Application

The main frontend application for UI Grid AI, built with React and TypeScript.

## Overview

Studio provides an intuitive visual interface for building web applications using AI-powered code generation and a grid-based design system.

## Features

- 🎨 Visual grid-based UI builder
- 🤖 AI-powered component generation
- ⚡ Real-time code preview
- 📱 Responsive design system
- 🔥 Hot reload development
- 🎯 Type-safe development with TypeScript

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management
- **CSS** - Custom design system

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Getting Started

```bash
# Install dependencies (from root)
npm install

# Start development server
npm run dev --workspace=apps/studio
# or from root
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## Project Structure

```
apps/studio/
├── public/          # Static assets
├── src/
│   ├── components/  # React components
│   │   ├── Chat/    # Chat interface components
│   │   ├── CodeEditor/ # Code editor components
│   │   ├── Landing/ # Landing page components
│   │   └── Settings/ # Settings components
│   ├── contexts/    # React contexts
│   ├── state/       # Zustand stores
│   ├── styles/      # CSS and theme files
│   ├── types/       # TypeScript type definitions
│   ├── App.tsx      # Main app component
│   └── main.tsx     # Application entry point
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Vite configuration
```

## Key Components

### Grid System
The core grid engine provides drag-and-drop functionality for building layouts visually.

### Code Editor
Integrated Monaco editor for direct code editing with syntax highlighting and IntelliSense.

### Chat Interface
AI-powered chat for generating and modifying components using natural language.

### Preview System
Real-time preview of generated components with error handling and hot reload.

## State Management

Using Zustand for simple, type-safe state management:

- `appStore` - Application-wide state and settings
- `userStore` - User preferences and authentication

## Styling

Custom CSS with a design system approach:
- CSS variables for theming
- Responsive design patterns
- Component-scoped styles

## Dependencies

### Core Dependencies
- `react` & `react-dom` - React framework
- `zustand` - State management
- `clsx` - Conditional class names
- `@ui-grid-ai/grid-engine` - Grid layout system
- `@ui-grid-ai/compiler` - Code compilation

### Development Dependencies
- `@vitejs/plugin-react` - Vite React plugin
- `typescript` - TypeScript compiler
- `eslint` - Code linting
- Various type definitions

## Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build output will be in the `dist/` directory.

## Configuration

### Vite Configuration
See `vite.config.ts` for build and development server configuration.

### TypeScript Configuration
Extends the root TypeScript configuration with React-specific settings.

## Integration

Studio integrates with:
- **Server API** - Backend for AI generation and data persistence
- **Grid Engine** - Core layout and interaction system
- **Compiler** - Code transformation and optimization

## Environment Variables

```bash
# Development server port (optional)
PORT=5173

# API server URL (optional)
VITE_API_URL=http://localhost:3001
```