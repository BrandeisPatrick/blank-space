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

module.exports = config;
