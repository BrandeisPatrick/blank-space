/**
 * UI Components - Barrel Export
 *
 * Removed Components:
 * - ExamplesDropdown: Previously used to show example projects
 *   Status: REMOVED - Functionality replaced with artifact grid on LandingPage
 *   Migration: Use ArtifactCard component for displaying example artifacts
 *
 * - SettingsDropdown: Previously used for theme switching and settings
 *   Status: REMOVED - Functionality consolidated into TopBar and main theme context
 *   Migration: Use ThemeToggle component or access theme context directly
 *
 * These components were removed to simplify the UI and consolidate similar
 * functionality in more appropriate locations. All features have been preserved
 * through alternative components or direct context usage.
 */

export { ConfirmDialog } from './ConfirmDialog';
export { SuggestionPill } from './SuggestionPill';
export { ThemeToggle } from './ThemeToggle';
export { TopBar } from './TopBar';
