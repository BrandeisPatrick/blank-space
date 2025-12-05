/**
 * Prebuild Artifacts Registry
 *
 * These are template artifacts that users can install from the AppStore.
 * Each artifact contains all the files needed to run in the preview iframe.
 */

import { retroTyperArtifact } from './artifacts/retroTyper';
import { cronusArtifact } from './artifacts/cronus';
import { calendarTodoArtifact } from './artifacts/calendarTodo';
import { strategyGameArtifact } from './artifacts/strategyGame';

export const PREBUILD_ARTIFACTS = [
  calendarTodoArtifact,
  strategyGameArtifact,
  retroTyperArtifact,
  cronusArtifact
];

/**
 * Get a prebuild artifact by ID
 */
export const getPrebuildById = (id) => {
  return PREBUILD_ARTIFACTS.find(artifact => artifact.id === id);
};

/**
 * Get all prebuild artifacts
 */
export const getAllPrebuilds = () => {
  return PREBUILD_ARTIFACTS;
};
