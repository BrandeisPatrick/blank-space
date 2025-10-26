# Bina Agent System & Memory Architecture

**Visual Documentation** | Last Updated: 2025-10-26

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    BINA AGENT SYSTEM OVERVIEW                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Prompt ──► ORCHESTRATOR ──► PLAN ──► CODE ──► TEST         │
│                                                ▲      │          │
│                                                │      ▼          │
│                                                └──── DEBUG       │
│                                                     (iterate)    │
│                                                                  │
│  ┌────────────────────┐    ┌─────────────────────────────┐       │
│  │   6 AGENTS         │◄───┤   MEMORY SYSTEM             │       │
│  ├────────────────────┤    ├─────────────────────────────┤       │
│  │ • Planner          │    │ • Rules (persistent)        │       │
│  │ • Analyzer         │    │ • Context (sessions)        │       │
│  │ • Code Writer      │    │ • Learning (bug patterns)   │       │
│  │ • Designer         │    └─────────────────────────────┘       │
│  │ • Debugger         │                                          │
│  │ • Validator        │                                          │
│  └────────────────────┘                                          │
│                                                                  │
│  Result: Production-Ready React Applications                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Agent System Architecture

### Orchestrator Layer

```
                        ┌─────────────────────────┐
                        │     USER REQUEST        │
                        │  + Current Files (opt)  │
                        └────────────┬────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │   MAIN ORCHESTRATOR            │
                    │  (orchestrator.js)             │
                    │                                │
                    │  🔍 Detect Scenario:           │
                    │    • Greenfield (no files)    │
                    │    • Contextual (has files)   │
                    │    • Simple (quick fix)       │
                    └────────┬─────────────┬─────────┘
                             │             │
                ┌────────────┘             └──────────────┐
                ▼                                         ▼
    ┌───────────────────────────┐         ┌──────────────────────────┐
    │  PLAN ORCHESTRATOR        │         │  CODE ORCHESTRATOR       │
    │  planOrchestrator.js      │         │  codeOrchestrator.js     │
    ├───────────────────────────┤         ├──────────────────────────┤
    │                           │         │                          │
    │ planFromScratch()         │         │ generateNewCode()        │
    │  ├─► Planner Agent        │         │  ├─► Code Writer         │
    │  ├─► Designer Agent       │         │  └─► Validator           │
    │  └─► Quality Scorer       │         │                          │
    │                           │         │ modifyExistingCode()     │
    │ planWithContext()         │         │  ├─► Analyzer            │
    │  ├─► Analyzer Agent       │         │  ├─► Code Writer         │
    │  ├─► Planner Agent        │         │  └─► Validator           │
    │  └─► Quality Scorer       │         │                          │
    │                           │         │ fixBugs()                │
    │ detectScenario()          │         │  └─► Debugger Agent      │
    │  └─► Complexity eval      │         │                          │
    │                           │         │ refactorCode()           │
    └───────────────────────────┘         │  ├─► Analyzer            │
                                          │  ├─► Code Writer         │
                                          │  └─► Validator           │
                                          └──────────────────────────┘
```

---

## The 6 Agents (Visual Cards)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                        AGENT #1: PLANNER                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/planner.js              Model: gpt-5-mini              ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  User message, Current files, Intent               ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────────────────────────────────────┐                   ║
║  │ PROCESS                                      │                   ║
║  │  1. Load: MemoryBank.loadRules()             │                   ║
║  │  2. Load: PromptLoader.loadPlannerPrompt()   │                   ║
║  │  3. Call: LLMClient (GPT-5-mini)             │                   ║
║  │  4. Structure plan with file specifications  │                   ║
║  └──────┬───────────────────────────────────────┘                   ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────┐                                                    ║
║  │ OUTPUT       │                                                    ║
║  │              │  {                                                 ║
║  │              │    steps: [...]                                    ║
║  │              │    filesToCreate: [...]                            ║
║  │              │    fileDetails: {...}                              ║
║  │              │    appIdentity: {...}                              ║
║  │              │  }                                                 ║
║  └──────────────┘                                                    ║
║                                                                       ║
║  Dependencies: MemoryBank • PromptLoader • LLMClient                 ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                       AGENT #2: ANALYZER                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/analyzer.js             Model: gpt-5-nano              ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  User message, Current files, Mode                 ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────────────────────────────────────┐                   ║
║  │ MODES                                        │                   ║
║  │  • MODIFICATION ──► Find exact patterns      │                   ║
║  │  • DEBUG ──────────► Locate error context    │                   ║
║  │  • STYLE_EXTRACT ──► Extract UX patterns     │                   ║
║  │  • EXPLAIN ────────► Explain code logic      │                   ║
║  │  • REFACTOR ───────► Identify opportunities  │                   ║
║  └──────┬───────────────────────────────────────┘                   ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────┐                                                    ║
║  │ OUTPUT       │  Multi-file analysis:                              ║
║  │              │  {                                                 ║
║  │              │    filesToModify: [...]                            ║
║  │              │    changeTargets: {                                ║
║  │              │      "file.jsx": [                                 ║
║  │              │        {pattern, replacement, reason}              ║
║  │              │      ]                                             ║
║  │              │    }                                               ║
║  │              │  }                                                 ║
║  └──────────────┘                                                    ║
║                                                                       ║
║  Key: Finds ALL occurrences across entire codebase                   ║
║  Dependencies: Designer • PromptLoader • LLMClient                   ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                     AGENT #3: CODE WRITER                             ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/codeWriter.js           Model: gpt-5-mini              ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  Mode, Filename, Plan/ChangeTargets, UX Design     ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ├──────► MODE: generate                                      ║
║         │        ┌────────────────────────────────┐                  ║
║         │        │ 1. Load rules (MemoryBank)     │                  ║
║         │        │ 2. Load prompt template        │                  ║
║         │        │ 3. Call LLM with plan          │                  ║
║         │        │ 4. Clean code                  │                  ║
║         │        │ 5. Auto-fix issues             │                  ║
║         │        │ 6. Validate (Validator)        │                  ║
║         │        └────────────────────────────────┘                  ║
║         │                                                             ║
║         └──────► MODE: modify                                        ║
║                  ┌────────────────────────────────┐                  ║
║                  │ 1. Extract color scheme        │                  ║
║                  │ 2. Load rules (MemoryBank)     │                  ║
║                  │ 3. Build change context        │                  ║
║                  │ 4. Call LLM with changes       │                  ║
║                  │ 5. Clean + validate            │                  ║
║                  └────────────────────────────────┘                  ║
║                           │                                           ║
║                           ▼                                           ║
║                  ┌──────────────┐                                    ║
║                  │ OUTPUT       │  Clean, validated React code       ║
║                  └──────────────┘                                    ║
║                                                                       ║
║  Pipeline: MemoryBank → PromptLoader → LLM → Cleanup → AutoFix      ║
║            → ColorExtract → Validator                                ║
║                                                                       ║
║  Dependencies: MemoryBank • PromptLoader • Validator • LLMClient     ║
║                colorExtractor • codeCleanup • autoFix                ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                       AGENT #4: DESIGNER                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/designer.js             Model: gpt-5-nano              ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  App description, Existing code (optional)         ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ├──────► designUX()                                          ║
║         │        • Generate fresh design system                      ║
║         │                                                             ║
║         └──────► extractUXFromCode()                                 ║
║                  • Extract existing design patterns                  ║
║                           │                                           ║
║                           ▼                                           ║
║                  ┌──────────────────────────────┐                    ║
║                  │ OUTPUT: Design System        │                    ║
║                  │                              │                    ║
║                  │  • colorScheme               │                    ║
║                  │    ├─ theme (dark/light)     │                    ║
║                  │    ├─ primary/secondary      │                    ║
║                  │    └─ text classes           │                    ║
║                  │                              │                    ║
║                  │  • designStyle               │                    ║
║                  │    ├─ aesthetic              │                    ║
║                  │    ├─ corners/shadows        │                    ║
║                  │    └─ effects                │                    ║
║                  │                              │                    ║
║                  │  • uxPatterns                │                    ║
║                  │    ├─ user feedback          │                    ║
║                  │    ├─ empty states           │                    ║
║                  │    └─ micro-interactions     │                    ║
║                  │                              │                    ║
║                  │  • layoutStructure           │                    ║
║                  │    ├─ spacing                │                    ║
║                  │    ├─ typography             │                    ║
║                  │    └─ responsive rules       │                    ║
║                  └──────────────────────────────┘                    ║
║                                                                       ║
║  Dependencies: colorExtractor • PromptLoader • LLMClient             ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                      AGENT #5: DEBUGGER                               ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/debugger.js             Model: gpt-5-mini              ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  Error message, Current files, Stack trace         ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────┐        ║
║  │ 3-LAYER DIAGNOSIS                                       │        ║
║  │                                                          │        ║
║  │  Layer 1: Direct Error Parsing                          │        ║
║  │   └─► Parse error message for clues                     │        ║
║  │                                                          │        ║
║  │  Layer 2: Error Categorization                          │        ║
║  │   ├─► BROWSER_INCOMPATIBILITY                           │        ║
║  │   ├─► NULL_ACCESS                                       │        ║
║  │   ├─► INFINITE_RENDER                                   │        ║
║  │   ├─► TYPE_MISMATCH                                     │        ║
║  │   ├─► HOOKS_VIOLATION                                   │        ║
║  │   ├─► SYNTAX_ERROR                                      │        ║
║  │   ├─► ASYNC_UNMOUNT                                     │        ║
║  │   └─► BANNED_PACKAGE                                    │        ║
║  │                                                          │        ║
║  │  Layer 3: Multi-Scanner Analysis                        │        ║
║  │   ├─► scanBrowserCompatibility()                        │        ║
║  │   ├─► scanReactPatterns()                               │        ║
║  │   └─► scanSyntaxIssues()                                │        ║
║  └─────────────────────────────────────────────────────────┘        ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────┐        ║
║  │ ITERATIVE FIX LOOP (Max 3 attempts)                     │        ║
║  │                                                          │        ║
║  │  Attempt N:                                             │        ║
║  │   ├─► Load bug patterns (MemoryBank)                    │        ║
║  │   ├─► Pre-process code (convert require→import)         │        ║
║  │   ├─► Invoke Code Writer (modify mode)                  │        ║
║  │   ├─► Double-check fix                                  │        ║
║  │   ├─► Validate with Validator                           │        ║
║  │   └─► Check: Same error again? (stuck loop detection)   │        ║
║  │                                                          │        ║
║  │   ✓ Success → Record pattern & DONE                     │        ║
║  │   ✗ Failed → Learn & retry (N+1)                        │        ║
║  └─────────────────────────────────────────────────────────┘        ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────────────────────────┐                               ║
║  │ Record to MemoryBank:            │                               ║
║  │  bug-patterns.json               │                               ║
║  │  { type, pattern, fix, file }    │                               ║
║  └──────────────────────────────────┘                               ║
║                                                                       ║
║  Special: Invokes File Scanner for browser incompatibility           ║
║  Dependencies: Code Writer • Validator • MemoryBank • autoFix       ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                      AGENT #6: VALIDATOR                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║  File: agents/validator.js            Model: NONE (Rule-based)       ║
║                                                                       ║
║  ┌──────────────┐                                                    ║
║  │ INPUT        │  Code, Filename, Mode                              ║
║  └──────┬───────┘                                                    ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────┐        ║
║  │ VALIDATION MODES                                        │        ║
║  │                                                          │        ║
║  │  FULL         → All checks                              │        ║
║  │  FAST         → Syntax + basic checks                   │        ║
║  │  SYNTAX_ONLY  → Just syntax validation                  │        ║
║  │  FORMAT_ONLY  → Just format validation                  │        ║
║  └─────────────────────────────────────────────────────────┘        ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────┐        ║
║  │ CHECKS                                                   │        ║
║  │                                                          │        ║
║  │  ✓ Syntax      → Balanced {}, [], ()                    │        ║
║  │  ✓ Format      → import/export statements               │        ║
║  │  ✓ Packages    → Ban external packages (Sandpack)       │        ║
║  │  ✓ Init        → Prevent ReactDOM.render()              │        ║
║  └─────────────────────────────────────────────────────────┘        ║
║         │                                                             ║
║         ▼                                                             ║
║  ┌──────────────┐                                                    ║
║  │ OUTPUT       │  { valid, errors[], warnings[],                    ║
║  │              │    fixes[], code, autoFixed }                      ║
║  └──────────────┘                                                    ║
║                                                                       ║
║  Key: Lightning fast (no LLM) • Auto-fixes when possible             ║
║  Dependencies: NONE                                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Memory System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                       MEMORY BANK SYSTEM                              │
│                    .agent-memory/ directory                           │
│                                                                       │
│  Storage Adapters:                                                    │
│  • Browser ──► localStorage (key: "agent-memory:")                   │
│  • Node.js ──► filesystem (.agent-memory/)                           │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  RULES SYSTEM     │  │ CONTEXT SYSTEM   │  │  LEARNING SYSTEM     │
├───────────────────┤  ├──────────────────┤  ├──────────────────────┤
│                   │  │                  │  │                      │
│  rules/           │  │  context/        │  │  learnings/          │
│  ├─ global.md     │  │  ├─ session-     │  │  └─ bug-patterns.    │
│  └─ project.md    │  │  │   summary.json│  │      json            │
│                   │  │  └─ codebase-    │  │                      │
│  ┌──────────────┐ │  │      map.json    │  │  ┌────────────────┐ │
│  │ Functions:   │ │  │                  │  │  │ Functions:     │ │
│  ├──────────────┤ │  │  ┌─────────────┐ │  │  ├────────────────┤ │
│  │ loadRules()  │ │  │  │ Functions:  │ │  │  │ recordBug      │ │
│  │ loadGlobal() │ │  │  ├─────────────┤ │  │  │  Pattern()     │ │
│  │ loadProject()│ │  │  │ saveSession │ │  │  │ getBug         │ │
│  └──────────────┘ │  │  │  Summary()  │ │  │  │  Patterns()    │ │
│                   │  │  │ loadSession │ │  │  │ getByType()    │ │
│  Used by:         │  │  │  Context()  │ │  │  │ getCommon()    │ │
│  ✓ Planner        │  │  │ clearContext│ │  │  └────────────────┘ │
│  ✓ Code Writer    │  │  │   ()        │ │  │                      │
│  ✓ Debugger       │  │  │ saveCodebase│ │  │  Used by:            │
│                   │  │  │   ()        │ │  │  ✓ Debugger (R/W)    │
│  Injected into:   │  │  │ loadCodebase│ │  │                      │
│  • System prompts │  │  │   ()        │ │  │  Storage:            │
│  • Planning       │  │  └─────────────┘ │  │  • Last 100 patterns │
│  • Code gen       │  │                  │  │  • Timestamped       │
│  • Debugging      │  │  Used by:        │  │  • By file & type    │
│                   │  │  ✓ Orchestrators │  │                      │
└───────────────────┘  │  ✓ Context       │  └──────────────────────┘
                       │    compression   │
                       └──────────────────┘
```

### Memory Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MEMORY USAGE FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐      loadRules()         ┌──────────────────┐
│   PLANNER    ├─────────────────────────►│  Rules Memory    │
│   Agent      │◄─────────────────────────┤  global.md +     │
└──────────────┘  Inject into prompt      │  project.md      │
                                           └──────────────────┘
┌──────────────┐      loadRules()                 │
│ CODE WRITER  ├─────────────────────────►        │
│   Agent      │◄─────────────────────────┤       │
└──────────────┘  Inject into prompt              │
                                                   │
┌──────────────┐      loadRules()                 │
│  DEBUGGER    ├─────────────────────────►        │
│   Agent      │◄─────────────────────────┤       │
└──────┬───────┘  Inject into prompt              │
       │                                           │
       │ recordBugPattern()                        │
       ▼                                           ▼
┌──────────────────┐                    ┌───────────────────┐
│  Bug Patterns    │◄───Future context──│  Session Context  │
│  Learning Memory │                    │  Codebase Map     │
│                  │                    │                   │
│ {                │                    │ Files structure   │
│   type: "...",   │                    │ Dependencies      │
│   pattern: "...",│                    │ Session summary   │
│   fix: "...",    │                    └───────────────────┘
│   file: "...",   │
│   timestamp      │
│ }                │
└──────┬───────────┘
       │
       │ getBugPatterns()
       ▼
┌──────────────────┐
│ Enhanced Future  │
│ Debugging with   │
│ Historical Data  │
└──────────────────┘
```

---

## Complete System Flows

### Flow 1: CREATE NEW (Greenfield Project)

```
┌─────────────────────────────────────────────────────────────────────┐
│ START: User Request "Build a todo app"                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ runOrchestrator()   │
                  │ Detects: greenfield │
                  │ (no current files)  │
                  └──────────┬──────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │    PLAN PHASE                              │
        │    PlanOrchestrator.planFromScratch()     │
        └─────────────────┬──────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌────────┐      ┌─────────┐     ┌──────────┐
    │Planner │      │Designer │     │ Quality  │
    │Agent   │      │Agent    │     │ Scorer   │
    └───┬────┘      └────┬────┘     └────┬─────┘
        │                │                │
        │ Plan           │ UX Design      │ Validation
        └────────────────┴────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │    CODE PHASE                              │
        │    CodeOrchestrator.generateNewCode()     │
        └─────────────────┬──────────────────────────┘
                          │
                          │ For each file in plan:
                          ▼
              ┌──────────────────────┐
              │  Code Writer Agent   │
              │  (generate mode)     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Validator Agent     │
              └──────────┬───────────┘
                         │
                         │ fileOperations[]
                         ▼
        ┌────────────────────────────────────────────┐
        │    TEST PHASE (if runTests=true)          │
        │    SandpackTestOrchestrator               │
        └─────────────────┬──────────────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ Runtime? │
                    └─────┬────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼ Error                 ▼ Success
        ┌──────────────┐        ┌──────────┐
        │ DEBUG PHASE  │        │ COMPLETE │
        │ debugAnd     │        │ Return   │
        │ FixIterative │        │ files    │
        └──────┬───────┘        └──────────┘
               │
               │ Attempt 1-3:
               ▼
        ┌───────────────┐
        │ • Diagnose    │
        │ • Fix         │
        │ • Validate    │
        │ • Learn       │
        └───────┬───────┘
                │
                │ ✓ Success
                ▼
        ┌─────────────────────┐
        │ Record pattern to   │
        │ MemoryBank          │
        │ (bug-patterns.json) │
        └──────────┬──────────┘
                   │
                   ▼
             ┌──────────┐
             │ COMPLETE │
             └──────────┘
```

### Flow 2: MODIFY EXISTING CODE

```
┌──────────────────────────────────────────────────────────────────┐
│ START: "Change button color from blue to red" + Current Files   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ runOrchestrator()   │
                 │ Detects: simple mod │
                 │ Skip planning       │
                 └──────────┬──────────┘
                            │
                            ▼
       ┌─────────────────────────────────────────────┐
       │    CODE PHASE                               │
       │    CodeOrchestrator.modifyExistingCode()   │
       └──────────────────┬──────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Analyzer Agent      │
              │  (MODIFICATION mode) │
              └──────────┬───────────┘
                         │
                         │ Returns:
                         │ • filesToModify: ["App.jsx", "Header.jsx"]
                         │ • changeTargets: {
                         │     "App.jsx": [
                         │       {pattern: "bg-blue-600",
                         │        replacement: "bg-red-600"}
                         │     ]
                         │   }
                         ▼
              ┌─────────────────────────┐
              │  For each file:         │
              │                         │
              │  Code Writer Agent      │
              │  (modify mode)          │
              │    ↓                    │
              │  Validator Agent        │
              └──────────┬──────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Test & Debug        │
              │  (same as Flow 1)    │
              └──────────────────────┘
```

### Flow 3: DEBUG MODE

```
┌──────────────────────────────────────────────────────────────────┐
│ START: Error "require is not defined" + Stack trace             │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ CodeOrchestrator    │
                 │ .fixBugs()          │
                 └──────────┬──────────┘
                            │
                            ▼
       ┌──────────────────────────────────────────────────┐
       │  debugAndFixIterative()                          │
       └───────────────────┬──────────────────────────────┘
                           │
                           ▼
       ┌──────────────────────────────────────────────────┐
       │  LAYER 1: Parse Error                           │
       │  "require is not defined" → Known pattern       │
       └───────────────────┬──────────────────────────────┘
                           │
                           ▼
       ┌──────────────────────────────────────────────────┐
       │  LAYER 2: Categorize                            │
       │  Type: BROWSER_INCOMPATIBILITY                  │
       └───────────────────┬──────────────────────────────┘
                           │
                           ▼
       ┌──────────────────────────────────────────────────┐
       │  LAYER 3: Scan Code                             │
       │  scanBrowserCompatibility()                     │
       │  Found: require() calls in App.jsx              │
       └───────────────────┬──────────────────────────────┘
                           │
                           ▼
       ┌──────────────────────────────────────────────────┐
       │  ATTEMPT 1                                      │
       │  ├─ Load historical patterns (MemoryBank)       │
       │  ├─ Pre-process: require() → import             │
       │  ├─ Code Writer: Generate fix                   │
       │  ├─ Double-check: No reintroduced bugs          │
       │  └─ Validator: Check syntax                     │
       └───────────────────┬──────────────────────────────┘
                           │
                           ▼
                      ┌─────────┐
                      │Success? │
                      └────┬────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   ▼ Yes           ▼ No
           ┌──────────────┐  ┌──────────────┐
           │ Record to    │  │ Learn from   │
           │ MemoryBank:  │  │ error        │
           │              │  │              │
           │ {            │  │ ATTEMPT 2    │
           │  type,       │  │ (enhanced    │
           │  pattern,    │  │  prompt)     │
           │  fix,        │  │              │
           │  file        │  │ Still fail?  │
           │ }            │  │ ATTEMPT 3    │
           └──────┬───────┘  └──────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                      ┌─────────┐
                      │ DONE    │
                      │ Return  │
                      │ fixed   │
                      │ files   │
                      └─────────┘
```

---

## Agent Interaction Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT INTERACTION MATRIX                         │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Orchestrators  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌────────┐         ┌─────────┐        ┌──────────┐
    │Planner │         │Analyzer │        │Code      │
    │        │         │         │        │Writer    │
    └───┬────┘         └────┬────┘        └─────┬────┘
        │                   │                    │
        │ Uses:             │ Uses:              │ Uses:
        │                   │                    │
        ▼                   ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌────────────────┐
│ MemoryBank    │   │ Designer      │   │ MemoryBank     │
│ PromptLoader  │   │ PromptLoader  │   │ PromptLoader   │
│ LLMClient     │   │ LLMClient     │   │ Validator      │
└───────────────┘   └───────────────┘   │ colorExtractor │
                                        │ codeCleanup    │
                                        │ autoFix        │
                                        │ LLMClient      │
                                        └────────────────┘

    ┌──────────┐         ┌──────────┐
    │Designer  │         │Debugger  │
    │          │         │          │
    └─────┬────┘         └─────┬────┘
          │                    │
          │ Uses:              │ Uses:
          │                    │
          ▼                    ▼
┌──────────────────┐   ┌────────────────────┐
│ colorExtractor   │   │ File Scanner       │
│ PromptLoader     │   │ Code Writer        │
│ LLMClient        │   │ Validator          │
└──────────────────┘   │ MemoryBank (R/W)   │
                       │ autoFix            │
                       └────────────────────┘

         ┌──────────┐
         │Validator │
         │          │
         └─────┬────┘
               │
               │ Uses: NONE (rule-based)
               ▼
         ┌──────────┐
         │ No LLM   │
         │ Fast     │
         └──────────┘
```

### Model Routing Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MODEL ALLOCATION                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐              ┌─────────────┐                     │
│  │  Planner    │─────────────►│ gpt-5-mini  │ ─┐                  │
│  └─────────────┘              └─────────────┘  │                  │
│                                                 │ Reasoning-heavy  │
│  ┌─────────────┐              ┌─────────────┐  │                  │
│  │Code Writer  │─────────────►│ gpt-5-mini  │ ─┘                  │
│  └─────────────┘              └─────────────┘                     │
│                                                                     │
│  ┌─────────────┐              ┌─────────────┐  ┐                  │
│  │  Debugger   │─────────────►│ gpt-5-mini  │ ─┤ Complex tasks   │
│  └─────────────┘              └─────────────┘  ┘                  │
│                                                                     │
│  ┌─────────────┐              ┌─────────────┐  ┐                  │
│  │  Analyzer   │─────────────►│ gpt-5-nano  │ ─┤ Lightweight     │
│  └─────────────┘              └─────────────┘  │                  │
│                                                 │                  │
│  ┌─────────────┐              ┌─────────────┐  │                  │
│  │  Designer   │─────────────►│ gpt-5-nano  │ ─┘                  │
│  └─────────────┘              └─────────────┘                     │
│                                                                     │
│  ┌─────────────┐              ┌─────────────┐                     │
│  │  Validator  │─────────────►│  NO MODEL   │ ─── Rule-based     │
│  └─────────────┘              │  (rules)    │                     │
│                               └─────────────┘                     │
│                                                                     │
│  Fallback Chain:                                                   │
│  gpt-5-mini ──► gpt-4o                                            │
│  gpt-5-nano ──► gpt-4o-mini                                       │
│                                                                     │
│  Environment:                                                      │
│  USE_GPT5=true          Enable GPT-5 models                       │
│  PRODUCTION_MODE=true   Upgrade all to gpt-5-mini                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Learning Across Sessions

```
╔═══════════════════════════════════════════════════════════════════╗
║                     SESSION LEARNING FLOW                         ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  SESSION 1: First Todo App                                       ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ User: "Build a todo app"                                │    ║
║  │   ↓                                                      │    ║
║  │ Memory: No rules, no patterns (fresh start)             │    ║
║  │   ↓                                                      │    ║
║  │ Code generation happens                                 │    ║
║  │   ↓                                                      │    ║
║  │ Bug: "require is not defined"                           │    ║
║  │   ↓                                                      │    ║
║  │ Debugger fixes: require() → import                      │    ║
║  │   ↓                                                      │    ║
║  │ ✓ Record pattern to .agent-memory/learnings/           │    ║
║  │   bug-patterns.json                                     │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  SESSION 2: Weather App (with learning)                          ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ User: "Build a weather app"                             │    ║
║  │   ↓                                                      │    ║
║  │ Memory: Loads bug patterns from Session 1               │    ║
║  │   ↓                                                      │    ║
║  │ Code generation: AVOIDS require() from memory           │    ║
║  │   ↓                                                      │    ║
║  │ If similar bug occurs:                                  │    ║
║  │   • Debugger loads historical patterns                  │    ║
║  │   • Uses previous fix as context                        │    ║
║  │   • FASTER resolution (30% reduction in attempts)       │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  SESSION 3: Custom Rules                                         ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ User adds to .agent-memory/rules/project.md:            │    ║
║  │ "Always use Tailwind CSS with dark mode"                │    ║
║  │   ↓                                                      │    ║
║  │ Next code generation:                                   │    ║
║  │   • Planner loads rules                                 │    ║
║  │   • Injects into system prompt                          │    ║
║  │   • ALL code follows rule automatically                 │    ║
║  │   • Consistent dark mode across all components          │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  RESULT: Self-improving system                                   ║
║  • First encounter → Solve problem                               ║
║  • Next encounter → Use previous solution                        ║
║  • Memory grows → Better future solutions                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## File Structure (Visual Tree)

```
vibe/blank-space/
│
├── src/services/
│   │
│   ├── orchestrator.js ──────────────────┐ [MAIN ENTRY]
│   │                                     │
│   ├── orchestrators/ ────────────────┐  │
│   │   ├── planOrchestrator.js        │  │ [ORCHESTRATORS]
│   │   ├── codeOrchestrator.js        │──┘
│   │   ├── sandpackTestOrchestrator.js│
│   │   ├── testOrchestrator.js        │
│   │   └── qualityScorer.js           │
│   │                                   │
│   ├── agents/ ────────────────────────┼───┐ [6 AGENTS]
│   │   ├── planner.js                 │   │
│   │   ├── analyzer.js                │   │
│   │   ├── codeWriter.js              │   │
│   │   ├── designer.js                │   │
│   │   ├── debugger.js                │   │
│   │   └── validator.js               │   │
│   │                                   │   │
│   ├── config/ ────────────────────────┼───┼───┐ [CONFIG]
│   │   ├── modelConfig.js             │   │   │
│   │   └── agentConfig.js             │   │   │
│   │                                   │   │   │
│   └── utils/ ─────────────────────────┼───┼───┼───┐ [UTILITIES]
│       │                               │   │   │   │
│       ├── memory/                     │   │   │   │
│       │   └── MemoryBank.js ──────────┼───┼───┘   │ [MEMORY]
│       │                               │   │       │
│       ├── prompts/                    │   │       │
│       │   └── PromptLoader.js ────────┼───┘       │ [PROMPTS]
│       │                               │           │
│       ├── llm/                        │           │
│       │   ├── llmClient.js ───────────┘           │ [LLM]
│       │   ├── openaiClient.js                     │
│       │   └── conversationLogger.js               │
│       │                                            │
│       ├── code/                                    │
│       │   ├── codeCleanup.js ──────────────────────┘ [CODE UTILS]
│       │   ├── autoFix.js
│       │   └── colorExtractor.js
│       │
│       ├── validation/
│       │   ├── fixValidator.js
│       │   └── runtimeValidation.js
│       │
│       ├── versionControl/
│       │   └── VersionControl.js
│       │
│       ├── compression/
│       │   └── ContextCompressor.js
│       │
│       └── testing/
│           ├── conversationReplayer.js
│           └── performanceTracker.js
│
└── .agent-memory/ ───────────────────────────┐ [PERSISTENT MEMORY]
    │                                         │
    ├── rules/                                │
    │   ├── global.md ──────────────────► All projects
    │   └── project.md ─────────────────► This project
    │                                         │
    ├── context/                              │
    │   ├── session-summary.json ────────► Sessions
    │   └── codebase-map.json ──────────► Structure
    │                                         │
    ├── learnings/                            │
    │   └── bug-patterns.json ───────────► Bug fixes
    │                                         │
    └── prompts/                              │
        ├── planner.md ──────────────────► Templates
        ├── codeWriterGenerate.md             │
        ├── codeWriterModify.md               │
        └── designer.md                       │
```

---

## Key Architectural Patterns (Visual)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PATTERN 1: Two-Orchestrator Architecture                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         ┌────────────────┐              ┌────────────────┐        │
│         │  PLAN          │              │  CODE          │        │
│         │  Orchestrator  │─────────────►│  Orchestrator  │        │
│         └────────────────┘              └────────────────┘        │
│                │                               │                   │
│                │ Agents:                       │ Agents:           │
│                │ • Planner                     │ • Code Writer     │
│                │ • Designer                    │ • Analyzer        │
│                │ • Analyzer                    │ • Debugger        │
│                │                               │ • Validator       │
│                │                               │                   │
│         Separation of Concerns: Planning vs. Execution             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PATTERN 2: Memory-Driven Intelligence                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                   │
│  │  MemoryBank │                                                   │
│  └──────┬──────┘                                                   │
│         │                                                           │
│         ├─────────────┬─────────────┬─────────────┐               │
│         ▼             ▼             ▼             ▼               │
│    ┌────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐          │
│    │Planner │   │  Code   │   │Debugger │   │Context │          │
│    │        │   │ Writer  │   │         │   │Compress│          │
│    └────────┘   └─────────┘   └────┬────┘   └────────┘          │
│                                     │                              │
│                                     │ Write                        │
│                                     ▼                              │
│                              ┌─────────────┐                       │
│                              │  Learning   │                       │
│                              │  Patterns   │                       │
│                              └─────────────┘                       │
│                                                                     │
│  Rules → Inject into prompts → Better generation                   │
│  Patterns → Learn from bugs → Faster debugging                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PATTERN 3: Iterative Learning Loop                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         ┌─────────────────┐                                        │
│         │  Try Fix        │                                        │
│         └────────┬────────┘                                        │
│                  │                                                  │
│                  ▼                                                  │
│         ┌─────────────────┐                                        │
│         │  Validate       │                                        │
│         └────────┬────────┘                                        │
│                  │                                                  │
│          ┌───────┴───────┐                                         │
│          │               │                                         │
│          ▼ Success       ▼ Failed                                  │
│    ┌──────────┐    ┌──────────────┐                               │
│    │ Record   │    │ Learn from   │                               │
│    │ Pattern  │    │ Error        │                               │
│    └────┬─────┘    └──────┬───────┘                               │
│         │                 │                                        │
│         │                 ▼                                        │
│         │          ┌─────────────┐                                 │
│         │          │ Enhance     │                                 │
│         │          │ Prompt      │                                 │
│         │          └──────┬──────┘                                 │
│         │                 │                                        │
│         │                 ▼                                        │
│         │          ┌─────────────┐                                 │
│         │          │ Retry (N+1) │                                 │
│         │          └──────┬──────┘                                 │
│         │                 │                                        │
│         │          (Max 3 attempts)                                │
│         │                 │                                        │
│         └─────────────────┘                                        │
│                                                                     │
│  Stuck loop detection: Same error twice → Break                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PATTERN 4: Agent Delegation (AutoGen Style)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         ┌─────────────────┐                                        │
│         │   Debugger      │                                        │
│         │   Agent         │                                        │
│         └────────┬────────┘                                        │
│                  │                                                  │
│                  │ Detects: Browser incompatibility                │
│                  │                                                  │
│                  ├──────────────┬─────────────────────┐           │
│                  │              │                     │           │
│                  ▼              ▼                     ▼           │
│           ┌──────────┐   ┌────────────┐      ┌──────────┐       │
│           │  File    │   │  Code      │      │ Validator│       │
│           │  Scanner │   │  Writer    │      │          │       │
│           │  Agent   │   │  Agent     │      │  Agent   │       │
│           └──────────┘   └────────────┘      └──────────┘       │
│                  │              │                     │           │
│                  └──────────────┴─────────────────────┘           │
│                                  │                                 │
│                                  ▼                                 │
│                          ┌──────────────┐                          │
│                          │  Coordinated │                          │
│                          │  Solution    │                          │
│                          └──────────────┘                          │
│                                                                     │
│  Agents use other agents as tools                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary Dashboard

```
╔═══════════════════════════════════════════════════════════════════════╗
║                   BINA ARCHITECTURE SUMMARY                           ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  🎯 GOAL: Transform prompts → Production-ready React apps             ║
║                                                                       ║
║  📊 COMPONENTS:                                                       ║
║     • 2 Orchestrators (Plan, Code)                                    ║
║     • 6 Specialized Agents                                            ║
║     • 3 Memory Systems (Rules, Context, Learning)                     ║
║     • 4 Workflow Patterns (Create, Modify, Refactor, Debug)           ║
║                                                                       ║
║  🤖 AGENTS:                                                           ║
║     ┌────────────────┬─────────────┬──────────────────┐             ║
║     │ Agent          │ Model       │ Purpose          │             ║
║     ├────────────────┼─────────────┼──────────────────┤             ║
║     │ Planner        │ gpt-5-mini  │ Create plans     │             ║
║     │ Analyzer       │ gpt-5-nano  │ Understand code  │             ║
║     │ Code Writer    │ gpt-5-mini  │ Gen/modify code  │             ║
║     │ Designer       │ gpt-5-nano  │ UX systems       │             ║
║     │ Debugger       │ gpt-5-mini  │ Fix bugs         │             ║
║     │ Validator      │ None        │ Rule checking    │             ║
║     └────────────────┴─────────────┴──────────────────┘             ║
║                                                                       ║
║  💾 MEMORY:                                                           ║
║     Rules:    Persistent coding standards                             ║
║     Context:  Session history & codebase cache                        ║
║     Learning: Bug patterns (last 100, timestamped)                    ║
║                                                                       ║
║  🔄 WORKFLOW:                                                         ║
║     User Prompt → Plan → Code → Test → Debug (iterate) → Done        ║
║                                                                       ║
║  🧠 LEARNING:                                                         ║
║     Session 1: Solve new problems                                     ║
║     Session 2: Apply learned solutions                                ║
║     Session N: Continuous improvement                                 ║
║                                                                       ║
║  ✨ KEY FEATURES:                                                     ║
║     • Autonomous agent collaboration                                  ║
║     • Persistent memory across sessions                               ║
║     • Iterative debugging (max 3 attempts)                            ║
║     • Multi-layer error diagnosis                                     ║
║     • Self-improving bug fixes                                        ║
║     • Externalized prompt templates                                   ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

**Document Version:** 1.1
**Last Updated:** 2025-10-26
**Maintainer:** Patrick Li

