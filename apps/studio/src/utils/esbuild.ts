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

  const wasmSources = [
    'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
    'https://cdn.skypack.dev/-/esbuild-wasm@v0.19.12-dBxGgUt0qMtC77p7cD1Q/dist=es2019,mode=raw/esbuild.wasm',
    'https://esm.sh/esbuild-wasm@0.19.12/esbuild.wasm'
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
    throw new Error('All esbuild WASM sources failed to load')
  }

  try {
    await esbuild.initialize({
      wasmURL: sources[index],
      worker: false // Disable worker to avoid additional complexity
    })
  } catch (error) {
    console.warn(`esbuild WASM source ${index} failed:`, error)
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
      format: 'iife',
      globalName: '__esbuild_result__',
      sourcemap: 'inline',
      define: {
        'process.env.NODE_ENV': '"development"'
      }
    })

    return {
      code: result.code,
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
    
    // Wrap the transformed code to make it executable in browser
    const wrappedCode = `
      (function() {
        ${result.code}
        return __esbuild_result__;
      })();
    `
    
    return wrappedCode
  } catch (error) {
    console.error('Failed to transform React component:', error)
    // Return original code as fallback
    return code
  }
}