<p align="center">
  <img src="./public/images/banner-dark.png" width="50%" alt="blank space"/>
</p>

<p align="center">
  <strong>AI coding agent in your browser</strong>
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

## What is Blank Space?

Open-source AI app builder. Fast, simple, self-hostable (optimized for mobile).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                         src/                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  React + Vite                                             │ │
│  │                                                           │ │
│  │  components/     UI components (editor, preview, chat)    │ │
│  │  contexts/       React contexts (auth, files, theme)      │ │
│  │  hooks/          Custom React hooks                       │ │
│  │  services/       Business logic & AI orchestration        │ │
│  │    ├── orchestration/   Multi-agent routing               │ │
│  │    ├── tools/           LLM function calling tools        │ │
│  │    ├── prompts/         Prompt templates                  │ │
│  │    └── utils/           Shared utilities                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│                      api/                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Vercel Serverless Functions                              │ │
│  │                                                           │ │
│  │  chat.js          OpenAI proxy (GPT-5, web search)        │ │
│  │  gemini.js        Google Gemini proxy (code generation)   │ │
│  │  files.js         File CRUD (Firebase Storage)            │ │
│  │  conversations.js Conversation history                    │ │
│  │  user/            User profile, usage, quotas             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  External Services
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │   OpenAI    │  │   Google    │  │  Firebase   │           │
│    │   GPT-5     │  │   Gemini    │  │ Auth + DB   │           │
│    └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/
├── src/                    # React frontend (Vite)
│   ├── components/         # UI components
│   ├── contexts/           # React contexts (auth, files, theme)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic & AI orchestration
│   │   ├── orchestration/  # Multi-agent routing
│   │   ├── tools/          # LLM function calling tools
│   │   ├── prompts/        # Prompt templates
│   │   └── utils/          # Shared utilities
│   ├── styles/             # Global styles
│   └── templates/          # Project templates
│
├── api/                    # Vercel serverless functions
│   ├── chat.js             # OpenAI chat endpoint
│   ├── gemini.js           # Gemini code generation
│   ├── files.js            # File operations
│   ├── conversations.js    # Conversation history
│   └── user/               # User endpoints
│
└── public/                 # Static assets
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

## Deployment

### Vercel (Recommended)

```bash
npm install
vercel
```

---

## Quick Start (Development)

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

## Roadmap

- [x] Web app (current focus)
- [ ] iOS app
- [ ] Android app
- **Your idea here?** — [open an issue](https://github.com/BrandeisPatrick/blank-space/issues)!

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Apache 2.0 - see [LICENSE](./LICENSE) for details.
