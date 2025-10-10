/**
 * Clean Generated Code
 * Removes markdown code fences, explanatory text, malformed syntax, and detects multi-file output
 */
export function cleanGeneratedCode(rawCode) {
  let cleaned = rawCode;

  // 1. Remove markdown code fences (```jsx, ```, etc.)
  cleaned = cleaned.replace(/```(?:jsx|javascript|js|tsx|ts|typescript)?\n?/g, "");
  cleaned = cleaned.replace(/```\n?/g, "");

  // 2. Detect multi-file output with comment separators
  // Patterns like: "// components/Header.jsx" or "// hooks/useTodos.js"
  const multiFilePattern = /\n\s*\/\/\s+(?:components?|hooks?|lib|utils|styles)\/[\w.-]+\.(jsx?|tsx?|css)\s*\n/i;
  const multiFileMatch = cleaned.match(multiFilePattern);

  if (multiFileMatch) {
    console.warn("⚠️ AI generated multiple files in one response. Extracting only the first file.");
    console.warn("Match found:", multiFileMatch[0]);

    // Extract only content before the first file separator
    const separatorIndex = multiFileMatch.index;
    cleaned = cleaned.substring(0, separatorIndex);
  }

  // 3. Find first valid code line (import, export, const, function, class, etc.)
  const lines = cleaned.split("\n");
  const firstCodeLine = lines.findIndex(line => {
    const trimmed = line.trim();
    return trimmed.startsWith("import ") ||
           trimmed.startsWith("export ") ||
           trimmed.startsWith("const ") ||
           trimmed.startsWith("let ") ||
           trimmed.startsWith("var ") ||
           trimmed.startsWith("function ") ||
           trimmed.startsWith("class ") ||
           trimmed.startsWith("async ") ||
           trimmed.startsWith("//");
  });

  // Remove everything before first code line
  if (firstCodeLine > 0) {
    cleaned = lines.slice(firstCodeLine).join("\n");
  }

  // 4. Remove bare identifiers before function/const declarations
  // Handles cases like: "TodoList;\n\nfunction TodoList() {}"
  cleaned = cleaned.replace(/^\s*[A-Z][a-zA-Z0-9]*;\s*\n+(?=\s*(?:function|const|export|class))/gm, "");

  // 5. Remove trailing explanatory text after last closing brace/semicolon
  const lastCodeIndex = Math.max(
    cleaned.lastIndexOf("}"),
    cleaned.lastIndexOf(";")
  );
  if (lastCodeIndex > 0 && lastCodeIndex < cleaned.length - 50) {
    // If there's more than 50 chars after last code, might be explanation
    cleaned = cleaned.substring(0, lastCodeIndex + 1);
  }

  // 6. Trim whitespace
  return cleaned.trim();
}
