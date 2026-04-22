/**
 * Firebase Native (React Native) Configuration
 *
 * Metro auto-selects this over firebase.js on iOS/Android builds.
 * Phase 1 will wire this up to @react-native-firebase/* packages. Until then,
 * this stub exports the same surface as firebase.js so shared code that
 * imports `{ app, auth, db, storage }` can compile on native without crashing
 * at bundle time. Any call-site that actually uses these will throw clearly.
 */

const notWired = (name) => {
  throw new Error(
    `[firebase.native] ${name} is not wired yet. Install @react-native-firebase/* in Phase 1 and implement this module.`,
  );
};

const pendingAccess = (name) =>
  new Proxy(
    {},
    {
      get: () => notWired(name),
      apply: () => notWired(name),
    },
  );

export const app = pendingAccess('app');
export const auth = pendingAccess('auth');
export const db = pendingAccess('db');
export const storage = pendingAccess('storage');
