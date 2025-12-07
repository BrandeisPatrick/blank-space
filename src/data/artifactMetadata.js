/**
 * Artifact Metadata Registry (Lightweight)
 *
 * Contains only the metadata needed to display artifacts in the App Store.
 * Full artifact code is lazy-loaded only when user clicks "GET".
 */

export const ARTIFACT_METADATA = [
  {
    id: "calendar-todo",
    name: "Calendar",
    description: "A beautiful calendar with integrated todo list. Features month navigation, date selection, and task management with smooth animations.",
    icon: "calendar",
    category: "apps",
  },
  {
    id: "strategy-game",
    name: "War Grid",
    description: "A tactical strategy game with unit placement, turn-based combat, and AI opponent. Features hex-grid movement and multiple unit types.",
    icon: "gamepad",
    category: "games",
  },
  {
    id: "retro-typer",
    name: "Retro Typer",
    description: "A nostalgic typing experience with retro CRT effects, typewriter sounds simulation, and vintage aesthetics.",
    icon: "terminal",
    category: "apps",
  },
  {
    id: "cronus",
    name: "Cronus Timer",
    description: "An elegant productivity timer with pomodoro technique support, session tracking, and minimalist design.",
    icon: "clock",
    category: "apps",
  },
  {
    id: "animated-cards",
    name: "Animated Cards",
    description: "Interactive cards showcasing Framer Motion capabilities: hover scale effects, click interactions, draggable elements, and AnimatePresence for smooth enter/exit animations.",
    icon: "sparkles",
    category: "demos",
  },
  {
    id: "data-fetcher",
    name: "API Data Fetcher",
    description: "A user directory that fetches data from JSONPlaceholder API. Demonstrates native fetch() with async/await, skeleton loading states, and error handling.",
    icon: "globe",
    category: "demos",
  },
  {
    id: "interactive-dashboard",
    name: "Interactive Dashboard",
    description: "An analytics dashboard with animated bar charts, line graphs, and donut charts built entirely with pure SVG - no chart libraries needed.",
    icon: "chart",
    category: "demos",
  },
  {
    id: "kanban-board",
    name: "Kanban Board",
    description: "A project management board with draggable task cards, priority tags, and progress tracking. Built with native HTML5 drag and drop.",
    icon: "layout",
    category: "demos",
  },
  {
    id: "music-player",
    name: "Music Player",
    description: "A sleek music player with rotating album art, animated SVG progress ring, real-time equalizer visualization, and playlist management.",
    icon: "music",
    category: "demos",
  },
  {
    id: "weather-app",
    name: "Weather App",
    description: "A beautiful weather app featuring custom SVG weather icons, animated floating clouds, temperature unit conversion, and glassmorphism cards.",
    icon: "sun",
    category: "demos",
  },
];

/**
 * Lazy load the full artifact by ID
 * Only loads the code when user clicks "GET"
 */
export const loadArtifactById = async (id) => {
  const loaders = {
    "calendar-todo": () => import("./artifacts/calendarTodo").then(m => m.calendarTodoArtifact),
    "strategy-game": () => import("./artifacts/strategyGame").then(m => m.strategyGameArtifact),
    "retro-typer": () => import("./artifacts/retroTyper").then(m => m.retroTyperArtifact),
    "cronus": () => import("./artifacts/cronus").then(m => m.cronusArtifact),
    "animated-cards": () => import("./artifacts/animatedCards").then(m => m.animatedCardsArtifact),
    "data-fetcher": () => import("./artifacts/dataFetcher").then(m => m.dataFetcherArtifact),
    "interactive-dashboard": () => import("./artifacts/interactiveDashboard").then(m => m.interactiveDashboardArtifact),
    "kanban-board": () => import("./artifacts/kanbanBoard").then(m => m.kanbanBoardArtifact),
    "music-player": () => import("./artifacts/musicPlayer").then(m => m.musicPlayerArtifact),
    "weather-app": () => import("./artifacts/weatherApp").then(m => m.weatherAppArtifact),
  };

  const loader = loaders[id];
  if (!loader) {
    throw new Error(`Unknown artifact ID: ${id}`);
  }

  return await loader();
};

/**
 * Get metadata by ID (synchronous, no code loaded)
 */
export const getMetadataById = (id) => {
  return ARTIFACT_METADATA.find(artifact => artifact.id === id);
};
