# Blank Space

A modern web development platform that combines AI-powered code generation with an intuitive grid-based UI builder.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (in another terminal)
npm run dev:server
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## Project Structure

```
blank-space/
├── apps/
│   ├── studio/          # React frontend
│   └── server/          # Fastify backend
├── packages/
│   ├── grid-engine/     # Grid layout system
│   ├── compiler/        # Code utilities
│   └── preview-sandbox/ # Component preview
└── config/              # Shared configuration
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Fastify, Node.js
- **AI**: Multi-provider support (OpenAI, Anthropic, Groq)
- **Database**: PostgreSQL

## Development

### Setup
1. Copy `.env.example` to `.env`
2. Add your AI provider API keys
3. Run `npm install`

### Commands
```bash
npm run dev              # Start frontend
npm run dev:server       # Start backend
npm run build           # Build all
npm run test            # Run tests
npm run lint            # Lint code
```

## AI Providers

Supports multiple AI providers for code generation:
- Groq (default)
- OpenAI
- Anthropic
- Google Gemini

Configure in `.env`:
```env
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
```

## License

Private and proprietary. All rights reserved.