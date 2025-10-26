# Context Compression System

**Priority 4 from AGENT_IMPROVEMENTS.md - ✅ COMPLETE**

## What is Context Compression?

In long conversations, sending the entire chat history to the LLM with every request causes:
- **Token exhaustion** - Hitting API token limits
- **High costs** - Paying for redundant context
- **Slow responses** - Large prompts take longer to process

Context compression solves this by **automatically summarizing** conversation history every ~20 turns, keeping only:
- Compressed summaries of older conversations
- Recent conversation (last 5 turns)

**Pattern from:** Kilo Code's conversation management system

---

## 📁 Structure

```
src/services/utils/
├─ compression/
│  └─ ContextCompressor.js    # Core compression utility
└─ llm/
   └─ conversationLogger.js    # Logger with compression support

.agent-memory/context/
├─ conversation-summaries.json # All summaries (last 50)
└─ session-summary.json        # Final session summary
```

---

## 🎯 How It Works

### 1. Turn Tracking

Every user/assistant interaction is a "turn":

```
Turn 1:  User: "Create a todo app"
Turn 2:  Assistant: [generates code]
Turn 3:  User: "Add dark mode"
Turn 4:  Assistant: [modifies code]
...
Turn 20: User: "Fix the bug"
```

### 2. Auto-Summarization

Every 20 turns (configurable), the system:

1. **Takes last 20 turns** (since last summary)
2. **Sends to LLM** with summarization prompt
3. **Stores compressed summary** (< 2000 chars)
4. **Clears old turns**, keeps only recent 5

**Result:** 20 turns (30,000+ chars) → Summary (2,000 chars) = **93% reduction**

### 3. Context Retrieval

When agent needs context:

```
CONVERSATION HISTORY:

[Summary 1 (turns 1-20)]:
User requested a todo app with dark mode. Implemented React components
with Tailwind styling. Fixed state mutation bug in addTodo function.

[Summary 2 (turns 21-40)]:
Added authentication system with email/password. Created user context
and protected routes. Resolved CORS issues with backend API.

---

RECENT CONVERSATION:

User: Fix the delete button
Assistant: I'll fix the onClick handler in TodoItem.jsx
User: Thanks! Now add a search feature
Assistant: Adding search bar component with filtering logic
```

**Total:** ~5,000 chars instead of 50,000 chars

---

## 🔧 ContextCompressor API

### Basic Usage

```javascript
import { ContextCompressor } from './utils/compression/ContextCompressor.js';

const compressor = new ContextCompressor({
  turnThreshold: 20,        // Summarize every N turns
  maxSummaryLength: 2000    // Max chars per summary
});

// Add conversation turns
await compressor.addTurn({
  role: 'user',
  content: 'Create a todo app'
});

await compressor.addTurn({
  role: 'assistant',
  content: '[Generated code here...]'
});

// After 20 turns, auto-summarizes
// Returns: true if summarization happened
const summarized = await compressor.addTurn({
  role: 'user',
  content: 'Add dark mode'
});

if (summarized) {
  console.log('Context compressed!');
}
```

### Get Compressed Context

```javascript
const context = compressor.getCompressedContext();
// Returns formatted string with summaries + recent turns

// Use in agent prompts:
const systemPrompt = `
You are a coding assistant.

${context}

Now respond to the user's latest request.
`;
```

### Manual Summarization

```javascript
// Force summarization (even if threshold not reached)
const summary = await compressor.summarizeAndCompress();

console.log(summary);
// {
//   timestamp: '2025-10-25T...',
//   turnRange: { start: 0, end: 20 },
//   summary: 'User requested...',
//   turnCount: 20
// }
```

### Session Management

```javascript
// Get session metadata
const metadata = compressor.getSessionMetadata();
// {
//   startTime: '2025-10-25T10:00:00Z',
//   turnCount: 45,
//   summaryCount: 2,
//   currentTurns: 5
// }

// Save final session summary to Memory Bank
await compressor.saveSessionSummary();

// Clear session (for testing or reset)
compressor.clearSession();
```

### Load Previous Summaries

```javascript
// Load last 5 summaries from Memory Bank
const previousSummaries = await compressor.loadPreviousSummaries(5);

// Use to provide context from past sessions
```

---

## 🔧 ConversationLogger Integration

ConversationLogger now has built-in context compression support:

### Create Logger with Compression

```javascript
import { createLogger } from './utils/llm/conversationLogger.js';

const logger = createLogger('planner', {
  compressionEnabled: true,    // Enable compression (default: true)
  turnThreshold: 20,           // Summarize every 20 turns
  maxSummaryLength: 2000,      // Max 2000 chars per summary
  logLevel: 'DEBUG'            // See compression events
});
```

### Track User Turns

```javascript
// When user sends message
await logger.addUserTurn(userMessage);

// Automatically triggers compression at turn 20, 40, 60...
```

### Track Assistant Turns

```javascript
// When assistant responds
await logger.addAssistantTurn(response);
```

### Get Compressed Context

```javascript
// Get compressed context for prompts
const context = logger.getCompressedContext();

const systemPrompt = `You are a coding assistant.\n\n${context}`;
```

### Save Session

```javascript
// At end of session (saves both logs and summaries)
await logger.saveSession();
```

---

## 📊 Example: Full Session Flow

```javascript
import { createLogger } from './utils/llm/conversationLogger.js';

// Create logger with compression
const logger = createLogger('assistant', {
  compressionEnabled: true,
  turnThreshold: 5  // For demo, compress every 5 turns
});

// Conversation
await logger.addUserTurn('Create a todo app');
await logger.addAssistantTurn('[Generated code...]');

await logger.addUserTurn('Add dark mode');
await logger.addAssistantTurn('[Modified code...]');

await logger.addUserTurn('Fix the bug');
await logger.addAssistantTurn('[Fixed code...]');

await logger.addUserTurn('Add authentication');
await logger.addAssistantTurn('[Auth code...]');

await logger.addUserTurn('Add API integration');
// 🗜️ Compression triggered! (turn 10, threshold = 5)
await logger.addAssistantTurn('[API code...]');

// Get compressed context
const context = logger.getCompressedContext();

console.log(context);
/*
CONVERSATION HISTORY:

[Summary 1 (turns 0-5)]:
User requested todo app with dark mode. Fixed state mutation bug.
Added authentication system with email/password.

---

RECENT CONVERSATION:

User: Add API integration
Assistant: [API code...]
*/

// Get metadata
const metadata = logger.getCompressionMetadata();
console.log(metadata);
// {
//   startTime: '2025-10-25T10:00:00Z',
//   turnCount: 10,
//   summaryCount: 1,
//   currentTurns: 5
// }

// Save session
await logger.saveSession();
```

---

## 🧪 Integration with Agents

### Planner Agent Example

```javascript
import { createPlan } from './agents/planner.js';
import { createLogger } from './utils/llm/conversationLogger.js';

// Create logger with compression
const logger = createLogger('planner', {
  compressionEnabled: true,
  turnThreshold: 20
});

// Track user message
await logger.addUserTurn(userMessage);

// Get compressed context
const conversationContext = logger.getCompressedContext();

// Create plan with context
const plan = await createPlan(
  'create-app',
  userMessage,
  currentFiles,
  null,
  logger  // Pass logger to agent
);

// Track assistant response
await logger.addAssistantTurn(JSON.stringify(plan));
```

### CodeWriter Agent Example

```javascript
import { writeCode } from './agents/codeWriter.js';
import { createLogger } from './utils/llm/conversationLogger.js';

const logger = createLogger('codewriter', {
  compressionEnabled: true
});

await logger.addUserTurn(userMessage);

const code = await writeCode({
  mode: 'generate',
  filename: 'App.jsx',
  plan,
  logger
});

await logger.addAssistantTurn(code);
```

---

## 📁 Storage in Memory Bank

### Conversation Summaries

**File:** `.agent-memory/context/conversation-summaries.json`

```json
[
  {
    "timestamp": "2025-10-25T10:15:00Z",
    "turnRange": { "start": 0, "end": 20 },
    "summary": "User requested a todo app with dark mode...",
    "turnCount": 20
  },
  {
    "timestamp": "2025-10-25T10:30:00Z",
    "turnRange": { "start": 20, "end": 40 },
    "summary": "Added authentication and API integration...",
    "turnCount": 20
  }
]
```

**Retention:** Last 50 summaries (auto-trimmed)

### Session Summary

**File:** `.agent-memory/context/session-summary.json`

```json
{
  "timestamp": "2025-10-25T11:00:00Z",
  "startTime": "2025-10-25T10:00:00Z",
  "totalTurns": 45,
  "summaries": [
    {
      "timestamp": "2025-10-25T10:15:00Z",
      "turnRange": { "start": 0, "end": 20 },
      "summary": "...",
      "turnCount": 20
    },
    {
      "timestamp": "2025-10-25T10:30:00Z",
      "turnRange": { "start": 20, "end": 40 },
      "summary": "...",
      "turnCount": 20
    }
  ],
  "duration": 3600000
}
```

---

## ⚡ Performance Impact

### Token Savings

**Without compression (50 turns):**
- Average: 30,000 tokens per prompt (50 turns × 600 tokens)
- Cost: $0.075 per request (GPT-4o input)
- **Total for 10 requests: $0.75**

**With compression (50 turns):**
- Summaries: 1,500 tokens (2 summaries × 750 tokens)
- Recent turns: 3,000 tokens (5 turns × 600 tokens)
- Average: 4,500 tokens per prompt
- Cost: $0.011 per request
- **Total for 10 requests: $0.11**

**Savings:** 85% reduction in tokens and cost!

### Memory Usage

- Summaries: ~100 KB in memory (50 summaries × 2 KB)
- Stored in Memory Bank: ~50 KB on disk
- **Negligible impact**

### LLM Call Overhead

- Summarization call: ~2 seconds every 20 turns
- User impact: One 2-second delay per 20 interactions
- **Acceptable for cost savings**

---

## 🎚️ Configuration Options

### ContextCompressor Options

```javascript
new ContextCompressor({
  turnThreshold: 20,          // Summarize every N turns (default: 20)
  maxSummaryLength: 2000      // Max chars per summary (default: 2000)
});
```

### ConversationLogger Options

```javascript
createLogger('agent-name', {
  compressionEnabled: true,    // Enable compression (default: true)
  turnThreshold: 20,           // Turns before compression (default: 20)
  maxSummaryLength: 2000,      // Max summary chars (default: 2000)
  logLevel: 'INFO'             // DEBUG to see compression events
});
```

---

## 🛠️ Customization

### Custom Summarization Model

By default, uses `MODELS.ANALYZER` (or `MODELS.PLANNER` fallback). To customize:

```javascript
// In ContextCompressor.js, line 96
const summary = await callLLM({
  model: 'gpt-4o-mini',  // Use cheaper model for summaries
  systemPrompt,
  userPrompt,
  maxTokens: 1000,
  temperature: 0.3
});
```

### Custom Summary Format

Edit `createSummary()` method in `ContextCompressor.js`:

```javascript
const systemPrompt = `You are a conversation summarizer.

Focus on:
- Technical implementations
- Code changes made
- Bugs fixed
- User preferences

Format as bullet points.`;
```

### Adjust Retention Limits

```javascript
// In saveSummaryToMemoryBank() - line 120
const trimmed = existingSummaries.slice(-100);  // Keep last 100 (default: 50)
```

---

## 🔍 Debugging

### View Compression Events

```javascript
const logger = createLogger('agent', {
  compressionEnabled: true,
  logLevel: 'DEBUG'  // Shows compression logs
});
```

**Output:**
```
🗜️ Compressing context (20 turns)...
✅ Context compressed: 20 turns → 1847 chars
🗜️ Context compressed at turn 20
```

### Inspect Compressed Context

```javascript
const context = compressor.getCompressedContext();
console.log(context);
```

### Check Session Metadata

```javascript
const metadata = compressor.getSessionMetadata();
console.log(metadata);
// {
//   startTime: '...',
//   turnCount: 45,
//   summaryCount: 2,
//   currentTurns: 5
// }
```

### View Stored Summaries

**Browser:**
```javascript
const memory = new MemoryBank();
const summaries = await memory.storage.read('context/conversation-summaries.json', '[]', true);
console.log(summaries);
```

**Node.js:**
```bash
cat .agent-memory/context/conversation-summaries.json
```

---

## 📚 Summary

**What we achieved:**

1. ✅ **Automatic compression** - Every 20 turns (configurable)
2. ✅ **LLM-powered summarization** - High-quality summaries
3. ✅ **Memory Bank integration** - Persistent storage
4. ✅ **ConversationLogger integration** - Easy to use
5. ✅ **85% token savings** - Massive cost reduction
6. ✅ **Dual-mode support** - Browser and Node.js

**Impact:**

- Long conversations no longer hit token limits
- 85% reduction in prompt tokens and costs
- Agents get concise, relevant context
- Session history persists across restarts

---

**Next Priority:** Priority 5 - MCP-Style Tools (Approval gates and policies)

**Files:**
- `src/services/utils/compression/ContextCompressor.js`
- `src/services/utils/llm/conversationLogger.js` (updated)
- `.agent-memory/context/conversation-summaries.json` (created on first use)
- `.agent-memory/context/session-summary.json` (created on session end)
