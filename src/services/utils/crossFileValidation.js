/**
 * Cross-File Consistency Validation
 * Checks for consistency issues across multiple generated files
 */

/**
 * Check if imported components are actually used in JSX
 */
export function validateImportedComponentsUsed(files) {
  const warnings = [];

  Object.entries(files).forEach(([filename, code]) => {
    const lines = code.split("\n");

    // Extract component imports
    const componentImports = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Match: import Something from './components/Something'
      const defaultImportMatch = trimmed.match(/import\s+(\w+)\s+from\s+["']\.\/(?:components|\.\.\/components)\/([^"']+)["']/);
      if (defaultImportMatch) {
        componentImports.push({
          name: defaultImportMatch[1],
          line: index + 1
        });
      }

      // Match: import { Component } from './components/...'
      const namedImportMatch = trimmed.match(/import\s+{([^}]+)}\s+from\s+["']\.\/(?:components|\.\.\/components)\/([^"']+)["']/);
      if (namedImportMatch) {
        const names = namedImportMatch[1].split(",").map(n => n.trim().split(" as ")[0]);
        names.forEach(name => {
          componentImports.push({
            name,
            line: index + 1
          });
        });
      }
    });

    // Check if each component is used in JSX
    componentImports.forEach(component => {
      const usagePattern = new RegExp(`<${component.name}[\\s/>]`);
      const isUsed = code.match(usagePattern);

      if (!isUsed) {
        warnings.push({
          file: filename,
          line: component.line,
          message: `Component "${component.name}" imported but never used`,
          severity: "warning",
          fix: `Remove unused import or add <${component.name} /> to JSX`
        });
      }
    });
  });

  return {
    valid: true, // Don't fail on this
    warnings
  };
}

/**
 * Check if imported hooks are actually called
 */
export function validateImportedHooksUsed(files) {
  const warnings = [];

  Object.entries(files).forEach(([filename, code]) => {
    const lines = code.split("\n");

    // Extract hook imports (functions starting with 'use')
    const hookImports = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Match: import { useHook } from './hooks/...'
      const namedImportMatch = trimmed.match(/import\s+{([^}]+)}\s+from\s+["']\.\.?\/hooks\/([^"']+)["']/);
      if (namedImportMatch) {
        const names = namedImportMatch[1].split(",").map(n => n.trim().split(" as ")[0]);
        names.filter(name => name.startsWith("use")).forEach(name => {
          hookImports.push({
            name,
            line: index + 1
          });
        });
      }
    });

    // Check if each hook is called
    hookImports.forEach(hook => {
      const usagePattern = new RegExp(`${hook.name}\\s*\\(`);
      const isUsed = code.match(usagePattern);

      if (!isUsed) {
        warnings.push({
          file: filename,
          line: hook.line,
          message: `Hook "${hook.name}" imported but never called`,
          severity: "warning",
          fix: `Remove unused import or call ${hook.name}()`
        });
      }
    });
  });

  return {
    valid: true,
    warnings
  };
}

/**
 * Check for duplicate state management
 * (e.g., component manages state locally when hook exists)
 */
export function validateNoDuplicateLogic(files) {
  const warnings = [];

  Object.entries(files).forEach(([filename, code]) => {
    // Skip non-component files
    if (!filename.startsWith("components/") || !code.includes("useState")) {
      return;
    }

    // Check if component imports a custom hook
    const hookImportMatch = code.match(/import\s+{[^}]*use\w+[^}]*}\s+from\s+["']\.\.\/hooks\//);

    if (hookImportMatch) {
      // Check if component also uses useState
      const hasLocalState = code.includes("useState(");

      if (hasLocalState) {
        warnings.push({
          file: filename,
          message: "Component imports custom hook but also manages state locally - possible duplicate logic",
          severity: "warning",
          fix: "Consider using the hook's state management instead of local useState"
        });
      }
    }
  });

  return {
    valid: true,
    warnings
  };
}

/**
 * Check for missing exports
 */
export function validateExportsExist(files) {
  const errors = [];

  Object.entries(files).forEach(([filename, code]) => {
    // Skip certain files that don't need exports
    if (filename === "App.jsx") return;

    // Check if file has any export
    const hasExport = code.includes("export default") || code.includes("export const") || code.includes("export function");

    if (!hasExport) {
      errors.push({
        file: filename,
        message: `File has no exports - will cause import errors`,
        severity: "error",
        fix: "Add 'export default ComponentName' at the end"
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check for circular dependencies
 */
export function validateNoCircularDependencies(files) {
  const warnings = [];
  const imports = {};

  // Build dependency graph
  Object.entries(files).forEach(([filename, code]) => {
    imports[filename] = [];

    const lines = code.split("\n");
    lines.forEach(line => {
      const importMatch = line.match(/from\s+["'](\.[^"']+)["']/);
      if (importMatch) {
        const importPath = importMatch[1];
        // Resolve to filename
        let resolvedPath = importPath.replace(/^\.\//, "").replace(/^\.\.\//, "");
        if (!resolvedPath.endsWith(".jsx") && !resolvedPath.endsWith(".js")) {
          resolvedPath += ".jsx"; // Assume .jsx
        }
        imports[filename].push(resolvedPath);
      }
    });
  });

  // Check for circular dependencies
  function hasCircular(file, visited = new Set(), path = []) {
    if (visited.has(file)) {
      warnings.push({
        file: path[0],
        message: `Circular dependency detected: ${path.join(" → ")} → ${file}`,
        severity: "warning",
        fix: "Refactor to remove circular dependency"
      });
      return true;
    }

    visited.add(file);
    path.push(file);

    const dependencies = imports[file] || [];
    for (const dep of dependencies) {
      hasCircular(dep, new Set(visited), [...path]);
    }

    return false;
  }

  Object.keys(imports).forEach(file => {
    hasCircular(file);
  });

  return {
    valid: true, // Don't fail on circular deps, just warn
    warnings
  };
}

/**
 * Run all cross-file validations
 */
export function validateCrossFileConsistency(files) {
  const results = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Check imported components are used
  const componentCheck = validateImportedComponentsUsed(files);
  results.warnings.push(...componentCheck.warnings);

  // Check imported hooks are used
  const hookCheck = validateImportedHooksUsed(files);
  results.warnings.push(...hookCheck.warnings);

  // Check for duplicate logic
  const duplicateCheck = validateNoDuplicateLogic(files);
  results.warnings.push(...duplicateCheck.warnings);

  // Check exports exist
  const exportCheck = validateExportsExist(files);
  if (!exportCheck.valid) {
    results.valid = false;
  }
  results.errors.push(...exportCheck.errors);

  // Check circular dependencies
  const circularCheck = validateNoCircularDependencies(files);
  results.warnings.push(...circularCheck.warnings);

  return results;
}
