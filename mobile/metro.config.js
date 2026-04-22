const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the repo root so Metro picks up shared code in ../src/
config.watchFolders = [workspaceRoot];

// Resolve packages from mobile/node_modules first, then root node_modules.
// This lets shared code import dependencies installed only at the root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Surgical dedup for React and the RN runtime: when ANY file (including
// shared code under ../src/) imports 'react' / 'react-dom' / 'react-native',
// force it to resolve to mobile/node_modules. Without this, shared code
// resolves via hierarchical lookup and finds the root's React 18 (for the
// web app) instead of mobile's React 19, triggering two-copies-of-React
// errors like "Cannot read property 'useState' of null".
//
// Uses resolveRequest (not disableHierarchicalLookup) so RN's own nested
// deps like @react-native/virtualized-lists still resolve normally.
const SHARED_SINGLETONS = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'scheduler',
]);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SHARED_SINGLETONS.has(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'index.js') },
      moduleName,
      platform,
    );
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
