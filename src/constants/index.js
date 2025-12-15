/**
 * Application-wide constants
 * Centralized configuration for routes, UI elements, and timing values
 */

/**
 * Panel identifiers
 * Used for panel toggling and state management
 */
export const PANELS = {
  CHAT: 'chat',
  CODE: 'code',
  PREVIEW: 'preview'
};

/**
 * Route identifiers
 * Used for navigation and route state management
 */
export const ROUTES = {
  LANDING: 'landing',
  SIGNIN: 'signin',
  SIGNUP: 'signup',
  STUDIO: 'studio'
};

/**
 * Timing and performance constants
 * Milliseconds and other temporal values
 */
export const TIMING = {
  // Error deduplication window
  ERROR_DEDUP_WINDOW_MS: 2000,

  // Maximum number of recent errors to track
  MAX_RECENT_ERRORS: 50,

  // Number of old errors to remove when cleanup triggers
  ERROR_CLEANUP_COUNT: 25,

  // Delay per file during generation
  FILE_GENERATION_DELAY_MS: 100,

  // Thinking process completion delay
  THINKING_COMPLETION_DELAY_MS: 500,

  // Rate limit check interval
  MIDNIGHT_CHECK_INTERVAL_MS: 60000,

  // Thinking panel auto-collapse delay
  THINKING_COLLAPSE_DELAY_MS: 3000
};

/**
 * Text content constants
 * Messages and labels used throughout the application
 */
export const MESSAGES = {
  NO_ARTIFACTS: 'No Artifacts Yet',
  NO_ARTIFACT_DESC: 'Create a new artifact to start building your React application, or load an example from the templates.',
  UNTITLED_PROJECT: 'Untitled Project',
  NO_ARTIFACT_SELECTED: 'No Artifact Selected',
  RATE_LIMIT_50: (used, limit, remaining) =>
    `ℹ️ You've used ${used} of your ${limit} daily requests.\n${remaining} requests remaining today.`,
  RATE_LIMIT_75: (remaining) =>
    `⚠️ Warning: You've used 75% of your daily quota.\nOnly ${remaining} requests remaining. Resets at midnight UTC.`,
  RATE_LIMIT_EXCEEDED: (used, limit) =>
    `❌ Daily limit reached (${used}/${limit} requests used).\nYour quota will reset at midnight UTC.\nPlease try again later.`
};

/**
 * Button and UI labels
 */
export const LABELS = {
  CHAT: 'Chat',
  CODE: 'Code',
  PREVIEW: 'Preview',
  HOME: 'Home',
  ARTIFACTS: 'Artifacts',
  MANAGE_ARTIFACTS: 'Manage Artifacts',
  CREATE_NEW_ARTIFACT: 'Create New Artifact',
  CLICK_TO_RENAME: 'Click to rename',
  SIGN_IN: 'Sign In',
  NO_ARTIFACT_SELECTED: 'No Artifact Selected'
};

/**
 * Layout dimensions and spacing
 */
export const LAYOUT = {
  // Landing page specific
  LANDING_MAX_WIDTH: '1200px',
  LANDING_SUGGESTION_PILLS_BOTTOM_OFFSET: 160,
  LANDING_MAIN_PADDING_BOTTOM: '120px',

  // Chat input dimensions (shared with suggestion pills)
  CHAT_INPUT_WIDTH: '90%',
  CHAT_INPUT_MAX_WIDTH: '800px',
  CHAT_INPUT_BORDER_RADIUS: '36px',
  CHAT_INPUT_Z_INDEX: 40,

  // Grid dimensions
  ARTIFACT_GRID_MIN_MOBILE: '140px',
  ARTIFACT_GRID_MIN_DESKTOP: '180px',

  // Z-index layers (should match Z_INDEX values)
  SUGGESTION_PILLS_Z_INDEX: 10,
  CONTENT_Z_INDEX: 1
};

/**
 * Responsive component sizes
 * Centralized mobile/desktop dimensions for UI components
 */
export const SIZES = {
  // App card icon (Settings, Artifacts)
  APP_CARD: {
    ICON_CONTAINER: { mobile: 56, desktop: 80 },
    ICON: { mobile: 28, desktop: 40 },
    FONT_SIZE: { mobile: 'sm', desktop: 'base' },
  },
  // Suggestion pills
  SUGGESTION_PILL: {
    FONT_SIZE: { mobile: 'xs', desktop: 'base' },
    PADDING: { mobile: ['sm', 'md'], desktop: ['md', 'lg'] },
  },
  // Floating browser window
  FLOATING_WINDOW: {
    WIDTH: { mobile: null, desktop: 800 }, // null means 100vw
    HEIGHT_MULTIPLIER: { mobile: 0.65, desktop: null }, // mobile uses vh multiplier, desktop uses fixed
    HEIGHT: { mobile: null, desktop: 600 }, // null means use multiplier
    POSITION_X: { mobile: 0, desktop: null }, // null means centered
    POSITION_Y: { mobile: 60, desktop: null }, // null means centered
    MIN_WIDTH: { mobile: 280, desktop: 400 },
    MIN_HEIGHT: 300,
  },
  // Top bar
  TOPBAR: {
    HEIGHT: { mobile: 60, desktop: 70 },
  },
  // Common responsive spacing keys (used with theme.spacing)
  SPACING: {
    CONTENT_PADDING_X: { mobile: 'md', desktop: '2xl' },
    CONTENT_PADDING_Y: { mobile: 'lg', desktop: '3xl' },
    GRID_GAP: { mobile: 'md', desktop: 'xl' },
    SECTION_GAP: { mobile: 'sm', desktop: 'lg' },
  },
};

/**
 * Color constants for UI elements
 */
export const COLORS = {
  WHITE: '#ffffff',
  PRO_COMPONENTS_BLUE: '#3b82f6'
};

/**
 * Z-index layering system
 * Centralized z-index values for consistent stacking order
 */
export const Z_INDEX = {
  CONTENT: 1,
  SUGGESTION_PILLS: 10,
  FLOATING_BROWSER_WINDOW: 20,
  DROPDOWN: 30,
  CHAT_INPUT: 40,
  AI_RESPONSE_PANEL: 50,
  MODAL_BACKDROP: 100,
  MODALS: 110,
  ICON_PICKER: 200
};

/**
 * Floating window dimensions and positioning
 */
export const FLOATING_WINDOWS = {
  BROWSER: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    MIN_WIDTH: 400,
    MIN_HEIGHT: 300
  },
  AI_RESPONSE: {
    PANEL_TOP: '100px',
    PANEL_RIGHT: '20px',
    PANEL_WIDTH: '320px',
    PANEL_MAX_HEIGHT: '60vh'
  }
};

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  ARTIFACT_SAVE_FAILED: 'Failed to save your project to the cloud, but files are available locally. You can try creating a new artifact to save your work.',
  CODE_GENERATION_FAILED: 'Failed to generate code. Please try again.',
  GENERAL_ERROR: 'An error occurred while processing your request. Please try again.'
};
