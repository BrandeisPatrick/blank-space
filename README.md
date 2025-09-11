# Blank Space

A modern web development platform that combines AI-powered code generation with an intuitive grid-based UI builder.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# API routes are served by the same dev server
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
blank-space/
├── apps/
│   └── studio/          # React frontend + API routes
├── packages/
│   ├── grid-engine/     # Grid layout system
│   ├── compiler/        # Code utilities
│   └── preview-sandbox/ # Component preview
└── config/              # Shared configuration
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Vercel API routes
- **AI**: Multi-provider support (OpenAI, X.AI, Anthropic)

## Development

### Setup
1. Copy `.env.example` to `.env`
2. Add your AI provider API keys
3. Run `npm install`

### Commands
```bash
npm run dev              # Start frontend + API routes
npm run build           # Build all
npm run test            # Run tests
npm run lint            # Lint code
```

## AI Providers

Supports multiple AI providers for code generation:
- OpenAI (GPT models)
- X.AI (Grok models)
- Anthropic (Claude models)

Configure in `.env`:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

## License

Private and proprietary. All rights reserved.