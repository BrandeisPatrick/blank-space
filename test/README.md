# Test Suite

Tests for verifying AI code generation behavior.

## Quick Start

```bash
# Run all prompt tests
OPENAI_API_KEY=your_key node test/unit/prompts/framerMotion.test.js
OPENAI_API_KEY=your_key node test/unit/prompts/appGeneration.test.js
```

## Structure

```
test/
├── config/
│   └── testConfig.js           # Test configuration
├── utils/
│   ├── testHelpers.js          # Shared helpers
│   └── hybridTestHelpers.js    # Hybrid test helpers
└── unit/
    └── prompts/
        ├── framerMotion.test.js    # Framer Motion pattern tests
        └── appGeneration.test.js   # App generation tests
```

## Tests

### 1. Framer Motion Test (`framerMotion.test.js`)

Tests if AI correctly uses Framer Motion from **generic prompts** (not explicit instructions).

| Test | Prompt | Checks For |
|------|--------|------------|
| Hover/Tap | "Make a button that feels interactive..." | `whileHover`, `whileTap` |
| AnimatePresence | "Create a modal that appears smoothly..." | `AnimatePresence`, `exit` |
| Staggered List | "Items fade in one after another..." | `delay`, `index` |
| Draggable | "Make a card I can drag around..." | `drag`, `dragConstraints` |
| Layout | "Items animate when reordered..." | `layout` |

**Last Run:** 5/5 passed (1 retry on AnimatePresence)

### 2. App Generation Test (`appGeneration.test.js`)

Tests if AI generates complete apps from simple prompts.

| Category | Prompts |
|----------|---------|
| Simple | Tip calculator, Countdown timer, Color palette |
| Interactive | Quiz game, Typing test |
| Utility | Unit converter, Password generator |
| Fun | Magic 8-ball, Virtual pet |
| Games | Memory game, Whack-a-mole |
| Visual | Weather dashboard, Solar system |

**Last Run:** 9/13 passed

## Known Issues

| Issue | Impact | Defense |
|-------|--------|---------|
| AI imports `framer-motion` | Low | PreviewPanel strips all imports |
| AI imports `React from "react"` | Low | PreviewPanel strips all imports |
| Some test patterns too strict | Low | Fix test or accept alternatives |

**Why low impact?** `PreviewPanel.jsx` line 24 strips imports:
```js
.replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')
```

## Next Steps

- [ ] Strengthen prompts to reduce import errors
- [ ] Fix test patterns (accept `setInterval` OR `setTimeout`)
- [ ] Add success rate tracking (report retries)

---

**Last Updated:** 2025-12-06
