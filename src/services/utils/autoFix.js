/**
 * Auto-Fix Common Issues
 * Automatically fixes common problems in generated code
 */

/**
 * Remove PropTypes imports and usage
 */
export function removePropTypes(code) {
  let fixed = code;

  // Remove PropTypes import
  fixed = fixed.replace(/import\s+PropTypes\s+from\s+["']prop-types["'];?\s*\n?/g, "");

  // Remove PropTypes validation blocks
  // Pattern: ComponentName.propTypes = { ... };
  fixed = fixed.replace(/\n\s*\w+\.propTypes\s*=\s*{[\s\S]*?};?\s*\n?/g, "\n");

  return fixed;
}

/**
 * Remove unused imports
 */
export function removeUnusedImports(code) {
  let fixed = code;
  const lines = fixed.split("\n");

  // Process each import line
  const processedLines = lines.map((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed.startsWith("import ")) {
      return line;
    }

    // Handle default + named imports: import React, { useState, useEffect } from 'react'
    const combinedMatch = trimmed.match(/import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+["']([^"']+)["']/);
    if (combinedMatch) {
      const defaultImport = combinedMatch[1];
      const namedImports = combinedMatch[2].split(",").map(n => n.trim().split(" as ")[0]);
      const source = combinedMatch[3];

      // Check default import usage
      const defaultPattern = new RegExp(`\\b${defaultImport}\\b`);
      const defaultUsed = lines.some((l, i) => i !== lineIndex && defaultPattern.test(l));

      // Check named imports usage
      const usedNamedImports = namedImports.filter(name => {
        const pattern = new RegExp(`\\b${name}\\b`);
        return lines.some((l, i) => i !== lineIndex && pattern.test(l));
      });

      // Reconstruct import statement
      if (defaultUsed && usedNamedImports.length > 0) {
        // Keep both
        const quote = trimmed.includes('"') ? '"' : "'";
        return line.replace(combinedMatch[0], `import ${defaultImport}, { ${usedNamedImports.join(", ")} } from ${quote}${source}${quote}`);
      } else if (defaultUsed) {
        // Keep only default
        const quote = trimmed.includes('"') ? '"' : "'";
        return line.replace(combinedMatch[0], `import ${defaultImport} from ${quote}${source}${quote}`);
      } else if (usedNamedImports.length > 0) {
        // Keep only named
        const quote = trimmed.includes('"') ? '"' : "'";
        return line.replace(combinedMatch[0], `import { ${usedNamedImports.join(", ")} } from ${quote}${source}${quote}`);
      } else {
        // Remove entire line
        return "";
      }
    }

    // Handle named imports only: import { useState } from 'react'
    const namedMatch = trimmed.match(/import\s+{([^}]+)}\s+from\s+["']([^"']+)["']/);
    if (namedMatch) {
      const namedImports = namedMatch[1].split(",").map(n => n.trim().split(" as ")[0]);
      const source = namedMatch[2];

      const usedNamedImports = namedImports.filter(name => {
        const pattern = new RegExp(`\\b${name}\\b`);
        return lines.some((l, i) => i !== lineIndex && pattern.test(l));
      });

      if (usedNamedImports.length === 0) {
        return ""; // Remove entire line
      } else if (usedNamedImports.length < namedImports.length) {
        // Keep only used imports
        const quote = trimmed.includes('"') ? '"' : "'";
        return line.replace(namedMatch[0], `import { ${usedNamedImports.join(", ")} } from ${quote}${source}${quote}`);
      }
    }

    // Handle default import only: import React from 'react'
    const defaultMatch = trimmed.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/);
    if (defaultMatch) {
      const defaultImport = defaultMatch[1];
      const pattern = new RegExp(`\\b${defaultImport}\\b`);
      const isUsed = lines.some((l, i) => i !== lineIndex && pattern.test(l));

      if (!isUsed) {
        return ""; // Remove line
      }
    }

    return line;
  });

  // Filter out empty lines that were import removals
  fixed = processedLines.join("\n");

  // Clean up multiple consecutive newlines
  fixed = fixed.replace(/\n\n\n+/g, "\n\n");

  return fixed;
}

/**
 * Fix common import path mistakes
 */
export function fixImportPaths(code, filename) {
  let fixed = code;

  // If this is App.jsx, ensure component imports use ./components/
  if (filename === "App.jsx") {
    // Fix: import Header from './Header' → import Header from './components/Header'
    fixed = fixed.replace(
      /import\s+(\w+)\s+from\s+(["'])\.\/(\w+)\2/g,
      (match, component, quote, path) => {
        // Skip if already has folder prefix
        if (path.includes("/")) return match;
        // Add components/ prefix, preserving quote style
        return `import ${component} from ${quote}./components/${path}${quote}`;
      }
    );
  }

  // If this is a component, ensure sibling imports use ./
  if (filename.startsWith("components/")) {
    // Fix: import TodoItem from 'components/TodoItem' → import TodoItem from './TodoItem'
    fixed = fixed.replace(
      /import\s+(\w+)\s+from\s+(["'])components\/(\w+)\2/g,
      (match, component, quote, path) => {
        return `import ${component} from ${quote}./${path}${quote}`;
      }
    );
  }

  return fixed;
}

/**
 * Remove duplicate declarations
 */
export function removeDuplicateDeclarations(code) {
  let fixed = code;
  const lines = fixed.split("\n");
  const declarations = {};
  const linesToRemove = new Set();

  lines.forEach((line, index) => {
    const declMatch = line.match(/(?:const|let|var|function|class)\s+(\w+)/);
    if (declMatch) {
      const identifier = declMatch[1];
      if (declarations[identifier] !== undefined) {
        // Mark second occurrence for removal
        linesToRemove.add(index);
      } else {
        declarations[identifier] = index;
      }
    }
  });

  fixed = lines.filter((line, index) => !linesToRemove.has(index)).join("\n");

  return fixed;
}

/**
 * Fix missing semicolons
 */
export function addMissingSemicolons(code) {
  let fixed = code;
  const lines = fixed.split("\n");

  const fixedLines = lines.map(line => {
    const trimmed = line.trim();

    // Skip empty lines, comments, JSX, opening braces
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") ||
        trimmed.startsWith("<") || trimmed.startsWith("{") || trimmed.startsWith("}") ||
        trimmed === ")" || trimmed === "]") {
      return line;
    }

    // Add semicolon to statements that should have them
    if ((trimmed.startsWith("const ") || trimmed.startsWith("let ") ||
         trimmed.startsWith("var ") || trimmed.startsWith("return ")) &&
        !trimmed.endsWith(";") && !trimmed.endsWith("{") &&
        !trimmed.endsWith(",")) {
      return line + ";";
    }

    return line;
  });

  return fixedLines.join("\n");
}

/**
 * Remove axios imports and suggest fetch
 */
export function replaceAxiosWithFetch(code) {
  let fixed = code;

  // Remove axios import
  fixed = fixed.replace(/import\s+axios\s+from\s+["']axios["'];?\s*\n?/g, "");

  // Add comment where axios was used
  if (code.includes("axios.")) {
    fixed = "// Note: axios replaced with fetch API\n" + fixed;
  }

  return fixed;
}

/**
 * Replace lodash/underscore with native methods
 */
export function replaceLodashWithNative(code) {
  let fixed = code;

  // Remove lodash imports
  fixed = fixed.replace(/import\s+(_|lodash)\s+from\s+["']lodash["'];?\s*\n?/g, "");
  fixed = fixed.replace(/import\s+{([^}]+)}\s+from\s+["']lodash["'];?\s*\n?/g, "");

  // Add comment if lodash was used
  if (code.includes("_.") || code.includes("lodash.")) {
    fixed = "// Note: Use native JavaScript methods instead of lodash\n" + fixed;
  }

  return fixed;
}

/**
 * Run all auto-fixes
 */
export function autoFixCommonIssues(code, filename) {
  let fixed = code;

  // Run fixes in order
  fixed = removePropTypes(fixed);
  fixed = removeUnusedImports(fixed);
  fixed = fixImportPaths(fixed, filename);
  fixed = removeDuplicateDeclarations(fixed);
  fixed = replaceAxiosWithFetch(fixed);
  fixed = replaceLodashWithNative(fixed);
  // Note: Skipping addMissingSemicolons as it can be too aggressive

  return fixed;
}
