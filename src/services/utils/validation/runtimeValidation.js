/**
 * Runtime Safety Validation
 * Checks for patterns that will cause runtime errors in browser
 */

/**
 * List of banned npm packages that won't work in browser
 */
const BANNED_PACKAGES = [
  "prop-types",
  "PropTypes",
  "class-validator",
  "joi",
  "yup",
  "zod",
  "axios",
  "lodash",
  "_",
  "moment",
  "uuid",
  "dotenv",
  "express",
  "mongoose",
  "@types/"
];

/**
 * List of allowed packages (pre-bundled in browser)
 */
const ALLOWED_PACKAGES = [
  "react",
  "react-dom"
];

/**
 * Check if code imports banned packages
 */
export function validateNoBannedPackages(code) {
  const errors = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for banned imports
    if (trimmed.startsWith("import ") && /from\s+["']([^"']+)["']/.test(trimmed)) {
      const importMatch = trimmed.match(/from\s+["']([^"']+)["']/);
      if (importMatch) {
        const packageName = importMatch[1];

        // Skip local imports (start with ./ or ../)
        if (packageName.startsWith("./") || packageName.startsWith("../")) {
          return;
        }

        // Check if it's a banned package
        const isBanned = BANNED_PACKAGES.some(banned =>
          packageName === banned || packageName.startsWith(banned)
        );

        if (isBanned) {
          errors.push({
            line: index + 1,
            code: trimmed,
            message: `Banned package "${packageName}" - not available in browser`,
            severity: "error",
            fix: `Remove this import or use native JavaScript alternative`
          });
        }

        // Check if it's an unknown package (not in allowed list)
        const isAllowed = ALLOWED_PACKAGES.some(allowed =>
          packageName === allowed || packageName.startsWith(allowed)
        );

        if (!isAllowed) {
          errors.push({
            line: index + 1,
            code: trimmed,
            message: `Unknown package "${packageName}" - may not be available in browser`,
            severity: "warning",
            fix: `Verify this package is pre-bundled or use alternative`
          });
        }
      }
    }

    // Check for PropTypes usage (even without import)
    if (trimmed.includes("PropTypes.") || trimmed.includes(".propTypes =")) {
      errors.push({
        line: index + 1,
        code: trimmed,
        message: "PropTypes usage detected - this will cause runtime error",
        severity: "error",
        fix: "Remove PropTypes validation or use JSDoc comments"
      });
    }

    // Check for require() statements
    if (trimmed.includes("require(")) {
      errors.push({
        line: index + 1,
        code: trimmed,
        message: "require() not supported in browser - use ES6 import instead",
        severity: "error",
        fix: 'Use: import ... from "..."'
      });
    }
  });

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors,
    warnings: errors.filter(e => e.severity === "warning")
  };
}

/**
 * Check if all imports have valid targets
 */
export function validateImportTargets(code, filename, allFiles) {
  const errors = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("import ") && /from\s+["']([^"']+)["']/.test(trimmed)) {
      const importMatch = trimmed.match(/from\s+["']([^"']+)["']/);
      if (!importMatch) return;

      const importPath = importMatch[1];

      // Skip external packages
      if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
        return;
      }

      // Resolve the import path relative to current file
      const currentDir = filename.includes("/")
        ? filename.substring(0, filename.lastIndexOf("/"))
        : "";

      let resolvedPath = importPath;
      if (importPath.startsWith("./")) {
        resolvedPath = currentDir ? `${currentDir}/${importPath.substring(2)}` : importPath.substring(2);
      } else if (importPath.startsWith("../")) {
        const upLevels = (importPath.match(/\.\.\//g) || []).length;
        let pathParts = currentDir.split("/");
        pathParts = pathParts.slice(0, -upLevels);
        const remainingPath = importPath.replace(/\.\.\//g, "");
        resolvedPath = pathParts.length > 0
          ? `${pathParts.join("/")}/${remainingPath}`
          : remainingPath;
      }

      // Add .jsx or .js extension if missing
      const possiblePaths = [
        resolvedPath,
        `${resolvedPath}.jsx`,
        `${resolvedPath}.js`,
        `${resolvedPath}/index.jsx`,
        `${resolvedPath}/index.js`
      ];

      // Check if any of the possible paths exist in allFiles
      const exists = possiblePaths.some(path => allFiles && allFiles[path]);

      if (allFiles && !exists) {
        errors.push({
          line: index + 1,
          code: trimmed,
          message: `Import target "${importPath}" not found`,
          severity: "warning",
          fix: `Ensure the file exists: ${resolvedPath}`
        });
      }
    }
  });

  return {
    valid: true, // Don't fail on this, just warn
    errors,
    warnings: errors
  };
}

/**
 * Check for unused imports
 */
export function validateNoUnusedImports(code) {
  const warnings = [];
  const lines = code.split("\n");
  const imports = [];

  // Extract all imports
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("import ")) {
      // Extract imported identifiers
      const defaultMatch = trimmed.match(/import\s+(\w+)\s+from/);
      const namedMatch = trimmed.match(/import\s+{([^}]+)}\s+from/);

      if (defaultMatch) {
        imports.push({ name: defaultMatch[1], line: index + 1, code: trimmed });
      }
      if (namedMatch) {
        const names = namedMatch[1].split(",").map(n => n.trim().split(" as ")[0]);
        names.forEach(name => {
          imports.push({ name, line: index + 1, code: trimmed });
        });
      }
    }
  });

  // Check if each import is used
  imports.forEach(imported => {
    const usagePattern = new RegExp(`\\b${imported.name}\\b`);
    const usageCount = lines.filter((line, i) => i !== imported.line - 1 && usagePattern.test(line)).length;

    if (usageCount === 0) {
      warnings.push({
        line: imported.line,
        code: imported.code,
        message: `Unused import: ${imported.name}`,
        severity: "warning",
        fix: `Remove this import if not needed`
      });
    }
  });

  return {
    valid: true, // Don't fail on unused imports
    errors: [],
    warnings
  };
}

/**
 * Run all runtime safety validations
 */
export function validateRuntimeSafety(code, filename, allFiles = null) {
  const results = {
    filename,
    valid: true,
    errors: [],
    warnings: []
  };

  // Check for banned packages
  const packageCheck = validateNoBannedPackages(code);
  if (!packageCheck.valid) {
    results.valid = false;
  }
  results.errors.push(...packageCheck.errors.filter(e => e.severity === "error"));
  results.warnings.push(...packageCheck.warnings);

  // Check import targets (if allFiles provided)
  if (allFiles) {
    const importCheck = validateImportTargets(code, filename, allFiles);
    results.warnings.push(...importCheck.warnings);
  }

  // Check for unused imports
  const unusedCheck = validateNoUnusedImports(code);
  results.warnings.push(...unusedCheck.warnings);

  return results;
}
