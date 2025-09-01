# Server - Backend API

The backend API server for UI Grid AI, built with Fastify and TypeScript.

## Overview

Server provides a robust REST API with multi-provider AI integration for code generation, user management, and data persistence.

## Features

- 🚀 Fast REST API with Fastify
- 🤖 Multi-provider AI integration (OpenAI, Anthropic, Groq, etc.)
- 🔐 User authentication and authorization  
- 📊 PostgreSQL database integration
- 🌐 CORS support for frontend integration
- 📝 Request validation with Zod
- ⚡ Hot reload development

## Tech Stack

- **Fastify** - Fast and efficient web framework
- **TypeScript** - Type-safe server development
- **PostgreSQL** - Relational database
- **Zod** - Runtime type validation
- **Multiple AI SDKs** - OpenAI, Anthropic, Groq, etc.

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Getting Started

```bash
# Install dependencies (from root)
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev --workspace=apps/server
# or from root
npm run dev:server
```

The API will be available at [http://localhost:3001](http://localhost:3001).

### Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## API Endpoints

### AI Generation
- `POST /api/generate` - Generate code with AI
- `POST /api/chat` - Chat with AI assistant
- `GET /api/providers` - List available AI providers
- `POST /api/test-provider` - Test specific AI provider

### Health Check
- `GET /health` - Server health status

## Environment Configuration

Required environment variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ui_grid_ai

# AI Provider APIs (configure at least one)
AI_PROVIDER=groq                    # Default provider
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
COHERE_API_KEY=your_cohere_key
TOGETHER_API_KEY=your_together_key

# Model Configuration (optional)
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_MODEL=gpt-4-turbo-preview
ANTHROPIC_MODEL=claude-3-opus-20240229
```

## Project Structure

```
apps/server/
├── src/
│   ├── providers/     # AI provider implementations
│   ├── routes/        # API route handlers
│   ├── schemas/       # Zod validation schemas
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   └── index.ts       # Server entry point
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## AI Provider System

The server supports multiple AI providers through a unified interface:

### Supported Providers

1. **Groq** (Default)
   - Fast inference with Llama models
   - Free tier available
   - Models: Llama 3.3 70B, Llama 3.1, Mixtral

2. **OpenAI**
   - Industry standard models
   - Models: GPT-4, GPT-3.5 Turbo

3. **Anthropic**
   - Claude 3 model family
   - Advanced reasoning capabilities

4. **Google Gemini**
   - Multimodal capabilities
   - Gemini Pro and Flash models

5. **Cohere**
   - Enterprise-focused models
   - Command family models

6. **Together AI**
   - Open-source model access
   - Various Llama and Mistral models

### Provider Configuration

Each provider is configured through environment variables and follows a common interface for seamless switching.

### Usage Examples

```bash
# Use default provider
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a React button component"}'

# Specify provider and model
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React button component",
    "provider": "openai",
    "model": "gpt-4"
  }'
```

## Database Schema

PostgreSQL database with tables for:
- Users and authentication
- Generated components
- AI conversation history
- Application settings

## Dependencies

### Core Dependencies
- `fastify` - Web framework
- `@fastify/cors` - CORS support
- `pg` - PostgreSQL client
- `zod` - Schema validation
- `dotenv` - Environment configuration
- AI SDKs for each provider

### Development Dependencies
- `tsx` - TypeScript execution
- `typescript` - TypeScript compiler
- `eslint` - Code linting
- Type definitions

## Building and Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start
```

Built files are output to the `dist/` directory.

## Error Handling

Comprehensive error handling with:
- Input validation using Zod schemas
- AI provider error handling and fallbacks
- Database connection error handling
- Structured error responses

## Logging

Development logging includes:
- Request/response logging
- AI provider interactions
- Database queries
- Error tracking

## Security

Security features:
- Input sanitization
- CORS configuration
- Environment variable validation
- API key security best practices

## Performance

Optimizations include:
- Fastify's high-performance architecture
- Connection pooling for database
- Response caching where appropriate
- Efficient AI provider request handling