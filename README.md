# UI Grid AI

A modern web development platform that combines AI-powered code generation with an intuitive grid-based UI builder. This monorepo contains a full-stack application with multiple AI provider support for creating dynamic web applications.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (in another terminal)
npm run dev:server
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 📁 Project Structure

```
ui-grid-ai/
├── apps/
│   ├── studio/          # React frontend application
│   └── server/          # Fastify backend API
├── packages/
│   ├── codegen-prompts/ # AI prompt templates
│   ├── compiler/        # Code compilation utilities
│   ├── framework-advisor/ # AI framework recommendation system
│   ├── grid-engine/     # Grid layout engine
│   └── preview-sandbox/ # Component preview system
├── config/              # Shared configuration files
└── docs/               # Project documentation
```

## 🏗️ Architecture

### Frontend (Studio)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: CSS with design system
- **UI Components**: Custom grid-based components

### Backend (Server)
- **Framework**: Fastify
- **Runtime**: Node.js with TypeScript
- **AI Providers**: Multi-provider support (OpenAI, Anthropic, Groq, etc.)
- **Database**: PostgreSQL
- **Environment**: dotenv configuration

### Packages
- **Grid Engine**: Core grid layout and interaction system
- **Compiler**: Code generation and transformation utilities
- **Codegen Prompts**: Template system for AI code generation
- **Preview Sandbox**: Isolated component rendering environment

## 🤖 AI Provider Support

This application supports multiple AI providers for code generation:

- **Groq** (Default) - Fast inference with Llama models
- **OpenAI** - GPT-4, GPT-3.5 models
- **Anthropic** - Claude 3 models
- **Google Gemini** - Multimodal capabilities
- **Cohere** - Enterprise-focused models
- **Together AI** - Open-source model access

See [AI Providers Documentation](./docs/AI_PROVIDERS.md) for detailed configuration.

## 🧠 Framework Advisor

UI Grid AI includes an intelligent Framework Advisor that helps developers choose the best web development framework for their projects using AI-powered analysis.

### Features

- **🤖 AI-Powered Analysis** - Natural language prompt understanding
- **📊 Multi-Criteria Scoring** - Weighted scoring across performance, learning curve, ecosystem, etc.
- **🔍 Framework Comparison** - Side-by-side evaluation of multiple frameworks
- **📝 Detailed Reasoning** - Clear explanations for recommendations
- **⚡ Real-time Analysis** - Fast recommendations for immediate decision-making

### Supported Frameworks

- **React** - Component-based library with rich ecosystem
- **Vue.js** - Progressive framework with gentle learning curve  
- **Angular** - Full-featured enterprise framework
- **Svelte** - Compile-time optimized framework
- **Next.js** - React-based full-stack framework
- **Nuxt.js** - Vue.js-based full-stack framework
- **Remix** - Modern React framework focused on web standards
- **Vanilla JavaScript** - No-framework approach

### Quick Example

```javascript
import { FrameworkAdvisor } from '@ui-grid-ai/framework-advisor';

const advisor = new FrameworkAdvisor();

// Get recommendation from natural language
const recommendation = await advisor.recommendFromPrompt(
  "I need to build a fast e-commerce site with SEO support for a small team"
);

console.log(`Recommended: ${recommendation.primary.framework.name}`);
console.log(`Score: ${recommendation.primary.score}/100`);
console.log(`Reasoning: ${recommendation.primary.reasoning}`);
```

### API Endpoints

- `POST /api/framework-advisor/recommend-from-prompt` - Get recommendations from natural language
- `POST /api/framework-advisor/recommend` - Get recommendations from structured requirements
- `POST /api/framework-advisor/compare` - Compare multiple frameworks
- `GET /api/framework-advisor/frameworks` - List all available frameworks

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (for server)

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```env
AI_PROVIDER=groq
GROQ_API_KEY=your_api_key_here
# Add other provider keys as needed
```

### Available Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run dev:server       # Start backend dev server

# Building
npm run build           # Build all workspaces
npm run typecheck       # Run TypeScript checks
npm run lint            # Run ESLint across all workspaces

# Testing
npm run test            # Run tests across all workspaces

# Cleanup
npm run clean           # Clean all build artifacts
```

### Workspace Commands

Run commands in specific workspaces:

```bash
# Frontend specific
npm run dev --workspace=apps/studio
npm run build --workspace=apps/studio

# Backend specific  
npm run dev --workspace=apps/server
npm run build --workspace=apps/server

# Package specific
npm run build --workspace=packages/grid-engine
```

## 📦 Package Details

### Apps

#### Studio (`@ui-grid-ai/studio`)
The main frontend application featuring:
- Visual grid-based UI builder
- Real-time code preview
- AI-powered component generation
- Responsive design system

#### Server (`@ui-grid-ai/server`)
RESTful API server providing:
- Multi-provider AI integration
- Code generation endpoints
- User authentication
- Data persistence

### Packages

#### Grid Engine (`@ui-grid-ai/grid-engine`)
Core grid system providing:
- Drag-and-drop interface
- Grid layout calculations
- Component positioning
- Responsive breakpoint handling

#### Compiler (`@ui-grid-ai/compiler`)
Code transformation utilities:
- JSX/TSX compilation
- Bundle optimization
- Type generation
- Asset processing

#### Codegen Prompts (`@ui-grid-ai/codegen-prompts`)
AI prompt management:
- Template system
- Context injection
- Prompt optimization
- Provider-specific formatting

#### Preview Sandbox (`@ui-grid-ai/preview-sandbox`)
Isolated component rendering:
- Safe code execution
- Hot reload support
- Error boundary handling
- Performance monitoring

## 🔧 Configuration

### TypeScript
- Shared `tsconfig.json` in root
- Per-package configuration overrides
- Strict type checking enabled

### ESLint
- Shared ESLint configuration
- React and TypeScript rules
- Import sorting and organization

### Prettier
- Consistent code formatting
- Automatic formatting on save
- Integration with ESLint

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific workspace
npm run test --workspace=apps/studio
npm run test --workspace=packages/grid-engine
```

## 📚 Documentation

- [AI Providers](./docs/AI_PROVIDERS.md) - Configure and use different AI services
- [Contributing](./CONTRIBUTING.md) - Development guidelines and standards
- [Claude CLI](./CLAUDE.md) - Common commands and project context

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.