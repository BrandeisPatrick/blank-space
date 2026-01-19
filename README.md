<p align="center">
  <img src="./public/images/banner-dark.png" width="50%" alt="blank space"/>
</p>

<p align="center">
  🎄 <strong>AI coding agent in your browser</strong> 🎄
</p>

<p align="center">
  <strong>Try it live:</strong> <a href="https://www.blankspace.build">www.blankspace.build</a>
</p>

<p align="center">
  <a href="https://github.com/BrandeisPatrick/blank-space/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/BrandeisPatrick/blank-space?logo=github">
  </a>
  <a href="https://github.com/BrandeisPatrick/blank-space/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/BrandeisPatrick/blank-space">
  </a>
  <a href="https://github.com/BrandeisPatrick/blank-space/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue">
  </a>
</p>

---

## ✨ What is Blank Space?

Open-source AI app builder. Fast, simple, self-hostable (optimized for mobile).

---

## 🏗️ Architecture

Blank Space is designed as a **SaaS-ready monorepo** with clean separation between backend and frontend, enabling deployment on any platform.

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPS                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │  Web (React)│  │   Mobile    │  │    CLI      │   Any frontend can  │
│  │  apps/web   │  │  (future)   │  │  (future)   │   use the same API  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │
└─────────┼────────────────┼────────────────┼─────────────────────────────┘
          │                │                │
          │  HTTP/REST API (with Firebase Auth token)
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API                                    │
│                         apps/api                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Vercel Serverless  /  Express  /  Any Node.js Host             │   │
│  │                                                                  │   │
│  │  /api/chat       → OpenAI proxy (GPT-5, web search)             │   │
│  │  /api/gemini     → Google Gemini proxy (code generation)        │   │
│  │  /api/files      → File CRUD (Firebase Storage)                 │   │
│  │  /api/user/*     → User profile, usage, quotas                  │   │
│  │  /api/conversations → Conversation history                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │  Uses
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CORE BUSINESS LOGIC                               │
│                       packages/core                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Portable JavaScript - runs on any runtime (Node, Lambda, etc.) │   │
│  │                                                                  │   │
│  │  orchestration/    Multi-agent routing (Code, Chat, Assistant)  │   │
│  │  tools/            File ops, validation, search                 │   │
│  │  prompts/          LLM prompt templates                         │   │
│  │  utils/            HTTP clients, retry logic, formatters        │   │
│  │  config/           API config, model selection                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │  External Services
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   OpenAI    │  │   Google    │  │  Firebase   │                     │
│  │   GPT-5     │  │   Gemini    │  │ Auth + DB   │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/
├── src/                         # React frontend (Vite)
│   ├── components/              # React UI components
│   ├── contexts/                # React contexts (auth, files, etc.)
│   ├── hooks/                   # React hooks
│   └── services/                # Business logic, tools, agents
│
├── api/                         # Vercel API routes (serverless functions)
│   ├── chat.js                  # OpenAI chat endpoint
│   ├── gemini.js                # Gemini code generation endpoint
│   ├── files.js                 # File operations (Firebase Storage)
│   ├── conversations.js         # Conversation history
│   └── user/                    # User profile, usage, quotas
│
├── packages/
│   └── core/                    # @blankspace/core - Portable business logic
│       └── src/
│           ├── orchestration/   # Multi-agent routing
│           ├── tools/           # LLM function calling tools
│           ├── prompts/         # Prompt templates
│           └── utils/           # Shared utilities
│
└── pnpm-workspace.yaml          # Monorepo workspace config
```

### Agent System

The orchestration layer routes user requests to specialized agents:

| Agent | Model | Purpose | Tools |
|-------|-------|---------|-------|
| **Code Agent** | Gemini 3 Flash/Pro | Code generation, debugging | read, write, edit, glob, grep, validate |
| **Chat Agent** | GPT-5-mini | General conversation, web search | None (single response) |
| **Assistant Agent** | GPT-5-mini | File operations on user storage | read_file, write_file, list_directory |

### Data Flow

```
User Message
    │
    ▼
Intent Classification (GPT-4o-mini)
    │
    ├── "create" / "debug" ──→ Code Agent ──→ Gemini API
    │                              │
    │                              ▼
    │                         Tool Loop (read/write/validate)
    │                              │
    │                              ▼
    │                         Generated Files
    │
    ├── "chat" ──→ Chat Agent ──→ OpenAI API (+ web search)
    │                  │
    │                  ▼
    │             Text Response
    │
    └── "assistant" ──→ Assistant Agent ──→ OpenAI API
                            │
                            ▼
                       File Operations (Firebase Storage)
```

---

## 🚀 Deployment Options

### Vercel (Recommended)

```bash
npm install
vercel
```

### Any Node.js Host

The `@blankspace/core` package is portable JavaScript that runs anywhere:

```javascript
import { processMessage } from '@blankspace/core';

const result = await processMessage(userMessage, currentFiles, onUpdate, {
  modelTier: 'lite',
  conversationIntent: null,
});
```

---

## 🔧 Quick Start (Development)

```bash
# 1) Clone
git clone https://github.com/BrandeisPatrick/blank-space
cd blank-space

# 2) Configure
cp .env.example .env.local
# Edit .env.local with your API keys

# 3) Install & run
npm install
npm run dev
# open http://localhost:5173
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Firebase (for auth & storage)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Optional
USE_GPT5=true              # Enable GPT-5 models
PRODUCTION_MODE=true       # Use premium models everywhere
```

---

## 📋 Roadmap

- [x] Monorepo architecture for multi-platform deployment
- [ ] React Native mobile app
- **Your idea here?** — [open an issue](https://github.com/BrandeisPatrick/blank-space/issues)!

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Apache 2.0 - see [LICENSE](./LICENSE) for details.
