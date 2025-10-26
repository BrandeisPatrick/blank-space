# Memory Bank System

**Priority 2 from AGENT_IMPROVEMENTS.md - ✅ COMPLETE**

## What is the Memory Bank?

The Memory Bank is a persistent knowledge system that allows your agents to:
- **Remember** coding rules and best practices across sessions
- **Learn** from bugs they fix (pattern recognition)
- **Improve** over time by accumulating knowledge
- **Maintain** project-specific guidelines

**Pattern inspired by:** Kilo Code's `.kilocode/` folder

---

## 📁 Folder Structure

```
.agent-memory/
├─ rules/
│  ├─ global.md          # Universal coding rules (browser constraints, React best practices)
│  └─ project.md         # Project-specific rules (user-customizable)
├─ context/
│  ├─ session-summary.json    # Compressed conversation history
│  └─ codebase-map.json       # File structure snapshot (future use)
├─ learnings/
│  └─ bug-patterns.json       # Recorded bugs and fixes
└─ prompts/                   # (Future) Externalized agent prompts
```

---

## 🧠 How It Works

### 1. **Global Rules** (`.agent-memory/rules/global.md`)

Persistent rules that **all agents** inject into their system prompts:

**Contents:**
- Browser/Sandpack constraints (no require(), no Node.js APIs)
- Banned packages (axios, lodash, etc.)
- React best practices (immutable state, hooks rules)
- Code quality standards (file organization, naming)
- Testing requirements
- Design principles

**Updated:** As agents discover new patterns

**Example rule:**
```markdown
### Critical Rules
- **NEVER use `require()`** - Only ES6 `import` statements work in browser
- **NO external npm packages** - Only React/ReactDOM are available in Sandpack
```

### 2. **Project Rules** (`.agent-memory/rules/project.md`)

User-customizable rules for **this specific project**:

**Examples:**
```markdown
### Custom Component Patterns
When creating forms in this project:
- Always use custom FormField component
- Include validation
- Show error messages inline
```

**Usage:**
- Edit this file to add project-specific conventions
- Overrides or extends global rules
- Optional (can be left empty)

### 3. **Bug Pattern Learning** (`.agent-memory/learnings/bug-patterns.json`)

Automatic recording of bugs fixed by the debugger:

**Format:**
```json
[
  {
    "timestamp": "2025-10-25T12:34:56.789Z",
    "bugType": "browser-incompatible",
    "pattern": "require() usage",
    "fix": "Convert to ES6 import statements",
    "file": "App.jsx"
  },
  {
    "bugType": "sandpack-navigation",
    "pattern": "<a href='#'> causes white screen",
    "fix": "Replace with <button onClick={}>",
    "file": "components/Header.jsx"
  }
]
```

**Recorded automatically when:**
- `debugAndFixIterative()` successfully fixes a bug
- Limited to last 100 patterns (auto-trimmed)

**Use cases:**
- Identify most common bugs (analytics)
- Train future agents to avoid patterns
- Generate project-specific linting rules

### 4. **Session Summaries** (`.agent-memory/context/session-summary.json`)

Conversation compression to prevent token exhaustion:

**Format:**
```json
{
  "text": "User created a todo app with 3 components. Fixed require() bug. Added dark mode toggle.",
  "messageCount": 25,
  "timestamp": "2025-10-25T12:34:56.789Z"
}
```

**Usage:**
- Save summary every ~20 turns (future implementation)
- Load at session start to resume context
- Reduces token usage for long conversations

---

## 🔌 Agent Integration

### Planner Agent
```javascript
// planner.js (lines 26-28)
const memory = new MemoryBank();
const persistentRules = await memory.loadRules();

const systemPrompt = `You are a planning agent...

📚 PERSISTENT RULES (Memory Bank):
${persistentRules}
...`;
```

**Impact:** Plans now respect browser constraints and project conventions

### CodeWriter Agent
```javascript
// codeWriter.js (lines 101-103, 218-220)
const memory = new MemoryBank();
const persistentRules = await memory.loadRules();

const systemPrompt = `You are an expert React code generator.

📚 PERSISTENT RULES (Memory Bank):
${persistentRules}
...`;
```

**Impact:** Generated code follows persistent rules (no require(), proper imports, etc.)

### Debugger Agent
```javascript
// debugger.js (lines 1112-1123)
// When a fix succeeds:
const memory = new MemoryBank();
await memory.recordBugPattern(
  mainIssue.type,      // e.g., 'browser-incompatible'
  mainIssue.pattern,   // e.g., 'require() usage'
  mainIssue.fix,       // e.g., 'Convert to ES6 import'
  targetFile           // e.g., 'App.jsx'
);
```

**Impact:** Builds knowledge base of common bugs and fixes

---

## 💾 Storage Modes

The Memory Bank works in **two environments**:

### Browser Mode (Your Use Case)
- Uses `localStorage` to persist data
- Prefix: `agent-memory:`
- Keys: `agent-memory:rules/global.md`, `agent-memory:learnings/bug-patterns.json`, etc.
- **Survives page reloads** ✅
- **Limited storage** (~5-10 MB depending on browser)

### Node.js Mode (Backend)
- Uses file system (`.agent-memory/` folder)
- **Unlimited storage** ✅
- Easier to edit/version control

**Auto-detected:** Checks `typeof window !== 'undefined'`

---

## 🛠️ API Usage

### Loading Rules

```javascript
import { MemoryBank } from './services/utils/memory/MemoryBank.js';

const memory = new MemoryBank();

// Load both global + project rules
const allRules = await memory.loadRules();

// Load only global rules
const globalOnly = await memory.loadGlobalRules();

// Load only project rules
const projectOnly = await memory.loadProjectRules();
```

### Recording Bug Patterns

```javascript
const memory = new MemoryBank();

await memory.recordBugPattern(
  'state-mutation',                     // bugType
  'Direct array mutation (arr.push())', // pattern
  'Use spread operator: setArr([...arr, item])', // fix
  'components/TodoList.jsx'             // file
);
```

### Session Management

```javascript
const memory = new MemoryBank();

// Save session summary
await memory.saveSessionSummary({
  text: 'User created todo app with 3 components',
  messageCount: 25
});

// Load previous session
const prevSession = await memory.loadSessionContext();
console.log(prevSession.text); // "User created todo app..."

// Clear session (new session)
await memory.clearSessionContext();
```

### Analytics

```javascript
const memory = new MemoryBank();

// Get all bug patterns
const allBugs = await memory.getBugPatterns();
console.log(allBugs.length); // 42

// Get patterns by type
const stateBugs = await memory.getBugPatternsByType('state-mutation');

// Get most common bugs
const topBugs = await memory.getCommonBugPatterns(10);
console.log(topBugs);
// [
//   { bugType: 'browser-incompatible', count: 15, examples: [...] },
//   { bugType: 'sandpack-navigation', count: 8, examples: [...] },
//   ...
// ]
```

### Statistics

```javascript
const memory = new MemoryBank();

const stats = await memory.getStats();
console.log(stats);
// {
//   sessionSummary: { exists: true, messageCount: 25, lastUpdated: '2025-10-25...' },
//   bugPatterns: { total: 42, types: ['browser-incompatible', ...], mostRecent: [...] },
//   codebaseContext: { exists: false, lastUpdated: null },
//   storageMode: 'browser (localStorage)'
// }
```

### Backup & Restore

```javascript
const memory = new MemoryBank();

// Export all data
const backup = await memory.exportAll();
console.log(backup);
// {
//   rules: { global: '...', project: '...' },
//   context: { session: {...}, codebase: {...} },
//   learnings: { bugPatterns: [...] },
//   exportedAt: '2025-10-25...'
// }

// Save to file or send to server
localStorage.setItem('memory-backup', JSON.stringify(backup));

// Import data (restore)
const backup = JSON.parse(localStorage.getItem('memory-backup'));
await memory.importAll(backup);
```

---

## 📊 Benefits

### Before Memory Bank
```
User: "Create an app"
  ↓
Agent: *generates code with require()*
  ↓
❌ Broken in Sandpack
  ↓
Debug → Fix → User sees working app
```

**Problems:**
- Same bugs repeated across sessions
- No project-specific conventions
- No learning from mistakes
- Long conversations exhaust tokens

### After Memory Bank
```
User: "Create an app"
  ↓
Agent: *loads persistent rules*
  ↓
Agent: "Global rules say: NO require(), use ES6 imports"
  ↓
✅ Generates correct code on first try
```

**Benefits:**
- ✅ **Fewer bugs** - Agents follow persistent rules
- ✅ **Consistency** - Project conventions enforced
- ✅ **Learning** - Bug patterns recorded and avoided
- ✅ **Scalability** - Session summaries prevent token exhaustion
- ✅ **Customizable** - Edit `project.md` for your needs

---

## 🎯 Real-World Examples

### Example 1: Preventing Repeated Bugs

**Scenario:** User keeps generating code with `require()`

**Without Memory Bank:**
- Bug happens every session
- User frustrated

**With Memory Bank:**
1. First bug: Debugger fixes and records pattern
2. Rule added to `global.md`: "NEVER use require()"
3. Next session: Planner/CodeWriter load rules
4. **Bug never happens again** ✅

### Example 2: Project Conventions

**Scenario:** Your project uses custom `FormField` component

**Setup:**
Edit `.agent-memory/rules/project.md`:
```markdown
### Forms
All forms must use the custom FormField component from components/FormField.jsx
```

**Result:**
- Planner knows to plan FormField usage
- CodeWriter generates code using FormField
- Consistent with existing codebase ✅

### Example 3: Bug Analytics

**After 50 fixes:**
```javascript
const memory = new MemoryBank();
const topBugs = await memory.getCommonBugPatterns(5);

console.log(topBugs);
// [
//   { bugType: 'browser-incompatible', count: 20 },  // Most common!
//   { bugType: 'state-mutation', count: 12 },
//   { bugType: 'sandpack-navigation', count: 8 },
//   { bugType: 'hooks-rules', count: 6 },
//   { bugType: 'event-handler', count: 4 }
// ]
```

**Insight:** "Browser incompatibility is our #1 issue → Improve global rules around Node.js APIs"

---

## 🔮 Future Enhancements

### Phase 3 (Next Priority)
- **Externalize prompts** to `.agent-memory/prompts/`
- Move long system prompts from code to markdown files
- Template system with placeholders

### Advanced Features
- **Codebase mapping** - Store file structure for faster planning
- **Agent performance metrics** - Track success rates per agent
- **Auto-rule generation** - AI suggests new rules based on patterns
- **Multi-project memory** - Share learnings across projects
- **Cloud sync** - Sync Memory Bank across devices

---

## 📝 Customization Guide

### How to Add Custom Rules

1. Edit `.agent-memory/rules/project.md`:
```markdown
### My Custom Rules

#### Styling
- Always use Tailwind CSS
- Primary color: blue-600
- Rounded corners: rounded-lg

#### Components
- Button component lives in components/ui/Button.jsx
- Use it for all buttons

#### State Management
- Use Zustand for global state
- Local state with useState
```

2. Save the file

3. **Browser:** Rules stored in `localStorage:agent-memory:rules/project.md`
   **Node.js:** Rules saved to `.agent-memory/rules/project.md`

4. Next time agents run, they'll load and follow your rules! ✅

### How to View Bug Patterns

**Browser console:**
```javascript
import { MemoryBank } from './services/utils/memory/MemoryBank.js';
const memory = new MemoryBank();

// Get all patterns
const patterns = await memory.getBugPatterns();
console.table(patterns);

// Get stats
const stats = await memory.getStats();
console.log(stats);
```

**Or export to JSON:**
```javascript
const backup = await memory.exportAll();
console.log(JSON.stringify(backup, null, 2));
// Copy to file for analysis
```

---

## ⚠️ Limitations & Considerations

### Browser Storage Limits
- localStorage typically ~5-10 MB
- If exceeded, oldest bug patterns are auto-trimmed (keeps last 100)
- Large rules files may need optimization

### Rules Quality
- **Garbage in, garbage out** - Bad rules = bad code
- Review and update rules periodically
- Remove obsolete rules

### Privacy
- All data stored locally (browser) or in project folder (Node.js)
- **No data sent to external servers** ✅
- Safe for private projects

---

## 🎓 Best Practices

### 1. Keep Rules Concise
```markdown
❌ Bad: "When creating components, you should always remember to use proper naming conventions and follow the React guidelines and make sure to..."

✅ Good: "Components: PascalCase (e.g., TodoItem.jsx)"
```

### 2. Update Rules Regularly
- Review bug patterns monthly
- Promote common fixes to global rules
- Remove outdated rules

### 3. Use Project Rules for Conventions
- Coding style preferences
- Library choices
- Component patterns
- NOT universal best practices (those go in global.md)

### 4. Monitor Bug Patterns
```javascript
// Weekly analytics
const memory = new MemoryBank();
const topBugs = await memory.getCommonBugPatterns(10);
console.log('Top bugs this week:', topBugs);
// → Improve rules to prevent #1 bug
```

---

## 🚀 Integration Checklist

- ✅ Folder structure created (`.agent-memory/`)
- ✅ MemoryBank utility class implemented
- ✅ Global rules file populated
- ✅ Project rules file created (template)
- ✅ Planner agent integrated
- ✅ CodeWriter agent integrated
- ✅ Debugger records bug patterns
- ✅ Browser (localStorage) support
- ✅ Node.js (file system) support
- ✅ API documentation complete

---

## 📚 Related Documentation

- **AGENT_IMPROVEMENTS.md** - Full improvement roadmap
- **TEST_DEBUG_LOOP.md** - Priority 1 implementation
- **Global Rules** - `.agent-memory/rules/global.md`
- **Project Rules** - `.agent-memory/rules/project.md`

---

**🎉 Your agents now have persistent memory and learn from experience!**

**Next:** Priority 3 - Externalize Prompts to `.agent-memory/prompts/`
