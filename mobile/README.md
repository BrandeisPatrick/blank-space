# OpenAgent Mobile

Expo + React Native client. Shares contexts, services, and the unified style
system with the web app under `../src/`.

## Stack

- Expo Router (file-based routing in `app/`)
- React Native 0.81 + React 19
- expo-blur (native iOS glass), react-native-svg (icons), react-native-reanimated
- AsyncStorage for persisted user settings
- Shared `getTheme(mode)` from `@shared/styles/theme` drives every surface

## Folder layout

```
mobile/
├── app/                       Expo Router screens
│   ├── _layout.tsx            Root providers + appearance sync effect
│   ├── (tabs)/                Tab routes
│   │   ├── index.tsx          Chat
│   │   ├── apps.tsx           Sandpack app grid
│   │   └── files.tsx          File browser
│   └── modal.tsx              Demo modal
├── components/
│   ├── chat/                  Header, Composer, MessageList, SideDrawer, DateGroup
│   ├── ui/                    Reusable primitives (see below)
│   ├── icons/                 Custom SVG (Starburst, GhostIcon, animated nav)
│   ├── settings/              SettingsSheet
│   ├── preview/               PreviewSheet (Sandpack)
│   ├── editor/                MonacoEditorSheet
│   └── dom/                   Wrappers for web-only DOM libraries
├── constants/                 Static data (placeholder user, suggestions, demo fixtures)
├── hooks/                     useThemeColor, useColorScheme shims
└── lib/                       action-sheets, conversations, settings store
```

`components/ui/`:
- `ThemedText`, `ThemedView` — themed text + view primitives
- `IconSymbol` — SF Symbols on iOS, MaterialIcons fallback elsewhere
- `CircleButton`, `ScreenHeader`, `SheetHeader` — small reusable affordances
- `Collapsible` — expandable section

## Path aliases

- `@/*` → `./` (mobile project root)
- `@shared/*` → `../src/*` (web codebase shared with mobile)

Both work for TypeScript and Metro (auto-resolved from `tsconfig.json`).

## Theme system

Every color, typography, opacity, and shadow flows through one funnel:

```ts
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

const { mode } = useTheme();           // 'light' | 'dark'
const theme = getTheme(mode);
```

Tokens exposed on `theme`:

- `colors.{bg, text, accent, status, border}` — palette
- `typography.text.{display, title1, title2, title3, headline, body, callout, subhead, footnote, caption}` — variants consumed by `<ThemedText variant="...">`
- `tone.{primary, secondary, tertiary, accent, link, inverse, error}` — semantic text colors via `<ThemedText tone="...">`
- `surfaces.glass.{fill, fillStrong, border, borderStrong, fallback, blurTint}` — native translucent surfaces
- `surfaces.button.primary.{bg, fg}` — high-contrast CTA
- `effects.overlay.{dark, light}` — modal scrims
- `opacity.{pressed, pressedStrong, disabled}` — press states
- `nativeShadow.{sm, md, lg}` — drop-shadow objects; spread inline:
  `style={[styles.x, theme.nativeShadow.md]}`

## User settings

`useAppSettings()` from `lib/settings.ts` persists two values in AsyncStorage at
key `openagent.settings.v1`:

- `appearance` — `'light' | 'dark' | 'system'` (default `'system'`)
- `hapticsEnabled` — `boolean` (default `true`, currently visual-only)

The launch-sync effect in `app/_layout.tsx` reads `appearance`, computes the
resolved mode (using `useColorScheme()` from `react-native` for `'system'`),
and calls `setMode()` on the shared `ThemeContext`. OS appearance changes are
followed live while the preference is `'system'`.

## Run locally

```bash
npx expo run:ios          # build + launch in iOS simulator
npx expo start            # Metro dev server only (re-attach a built app)
```

Toggle Fast Refresh and reload the JS bundle with shake → Reload.

## TypeScript

`tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, and `forceConsistentCasingInFileNames`. Run
`./node_modules/.bin/tsc --noEmit` before opening a PR.
