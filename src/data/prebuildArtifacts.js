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
import { animatedCardsArtifact } from './artifacts/animatedCards';
import { interactiveDashboardArtifact } from './artifacts/interactiveDashboard';
import { kanbanBoardArtifact } from './artifacts/kanbanBoard';
import { musicPlayerArtifact } from './artifacts/musicPlayer';
import { weatherAppArtifact } from './artifacts/weatherApp';
import { spaceStationArtifact } from './artifacts/spaceStation';
import { contentStudioArtifact } from './artifacts/contentStudio';

export const PREBUILD_ARTIFACTS = [
  calendarTodoArtifact,
  strategyGameArtifact,
  retroTyperArtifact,
  cronusArtifact,
  animatedCardsArtifact,
  interactiveDashboardArtifact,
  kanbanBoardArtifact,
  musicPlayerArtifact,
  weatherAppArtifact,
  spaceStationArtifact,
  contentStudioArtifact
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
