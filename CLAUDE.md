# Claude CLI Project Context

This file provides essential context and commands for working with the UI Grid AI project using Claude CLI.

## Project Overview

**UI Grid AI** is a modern web development platform combining AI-powered code generation with an intuitive grid-based UI builder. It's a monorepo with multiple workspaces for frontend, backend, and shared packages.

## Project Structure

```
ui-grid-ai/                 # Root monorepo
├── apps/
│   ├── studio/            # React frontend (main app)
│   └── server/            # Fastify backend API
├── packages/
│   ├── grid-engine/       # Grid layout system
│   ├── compiler/          # Code generation utilities
│   ├── codegen-prompts/   # AI prompt templates
│   └── preview-sandbox/   # Component preview system
├── config/                # Shared configuration
├── docs/                  # Project documentation
└── node_modules/          # Dependencies
```

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Zustand
- **Backend**: Fastify, TypeScript, PostgreSQL
- **AI**: Multi-provider support (OpenAI, Anthropic, Groq, etc.)
- **Build**: npm workspaces, TypeScript, ESLint, Prettier

## Common Development Commands

### Quick Start
```bash
# Install all dependencies
npm install

# Start frontend development server
npm run dev

# Start backend server (separate terminal)
npm run dev:server
```

### Building and Testing
```bash
# Build all workspaces
npm run build

# Run TypeScript checks
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test

# Clean all build artifacts
npm run clean
```

### Workspace-Specific Commands
```bash
# Frontend (studio) commands
npm run dev --workspace=apps/studio
npm run build --workspace=apps/studio
npm run preview --workspace=apps/studio

# Backend (server) commands  
npm run dev --workspace=apps/server
npm run build --workspace=apps/server
npm run start --workspace=apps/server

# Package commands
npm run build --workspace=packages/grid-engine
npm run test --workspace=packages/compiler
```

## Environment Setup

### Required Files
- `.env` - Environment variables (copy from `.env.example`)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Key Environment Variables
```env
# Server
PORT=3001
NODE_ENV=development

# AI Provider (configure at least one)
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## Development Workflow

1. **Start Development Servers**:
   ```bash
   npm run dev          # Frontend (port 5173)
   npm run dev:server   # Backend (port 3001)
   ```

2. **Make Changes**: Edit code in `apps/` or `packages/`

3. **Test Changes**:
   ```bash
   npm run typecheck    # Check types
   npm run lint         # Check code style
   npm run test         # Run tests
   ```

4. **Build for Production**:
   ```bash
   npm run build        # Build all workspaces
   ```

## Important File Locations

### Configuration
- `config/.eslintrc.json` - ESLint configuration
- `config/.prettierrc` - Prettier configuration
- `tsconfig.json` - Root TypeScript config
- `.gitignore` - Git ignore rules

### Documentation
- `README.md` - Main project documentation
- `docs/AI_PROVIDERS.md` - AI provider setup guide
- `CONTRIBUTING.md` - Development guidelines
- Individual README files in each workspace

### Entry Points
- `apps/studio/src/main.tsx` - Frontend entry
- `apps/server/src/index.ts` - Backend entry
- Package entry points defined in respective `package.json`

## Debugging and Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

2. **Missing dependencies**: Run `npm install` in root

3. **TypeScript errors**: Run `npm run typecheck`

4. **Build failures**: Check individual workspace builds

5. **AI Provider errors**: Verify API keys in `.env`

### Useful Commands for Debugging
```bash
# Check all processes
npm run dev & npm run dev:server

# Check specific workspace
cd apps/studio && npm run dev
cd apps/server && npm run dev

# View logs with timestamps
npm run dev 2>&1 | ts '[%Y-%m-%d %H:%M:%S]'

# Check dependency tree
npm ls --depth=0

# Check for vulnerabilities
npm audit
```

## Package Dependencies

### Apps Dependencies
- `apps/studio` depends on `packages/grid-engine`, `packages/compiler`
- `apps/server` depends on `packages/codegen-prompts`

### Key External Dependencies
- React ecosystem (react, react-dom, vite)
- Fastify ecosystem (fastify, @fastify/cors)
- AI SDKs (openai, @anthropic-ai/sdk, groq-sdk)
- Database (pg for PostgreSQL)
- Utilities (zod, dotenv, clsx)

## Git Workflow

### Branch Structure
- `main` - Production branch
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

### Common Git Commands
```bash
# Create feature branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "Add new feature: description"

# Push to remote
git push origin feature/new-feature

# Create pull request (use GitHub UI or gh CLI)
gh pr create --title "Add new feature" --body "Description"
```

## Performance Tips

1. **Use workspace commands**: Target specific workspaces for faster builds
2. **Incremental TypeScript**: Use `--incremental` flag for faster type checking
3. **Parallel development**: Run frontend and backend simultaneously
4. **Selective testing**: Run tests for changed packages only

## AI Integration Notes

### Supported Providers
- Groq (default) - Fast inference
- OpenAI - GPT models
- Anthropic - Claude models  
- Google Gemini - Multimodal
- Cohere - Enterprise models
- Together AI - Open source models

### Provider Switching
Change provider in `.env`:
```env
AI_PROVIDER=openai  # or groq, anthropic, gemini, cohere, together
```

### API Endpoints
- `POST /api/generate` - Generate code
- `POST /api/chat` - Chat with AI
- `GET /api/providers` - List providers
- `POST /api/test-provider` - Test provider

## Quick Reference

| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Start development | `npm run dev` |
| Start backend | `npm run dev:server` |
| Build everything | `npm run build` |
| Type check | `npm run typecheck` |
| Lint code | `npm run lint` |
| Run tests | `npm run test` |
| Clean build | `npm run clean` |

## Need Help?

1. Check `README.md` for detailed documentation
2. Review workspace-specific README files
3. Check `docs/AI_PROVIDERS.md` for AI setup
4. Review `CONTRIBUTING.md` for development guidelines
5. Check package.json scripts for available commands