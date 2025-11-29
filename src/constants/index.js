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
  LANDING_CHAT_INPUT_BOTTOM_OFFSET: '100px',
  LANDING_SUGGESTION_PILLS_BOTTOM_OFFSET: 160,
  LANDING_MAIN_PADDING_BOTTOM: '120px',
  LANDING_SUGGESTION_MAX_WIDTH: '90%',

  // Grid dimensions
  ARTIFACT_GRID_MIN_MOBILE: '140px',
  ARTIFACT_GRID_MIN_DESKTOP: '180px',

  // Z-index layers
  SUGGESTION_PILLS_Z_INDEX: 99,
  CONTENT_Z_INDEX: 1
};

/**
 * Color constants for UI elements
 */
export const COLORS = {
  WHITE: '#ffffff'
};
