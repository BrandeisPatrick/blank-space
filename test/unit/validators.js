/**
 * Code Validation Functions
 * Tests generated code for quality and correctness
 */

/**
 * Check if code contains markdown code fences
 */
export function validateNoMarkdown(code) {
  const markdownPattern = /```(?:jsx|javascript|js|tsx|ts|typescript)?/g;
  const matches = code.match(markdownPattern);

  return {
    valid: !matches,
    errors: matches ? [`Found ${matches.length} markdown fence(s): ${matches.join(", ")}`] : []
  };
}

/**
 * Check if code uses double quotes (not single quotes)
 */
export function validateDoubleQuotes(code) {
  const errors = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    // Check for single quotes in imports
    if (line.includes("import") && /from\s+'[^']+'/.test(line)) {
      errors.push(`Line ${index + 1}: Import uses single quotes: ${line.trim()}`);
    }

    // Check for single quotes in JSX className
    if (/className\s*=\s*'[^']+'/.test(line)) {
      errors.push(`Line ${index + 1}: className uses single quotes: ${line.trim()}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate proper folder structure in file paths
 */
export function validateFolderStructure(files) {
  const errors = [];
  const componentPattern = /^components\/[\w-]+\.jsx$/;
  const hookPattern = /^hooks\/[\w-]+\.js$/;
  const libPattern = /^lib\/[\w-]+\.js$/;
  const utilsPattern = /^utils\/[\w-]+\.js$/;

  Object.keys(files).forEach(filename => {
    if (filename === "App.jsx" || filename === "App.tsx") {
      // App.jsx should be at root
      return;
    }

    // Check if component files are in components/ folder
    if (filename.endsWith(".jsx") && !filename.startsWith("components/")) {
      errors.push(`Component ${filename} should be in components/ folder`);
    }

    // Check if hook files are in hooks/ folder
    if (filename.startsWith("use") && !filename.startsWith("hooks/")) {
      errors.push(`Hook ${filename} should be in hooks/ folder`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate import paths are correct based on file location
 */
export function validateImportPaths(filename, code) {
  const errors = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    if (!line.trim().startsWith("import")) return;

    // Check App.jsx imports
    if (filename === "App.jsx") {
      // App.jsx should import from ./components/, ./hooks/, etc.
      if (/from\s+["']\.\/\w+["']/.test(line) && !/from\s+["']\.\/(components|hooks|lib|utils|styles)\//.test(line)) {
        errors.push(`Line ${index + 1}: App.jsx should use folder imports: ${line.trim()}`);
      }
    }

    // Check component imports
    if (filename.startsWith("components/")) {
      // Components importing other components should use ./ or ../
      if (/from\s+["']components\//.test(line)) {
        errors.push(`Line ${index + 1}: Component should use relative import (./ or ../): ${line.trim()}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if code contains modern Tailwind CSS classes
 */
export function validateTailwindClasses(code) {
  const modernPatterns = [
    /className\s*=\s*["'][^"']*(?:shadow|rounded|hover:|gradient|transition|bg-\w+)/,
    /className\s*=\s*{`[^`]*(?:shadow|rounded|hover:|gradient|transition|bg-\w+)/
  ];

  const hasModernStyling = modernPatterns.some(pattern => pattern.test(code));

  return {
    valid: hasModernStyling,
    errors: hasModernStyling ? [] : ["Code lacks modern Tailwind classes (shadows, rounded, hover states, gradients)"]
  };
}

/**
 * Detect multi-file concatenation (comment-based separators)
 */
export function validateSingleFileOutput(code) {
  const multiFilePattern = /\/\/\s+(?:components?|hooks?|lib|utils|styles)\/[\w.-]+\.(jsx?|tsx?|css)/gi;
  const matches = code.match(multiFilePattern);

  return {
    valid: !matches,
    errors: matches ? [`Multi-file output detected. Found separators: ${matches.join(", ")}`] : []
  };
}

/**
 * Check for duplicate imports or declarations
 */
export function validateNoDuplicates(code) {
  const errors = [];
  const lines = code.split("\n");
  const imports = {};
  const declarations = {};

  lines.forEach((line, index) => {
    // Track imports
    const importMatch = line.match(/import\s+(?:(\w+)|{([^}]+)})\s+from/);
    if (importMatch) {
      const imported = importMatch[1] || importMatch[2];
      const identifiers = imported.split(",").map(s => s.trim());

      identifiers.forEach(identifier => {
        if (imports[identifier]) {
          errors.push(`Duplicate import "${identifier}" at line ${index + 1} (first seen at line ${imports[identifier]})`);
        } else {
          imports[identifier] = index + 1;
        }
      });
    }

    // Track declarations
    const declMatch = line.match(/(?:const|let|var|function|class)\s+(\w+)/);
    if (declMatch) {
      const identifier = declMatch[1];
      if (declarations[identifier]) {
        errors.push(`Duplicate declaration "${identifier}" at line ${index + 1} (first seen at line ${declarations[identifier]})`);
      } else {
        declarations[identifier] = index + 1;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Run all validators on a single file
 */
export function validateFile(filename, code) {
  const results = {
    filename,
    valid: true,
    errors: []
  };

  // Determine if file should have Tailwind classes (only UI components)
  const shouldHaveTailwind =
    filename.endsWith(".jsx") &&
    !filename.includes("hooks/") &&
    !filename.includes("lib/") &&
    !filename.includes("utils/");

  // Run all validations
  const validations = [
    validateNoMarkdown(code),
    validateDoubleQuotes(code),
    validateImportPaths(filename, code),
    shouldHaveTailwind ? validateTailwindClasses(code) : { valid: true, errors: [] },
    validateSingleFileOutput(code),
    validateNoDuplicates(code)
  ];

  validations.forEach(validation => {
    if (!validation.valid) {
      results.valid = false;
      results.errors.push(...validation.errors);
    }
  });

  return results;
}

/**
 * Run all validators on multiple files
 */
export function validateFiles(files) {
  const results = {
    valid: true,
    fileResults: [],
    structureErrors: []
  };

  // Validate folder structure
  const structureValidation = validateFolderStructure(files);
  if (!structureValidation.valid) {
    results.valid = false;
    results.structureErrors = structureValidation.errors;
  }

  // Validate each file
  Object.entries(files).forEach(([filename, code]) => {
    const fileResult = validateFile(filename, code);
    results.fileResults.push(fileResult);

    if (!fileResult.valid) {
      results.valid = false;
    }
  });

  return results;
}
