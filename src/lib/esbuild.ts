import * as esbuild from 'esbuild-wasm'

let initialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize esbuild WASM module
 * This is a singleton pattern to ensure we only initialize once
 */
export async function initializeEsbuild(): Promise<void> {
  if (initialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  // Add required polyfills for esbuild WASM
  addEsbuildPolyfills()

  const ESBUILD_WASM_VERSION = '0.25.9' // keep in sync with package.json
  const wasmSources = [
    // Always try the exact package version first to avoid host/binary mismatch
    `https://unpkg.com/esbuild-wasm@${ESBUILD_WASM_VERSION}/esbuild.wasm`,
    `https://cdn.jsdelivr.net/npm/esbuild-wasm@${ESBUILD_WASM_VERSION}/esbuild.wasm`,
    // Then try pinned minor versions as a fallback
    'https://unpkg.com/esbuild-wasm@0.25/esbuild.wasm',
    'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25/esbuild.wasm',
    // Finally, try latest
    'https://unpkg.com/esbuild-wasm@latest/esbuild.wasm',
    'https://cdn.jsdelivr.net/npm/esbuild-wasm@latest/esbuild.wasm'
  ]

  initPromise = tryInitializeEsbuild(wasmSources, 0)
    .then(() => {
      initialized = true
      console.log('🚀 esbuild WASM initialized')
    })
    .catch((error) => {
      console.error('Failed to initialize esbuild WASM:', error)
      console.warn('Falling back to Babel transpilation')
      initPromise = null
      throw error
    })

  return initPromise
}

/**
 * Add polyfills required for esbuild WASM
 */
function addEsbuildPolyfills(): void {
  // Add global polyfill
  if (typeof (globalThis as any).global === 'undefined') {
    (globalThis as any).global = globalThis
  }

  // Add process polyfill
  if (typeof (globalThis as any).process === 'undefined') {
    (globalThis as any).process = {
      env: { NODE_ENV: 'development' },
      version: '18.0.0',
      platform: 'browser'
    }
  }

  // Add Buffer polyfill if needed
  if (typeof (globalThis as any).Buffer === 'undefined') {
    (globalThis as any).Buffer = {
      from: (data: any) => new Uint8Array(data),
      isBuffer: () => false
    }
  }
}

/**
 * Try initializing esbuild with multiple WASM sources
 */
async function tryInitializeEsbuild(sources: string[], index: number): Promise<void> {
  if (index >= sources.length) {
    const errorMsg = `All ${sources.length} esbuild WASM sources failed to load. This may be due to network issues or CORS restrictions.`
    console.error(errorMsg)
    console.log('Attempted sources:', sources)
    throw new Error(errorMsg)
  }

  const currentSource = sources[index]
  console.log(`🔄 Attempting to load esbuild WASM from source ${index + 1}/${sources.length}: ${currentSource}`)

  try {
    // Try with worker disabled first (more compatible)
    await esbuild.initialize({
      wasmURL: currentSource,
      worker: false
    })
    console.log(`✅ Successfully loaded esbuild WASM from: ${currentSource}`)
  } catch (error) {
    console.warn(`❌ esbuild WASM source ${index + 1} failed: ${currentSource}`)
    console.warn('Error details:', error)

    // If there's a host/binary version mismatch, prefer the host version by
    // continuing to the next source (which includes the pinned version first).
    return tryInitializeEsbuild(sources, index + 1)
  }
}

/**
 * Transform JSX/TSX code to JavaScript using esbuild
 */
export async function transformCode(
  code: string,
  options: {
    filename?: string
    jsx?: 'transform' | 'preserve'
    loader?: 'js' | 'jsx' | 'ts' | 'tsx'
  } = {}
): Promise<{ code: string; warnings: any[] }> {
  await initializeEsbuild()

  const {
    filename = 'input.jsx',
    jsx = 'transform',
    loader = filename.endsWith('.tsx') ? 'tsx' : 
             filename.endsWith('.ts') ? 'ts' :
             filename.endsWith('.jsx') ? 'jsx' : 'js'
  } = options

  try {
    const result = await esbuild.transform(code, {
      loader,
      jsx,
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'es2020',
      // Don't use IIFE format - keep functions in global scope
      sourcemap: 'inline',
      define: {
        'process.env.NODE_ENV': '"development"'
      }
    })

    return {
      code: sanitizeEsbuildOutput(result.code),
      warnings: result.warnings
    }
  } catch (error) {
    console.error('esbuild transform error:', error)
    throw error
  }
}

/**
 * Check if esbuild is initialized
 */
export function isEsbuildInitialized(): boolean {
  return initialized
}

/**
 * Transform React component with error handling and fallbacks
 */
export async function transformReactComponent(code: string): Promise<string> {
  try {
    const startTime = performance.now()
    const result = await transformCode(code, {
      loader: 'jsx',
      jsx: 'transform'
    })
    const endTime = performance.now()
    
    console.log(`⚡ esbuild transform completed in ${(endTime - startTime).toFixed(2)}ms`)

    // Return the transformed code directly without wrapping
    // This keeps the App function in the global scope
    return result.code
  } catch (error) {
    console.error('Failed to transform React component:', error)
    // Return original code as fallback
    return code
  }
}

/**
 * Strip ESM/CJS module syntax from esbuild output so it can run in a plain <script> tag.
 * Also normalises default exports to ensure an App symbol exists for ReactDOM to render.
 */
function sanitizeEsbuildOutput(code: string): string {
  let sanitized = code

  // Convert internal module imports (module_*) produced by the bundler into runtime require calls.
  sanitized = sanitized.replace(/import\s+([\w*\s{},]+)\s+from\s+['"](module_[^'"]+)['"];?/g, (_match, clause: string, specifier: string) => {
    return convertModuleImportClause(clause.trim(), specifier)
  })

  sanitized = sanitized.replace(/import\s+['"](module_[^'"]+)['"];?/g, (_match, specifier: string) => {
    return `require('${specifier}');`
  })

  // Remove remaining top-level import statements – runtime supplies React via globals.
  sanitized = sanitized.replace(/^\s*import\s+[^;]+;?\s*$/gm, '')

  let defaultExportName: string | null = null

  // Handle "export default Identifier" declarations.
  sanitized = sanitized.replace(/export\s+default\s+([\w$]+)\s*;?/gm, (_, name: string) => {
    defaultExportName = name
    return ''
  })

  // Handle re-export syntax: export { Identifier as default };
  sanitized = sanitized.replace(/export\s*\{\s*([\w$]+)\s+as\s+default\s*\};?/gm, (_, name: string) => {
    defaultExportName = name
    return ''
  })

  // Remove any remaining named export blocks.
  sanitized = sanitized.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '')

  // Normalise CommonJS default exports if present.
  sanitized = sanitized.replace(/module\.exports\s*=\s*([\w$]+)\s*;?/gm, (_, name: string) => {
    defaultExportName = name
    return ''
  })

  // Ensure an App identifier exists for the renderer.
  const hasAppIdentifier = /\bfunction\s+App\b|\b(const|let|var)\s+App\b/.test(sanitized)
  if (defaultExportName && (!hasAppIdentifier || defaultExportName !== 'App')) {
    sanitized += `\nconst App = ${defaultExportName};`
  }

  return sanitized.trim()
}

function convertModuleImportClause(clause: string, specifier: string): string {
  const tempVar = `__module_${specifier.replace(/[^a-zA-Z0-9_]/g, '_')}`
  const statements: string[] = [`const ${tempVar} = require('${specifier}');`]

  const { defaultImport, namedImport, namespaceImport } = parseImportClause(clause)

  if (defaultImport) {
    statements.push(`const ${defaultImport} = ${tempVar}.default ?? ${tempVar};`)
  }

  if (namespaceImport) {
    statements.push(`const ${namespaceImport} = ${tempVar};`)
  }

  if (namedImport) {
    statements.push(`const ${namedImport} = ${tempVar};`)
  }

  return statements.join('\n')
}

function parseImportClause(clause: string): {
  defaultImport: string | null
  namedImport: string | null
  namespaceImport: string | null
} {
  let buffer = clause.trim()
  let defaultImport: string | null = null
  let namedImport: string | null = null
  let namespaceImport: string | null = null

  const consume = (input: string): string => {
    buffer = buffer.slice(input.length).trim()
    return buffer
  }

  const parseRemaining = () => {
    if (!buffer) {
      return
    }

    if (buffer.startsWith('{')) {
      namedImport = buffer
      buffer = ''
      return
    }

    if (buffer.startsWith('*')) {
      const namespaceMatch = buffer.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)/)
      if (namespaceMatch) {
        namespaceImport = namespaceMatch[1]
        consume(namespaceMatch[0])
        if (buffer.startsWith(',')) {
          consume(',')
          parseRemaining()
        }
        return
      }
    }

    const commaIndex = buffer.indexOf(',')
    if (commaIndex === -1) {
      if (!defaultImport) {
        const candidate = buffer.trim()
        if (candidate) {
          defaultImport = candidate
        }
      }
      buffer = ''
      return
    }

    if (!defaultImport) {
      defaultImport = buffer.slice(0, commaIndex).trim()
    }
    buffer = buffer.slice(commaIndex + 1).trim()
    parseRemaining()
  }

  parseRemaining()

  return { defaultImport, namedImport, namespaceImport }
}
