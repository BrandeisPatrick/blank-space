# Global Agent Rules

Last updated: 2025-10-25

## Browser/Sandpack Environment Constraints

### Critical Rules
- **NEVER use `require()`** - Only ES6 `import` statements work in browser
- **NO Node.js APIs** - `process`, `fs`, `__dirname`, `__filename`, `module.exports` are not available
- **NO external npm packages** - Only React/ReactDOM are available in Sandpack
- **NO navigation with `<a href="#">`** - Causes white screen in Sandpack iframe (use `<button onClick={}>` instead)

### Banned Packages in Sandpack
- axios (use native `fetch()` instead)
- lodash (use native array methods)
- moment (use native `Date` or `Intl.DateTimeFormat`)
- uuid (use `crypto.randomUUID()`)
- prop-types (not needed with modern React)

## React Best Practices

### State Management
- ✅ Use immutable updates: `setArr([...arr, item])`
- ❌ Never mutate state: `arr.push(item)`
- ✅ Functional updates when depending on previous state: `setCount(c => c + 1)`

### Event Handlers
- ✅ Pass function reference: `onClick={handleClick}` or `onClick={() => handleClick(id)}`
- ❌ Never call immediately: `onClick={handleClick()}`

### Hooks Rules
- ✅ Always call hooks at top level (not in conditions/loops)
- ✅ Add cleanup for async operations in useEffect:
  ```javascript
  useEffect(() => {
    let mounted = true;
    fetchData().then(d => mounted && setData(d));
    return () => { mounted = false; };
  }, []);
  ```

### Forms
- Always use `e.preventDefault()` in form submit handlers
- Use controlled components with `value` and `onChange`

## Code Quality Standards

### File Organization
- Components → `components/` folder (e.g., `components/TodoList.jsx`)
- Hooks → `hooks/` folder (e.g., `hooks/useLocalStorage.js`)
- Utilities → `utils/` folder
- Keep components under ~100 lines (split if larger)

### Naming Conventions
- Components: PascalCase (e.g., `TodoItem.jsx`)
- Hooks: camelCase starting with "use" (e.g., `useCounter.js`)
- Utilities: camelCase (e.g., `formatDate.js`)

### Import Statements
- Use explicit file extensions in imports: `import X from './component.jsx'`
- Group imports: React first, then libraries, then local files

## Testing Requirements

### Validation Strategy
- All code must pass static analysis (browser compatibility, syntax)
- Runtime validation in Sandpack (5 second error capture)
- Maximum 3 debug cycles per generation

### Common Error Patterns to Avoid
1. Browser incompatibility (Node.js APIs)
2. Sandpack navigation issues (href="#")
3. React anti-patterns (state mutation, hook violations)
4. Syntax errors (unmatched brackets)
5. Missing error boundaries

## Design Principles

### UX Guidelines
- Provide user feedback (confirmations, notifications, status messages)
- Handle empty states with helpful messages
- Use semantic HTML (`<button>` for actions, not `<a>`)
- Accessible: proper ARIA labels, keyboard navigation

### Component Structure
- Separate concerns (logic, presentation, styling)
- Reusable components over duplication
- Props over global state when possible

## Memory & Learning

### Bug Pattern Recording
When a bug is fixed, record:
- Bug type (e.g., browser-incompatible, state-mutation)
- Pattern that caused it
- Fix that resolved it
- File where it occurred

### Session Continuity
- Summarize conversations every 20 turns
- Store summaries in `context/session-summary.json`
- Reload context at session start

## Orchestration Strategy

### Flow
1. **PLAN** - Create detailed plan (if needed)
2. **CODE** - Generate/modify files
3. **TEST** - Validate in Sandpack (static + runtime)
4. **DEBUG** - Fix errors iteratively (up to 3 cycles)
5. **RETURN** - Deliver working code

### When to Plan
- New empty project
- Complex requests (refactor, redesign, reorganize)
- Multiple components/features
- Not needed for simple modifications

### Debug Strategy
- Use error-first categorization
- Scan for specific patterns based on error type
- Apply minimal, surgical fixes
- Learn from previous failures (iterative)
- Pre-process code to prevent LLM from reintroducing bugs

## Updates & Versioning

This file is updated as agents learn new patterns and best practices.

**Change Log:**
- 2025-10-25: Initial global rules created with TEST → DEBUG loop integration
