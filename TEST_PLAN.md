# Test Plan

## Overview
This document outlines the test coverage needed for the blank-space codebase.

---

## Unit Tests Needed

### 1. Prebuild Artifacts (`src/data/prebuildArtifacts.js`)
- [ ] `getPrebuildById()` returns correct artifact by ID
- [ ] `getPrebuildById()` returns undefined for invalid ID
- [ ] `getAllPrebuilds()` returns all artifacts
- [ ] All artifacts have required fields (id, name, description, icon, category, files)
- [ ] All artifact file contents are valid JSX strings

### 2. AppStorePanel (`src/components/appstore/AppStorePanel.jsx`)
- [ ] Renders when `isAppStoreOpen` is true
- [ ] Does not render when `isAppStoreOpen` is false
- [ ] `getCategoryLabel()` returns correct labels for all categories
- [ ] `getTechTags()` extracts tags from descriptions correctly
- [ ] Category filtering works (games, apps, today)
- [ ] App detail view opens when clicking an app
- [ ] Install button calls `createArtifact` with correct params
- [ ] Back button returns to list view
- [ ] Close button calls `closeAppStore`

### 3. Individual Artifact Components
Each artifact should be tested for:
- [ ] Renders without crashing
- [ ] Initial state is correct
- [ ] User interactions work (clicks, drags, inputs)

#### Specific Artifacts:
| Artifact | Key Tests |
|----------|-----------|
| `animatedCards` | Card selection, drag constraints, AnimatePresence |
| `dataFetcher` | Fetch success/error states, loading skeleton, retry |
| `interactiveDashboard` | Tab switching, chart rendering, stat cards |
| `kanbanBoard` | Drag and drop between columns, task counts |
| `musicPlayer` | Play/pause, track switching, progress updates |
| `weatherApp` | Temperature unit conversion (C/F), forecast display |

---

## Integration Tests Needed

### App Store Flow
- [ ] User can browse artifacts by category
- [ ] User can view artifact details
- [ ] User can install an artifact
- [ ] Installed artifact appears in workspace

### Preview System
- [ ] Artifact code renders in preview iframe
- [ ] React hooks work correctly in preview
- [ ] Framer Motion animations load via CDN
- [ ] Error boundary catches render failures

---

## Test Infrastructure

### Recommended Setup
```
test/
├── unit/
│   ├── prebuildArtifacts.test.js
│   ├── AppStorePanel.test.js
│   └── artifacts/
│       ├── animatedCards.test.js
│       ├── dataFetcher.test.js
│       ├── interactiveDashboard.test.js
│       ├── kanbanBoard.test.js
│       ├── musicPlayer.test.js
│       └── weatherApp.test.js
└── integration/
    └── appStoreFlow.test.js
```

### Dependencies
- Jest or Vitest for test runner
- React Testing Library for component tests
- MSW for mocking API calls (dataFetcher tests)

---

## Priority

1. **High**: Prebuild artifacts validation (prevents broken apps in store)
2. **High**: AppStorePanel install flow (core user journey)
3. **Medium**: Individual artifact render tests
4. **Low**: Full integration tests
