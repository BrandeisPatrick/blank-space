/**
 * Auto-Fix Common Issues
 * Automatically fixes common problems in generated code
 */

/**
 * Ensure React import exists if code uses JSX or React hooks
 */
export function ensureReactImport(code) {
  // Check if code already has React import
  const hasReactImport = code.includes("import React") ||
                         code.includes("import * as React") ||
                         (code.includes("import {") && code.includes("} from 'react'")) ||
                         (code.includes("import {") && code.includes('} from "react"'));

  if (hasReactImport) {
    return code; // Already has React import
  }

  // Check if code needs React import (has JSX or React hooks)
  const hasJSX = /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(code) || // Component JSX like <App />
                 /<[a-z]+[\s>]/.test(code); // HTML JSX like <div>

  const hasReactHooks = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useImperativeHandle|useLayoutEffect|useDebugValue)\s*\(/.test(code);

  // If code has JSX or hooks, add React import at the top
  if (hasJSX || hasReactHooks) {
    // Find the position after the first set of imports (if any)
    const lines = code.split('\n');
    let insertIndex = 0;

    // Find last import line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('//')) {
        // Stop at first non-import, non-comment line
        break;
      }
    }

    // Insert React import
    const reactImport = "import React from 'react';";

    if (insertIndex === 0) {
      // No imports found, add at the very top
      return reactImport + '\n\n' + code;
    } else {
      // Insert after other imports
      lines.splice(insertIndex, 0, reactImport);
      return lines.join('\n');
    }
  }

  return code;
}

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
 * Enhanced to handle multi-line statements
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
        // Found duplicate - mark this line and subsequent lines of the statement
        linesToRemove.add(index);

        // Check if this is a multi-line statement
        // Look for the closing of this statement (semicolon, or matching closing bracket/paren)
        let currentLine = index;
        let currentCode = lines[currentLine];
        let openParens = (currentCode.match(/\(/g) || []).length - (currentCode.match(/\)/g) || []).length;
        let openBraces = (currentCode.match(/\{/g) || []).length - (currentCode.match(/\}/g) || []).length;
        let openBrackets = (currentCode.match(/\[/g) || []).length - (currentCode.match(/\]/g) || []).length;

        // Continue removing lines until statement is complete
        while (
          currentLine < lines.length - 1 &&
          (openParens > 0 || openBraces > 0 || openBrackets > 0 || !currentCode.trim().endsWith(";"))
        ) {
          currentLine++;
          if (currentLine < lines.length) {
            linesToRemove.add(currentLine);
            currentCode = lines[currentLine];
            openParens += (currentCode.match(/\(/g) || []).length - (currentCode.match(/\)/g) || []).length;
            openBraces += (currentCode.match(/\{/g) || []).length - (currentCode.match(/\}/g) || []).length;
            openBrackets += (currentCode.match(/\[/g) || []).length - (currentCode.match(/\]/g) || []).length;

            // If we found semicolon and all brackets are closed, we're done
            if (currentCode.trim().endsWith(";") && openParens <= 0 && openBraces <= 0 && openBrackets <= 0) {
              break;
            }
          }
        }
      } else {
        declarations[identifier] = index;
      }
    }
  });

  fixed = lines.filter((line, index) => !linesToRemove.has(index)).join("\n");

  // Clean up multiple consecutive newlines
  fixed = fixed.replace(/\n\n\n+/g, "\n\n");

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
 * Remove React initialization code
 * Prevents duplicate "const root" declarations
 */
export function removeInitializationCode(code) {
  let fixed = code;

  // Remove ReactDOM import (not needed in generated components)
  fixed = fixed.replace(/import\s+ReactDOM\s+from\s+["']react-dom\/client["'];?\s*\n?/g, "");
  fixed = fixed.replace(/import\s+ReactDOM\s+from\s+["']react-dom["'];?\s*\n?/g, "");
  fixed = fixed.replace(/import\s+{\s*createRoot\s*}\s+from\s+["']react-dom\/client["'];?\s*\n?/g, "");

  // Remove initialization patterns - multi-line detection
  // Pattern 1: const root = ReactDOM.createRoot(...); root.render(...);
  fixed = fixed.replace(
    /\n?\s*const\s+root\s*=\s*ReactDOM\.createRoot\s*\([^)]+\)\s*;?\s*\n?\s*root\.render\s*\([^)]*<[^>]+\s*\/>\s*\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 2: const root = ReactDOM.createRoot(...) (without semicolon or render)
  fixed = fixed.replace(
    /\n?\s*const\s+root\s*=\s*ReactDOM\.createRoot\s*\([^)]+\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 3: root.render(...) standalone
  fixed = fixed.replace(
    /\n?\s*root\.render\s*\([^)]*<[^>]+\s*\/>\s*\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 4: ReactDOM.createRoot(...).render(...) (chained)
  fixed = fixed.replace(
    /\n?\s*ReactDOM\.createRoot\s*\([^)]+\)\.render\s*\([^)]*<[^>]+\s*\/>\s*\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 5: const container = document.getElementById(...) lines
  fixed = fixed.replace(
    /\n?\s*const\s+container\s*=\s*document\.getElementById\s*\([^)]+\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 6: Legacy ReactDOM.render (React 17 and earlier)
  fixed = fixed.replace(
    /\n?\s*ReactDOM\.render\s*\([^)]*,\s*document\.getElementById\s*\([^)]+\)\s*\)\s*;?\s*\n?/g,
    "\n"
  );

  // Pattern 7: document.getElementById('root') or document.getElementById("root")
  fixed = fixed.replace(
    /\n?\s*document\.getElementById\s*\(\s*["']root["']\s*\)\s*;?\s*\n?/g,
    "\n"
  );

  // Clean up multiple consecutive newlines
  fixed = fixed.replace(/\n\n\n+/g, "\n\n");

  // Remove trailing whitespace before newlines
  fixed = fixed.replace(/[ \t]+\n/g, "\n");

  return fixed;
}

/**
 * Convert CommonJS require() to ES6 import
 * Browser environments don't support require()
 */
export function convertRequireToImport(code) {
  let fixed = code;

  // Pattern 1: const Name = require('module')
  // → import Name from 'module'
  fixed = fixed.replace(
    /const\s+(\w+)\s*=\s*require\s*\(\s*(['"])([^'"]+)\2\s*\)\s*;?\s*\n?/g,
    (match, name, quote, module) => `import ${name} from ${quote}${module}${quote};\n`
  );

  // Pattern 2: const { name1, name2 } = require('module')
  // → import { name1, name2 } from 'module'
  fixed = fixed.replace(
    /const\s*{\s*([^}]+)\s*}\s*=\s*require\s*\(\s*(['"])([^'"]+)\2\s*\)\s*;?\s*\n?/g,
    (match, names, quote, module) => `import { ${names.trim()} } from ${quote}${module}${quote};\n`
  );

  // Pattern 3: let Name = require('module')
  // → import Name from 'module'
  fixed = fixed.replace(
    /let\s+(\w+)\s*=\s*require\s*\(\s*(['"])([^'"]+)\2\s*\)\s*;?\s*\n?/g,
    (match, name, quote, module) => `import ${name} from ${quote}${module}${quote};\n`
  );

  // Pattern 4: var Name = require('module')
  // → import Name from 'module'
  fixed = fixed.replace(
    /var\s+(\w+)\s*=\s*require\s*\(\s*(['"])([^'"]+)\2\s*\)\s*;?\s*\n?/g,
    (match, name, quote, module) => `import ${name} from ${quote}${module}${quote};\n`
  );

  return fixed;
}

/**
 * Run all auto-fixes
 */
export function autoFixCommonIssues(code, filename) {
  let fixed = code;

  // Run fixes in order
  fixed = convertRequireToImport(fixed);  // Convert require() to import
  fixed = removePropTypes(fixed);
  fixed = removeUnusedImports(fixed);
  fixed = fixImportPaths(fixed, filename);
  fixed = removeInitializationCode(fixed);  // Remove initialization code
  fixed = removeDuplicateDeclarations(fixed);
  fixed = replaceAxiosWithFetch(fixed);
  fixed = replaceLodashWithNative(fixed);
  fixed = ensureReactImport(fixed);  // Ensure React import exists if needed
  // Note: Skipping addMissingSemicolons as it can be too aggressive

  return fixed;
}
