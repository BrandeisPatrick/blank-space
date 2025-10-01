import * as esbuild from 'esbuild-wasm'

export interface EsbuildBundleResult {
  code: string
  css: string
  html: string
  error?: string
  warnings?: string[]
}

export class EsbuildBundler {
  private static globallyInitialized = false
  private files: Record<string, string> = {}

  async initialize() {
    if (EsbuildBundler.globallyInitialized) return

    await esbuild.initialize({
      wasmURL: '/esbuild.wasm'
    })

    EsbuildBundler.globallyInitialized = true
    console.log('[esbuild] Initialized successfully')
  }

  /**
   * Resolve import path relative to current file (reused from bundler.ts logic)
   */
  private resolveImportPath(currentFile: string, importPath: string): string | null {
    const cleanPath = importPath.replace(/['"]/g, '')

    // Skip external packages (react, react-dom, etc.)
    if (!cleanPath.startsWith('.')) {
      return null
    }

    const currentDir = currentFile.includes('/')
      ? currentFile.substring(0, currentFile.lastIndexOf('/'))
      : ''

    let resolvedPath = cleanPath
    if (cleanPath.startsWith('./')) {
      resolvedPath = currentDir ? `${currentDir}/${cleanPath.slice(2)}` : cleanPath.slice(2)
    } else if (cleanPath.startsWith('../')) {
      const parts = currentDir.split('/').filter(Boolean)
      let path = cleanPath
      while (path.startsWith('../')) {
        parts.pop()
        path = path.slice(3)
      }
      resolvedPath = parts.length > 0 ? `${parts.join('/')}/${path}` : path
    }

    // Try different extensions
    const extensions = ['.tsx', '.ts', '.jsx', '.js']
    for (const ext of extensions) {
      if (this.files[resolvedPath + ext]) {
        return resolvedPath + ext
      }
    }

    // Try exact path
    if (this.files[resolvedPath]) {
      return resolvedPath
    }

    return null
  }

  /**
   * Get esbuild loader based on file extension
   */
  private getLoader(filePath: string): esbuild.Loader {
    if (filePath.endsWith('.tsx')) return 'tsx'
    if (filePath.endsWith('.ts')) return 'ts'
    if (filePath.endsWith('.jsx')) return 'jsx'
    if (filePath.endsWith('.js')) return 'js'
    if (filePath.endsWith('.css')) return 'css'
    if (filePath.endsWith('.json')) return 'json'
    return 'js'
  }

  /**
   * Bundle files using esbuild with virtual file system
   */
  async bundle(
    files: Record<string, string>,
    entryPoint: string
  ): Promise<EsbuildBundleResult> {
    await this.initialize()

    this.files = files

    try {
      // Create virtual file system plugin
      const virtualFilePlugin: esbuild.Plugin = {
        name: 'virtual-files',
        setup: (build) => {
          // Resolve CSS imports to virtual namespace (we inject CSS separately)
          build.onResolve({ filter: /\.css$/ }, (args) => {
            return {
              path: args.path,
              namespace: 'css-stub'
            }
          })

          // Load CSS imports as empty modules
          build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => {
            return {
              contents: '// CSS handled separately',
              loader: 'js'
            }
          })

          // Resolve relative imports from virtual files
          build.onResolve({ filter: /^\./ }, (args) => {
            const resolved = this.resolveImportPath(args.importer, args.path)
            if (resolved) {
              return {
                path: resolved,
                namespace: 'virtual'
              }
            }
            return null
          })

          // Resolve entry point
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.kind === 'entry-point') {
              return {
                path: args.path,
                namespace: 'virtual'
              }
            }
            return null
          })

          // Load files from memory
          build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
            const contents = this.files[args.path]
            if (contents !== undefined) {
              return {
                contents,
                loader: this.getLoader(args.path)
              }
            }
            return null
          })
        }
      }

      // Bundle with esbuild
      const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        format: 'esm',
        jsx: 'transform',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
        target: 'es2020',
        plugins: [virtualFilePlugin],
        external: ['react', 'react-dom'] // Use CDN for React
      })

      let bundledCode = result.outputFiles[0].text

      // Replace export with global assignment so we can render it in a separate script
      // This avoids invalid import placement (imports must be at top of module)
      // Match ANY identifier exported as default (e.g., "App_default", "App", etc.)

      // Match: export { App_default as default };
      bundledCode = bundledCode.replace(
        /export\s+\{\s*(\w+)\s+as\s+default\s*\};?/g,
        'window.__APP_COMPONENT__ = $1;'
      )

      // Match: export default App;
      bundledCode = bundledCode.replace(
        /export\s+default\s+(\w+);?/g,
        'window.__APP_COMPONENT__ = $1;'
      )

      // Collect CSS files
      const cssFiles = Object.keys(files).filter(path => path.endsWith('.css'))
      const cssContent = cssFiles.map(path => files[path]).join('\n')

      // Generate HTML with importmap for React CDN
      const html = this.generateHTML(bundledCode, cssContent)

      return {
        code: bundledCode,
        css: cssContent,
        html,
        warnings: result.warnings.map(w => w.text)
      }
    } catch (error) {
      console.error('[esbuild] Bundle failed:', error)
      return {
        code: '',
        css: '',
        html: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Generate HTML with bundled code and importmap for React CDN
   */
  private generateHTML(bundledCode: string, css: string): string {

    const instrumentationScript = `
    <script>
      (function () {
        try {
          window.__PREVIEW_CONSOLE_PATCH__ = true;

          const sendConsoleMessage = (type, args) => {
            try {
              const formatted = args.map((arg) => {
                if (typeof arg === 'string') return arg;
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (jsonError) {
                  return String(arg);
                }
              }).join(' ');

              window.parent.postMessage({
                type: 'console-message',
                message: {
                  type,
                  message: formatted,
                  timestamp: Date.now()
                }
              }, '*');
            } catch (postMessageError) {
              // Ignore postMessage errors silently to avoid recursion
            }
          };

          const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
          };

          ['log', 'warn', 'error', 'info'].forEach((method) => {
            console[method] = function (...args) {
              try {
                originalConsole[method].apply(console, args);
              } catch (callError) {
                // Ignore errors from calling the original console
              }
              sendConsoleMessage(method, args);
            };
          });

          window.addEventListener('error', (event) => {
            try {
              window.parent.postMessage({
                type: 'preview-error',
                error: {
                  message: event.message,
                  line: event.lineno,
                  source: event.filename,
                  timestamp: Date.now()
                }
              }, '*');
            } catch (postMessageError) {
              // Ignore postMessage errors
            }
          });

          window.addEventListener('unhandledrejection', (event) => {
            try {
              const reason = event.reason && event.reason.message ? event.reason.message : event.reason;
              window.parent.postMessage({
                type: 'preview-error',
                error: {
                  message: 'Promise rejection: ' + String(reason),
                  timestamp: Date.now()
                }
              }, '*');
            } catch (postMessageError) {
              // Ignore postMessage errors
            }
          });

          const ensureStorage = (name) => {
            try {
              const storage = window[name];
              if (!storage) throw new Error('Storage API unavailable');
              const testKey = '__preview_storage_test__';
              storage.setItem(testKey, 'test');
              storage.removeItem(testKey);
            } catch (storageError) {
              const store = new Map();
              const memoryStorage = {
                getItem(key) {
                  return store.has(String(key)) ? store.get(String(key)) : null;
                },
                setItem(key, value) {
                  store.set(String(key), String(value));
                },
                removeItem(key) {
                  store.delete(String(key));
                },
                clear() {
                  store.clear();
                },
                key(index) {
                  const keys = Array.from(store.keys());
                  return index >= 0 && index < keys.length ? keys[index] : null;
                }
              };
              Object.defineProperty(memoryStorage, 'length', {
                get() {
                  return store.size;
                }
              });

              let appliedFallback = false;
              let activeStorage = memoryStorage;
              try {
                Object.defineProperty(window, name, {
                  configurable: true,
                  enumerable: true,
                  get() {
                    return activeStorage;
                  },
                  set(value) {
                    try {
                      if (value && typeof value.getItem === 'function') {
                        value.getItem('__preview_storage_probe__');
                        activeStorage = value;
                        appliedFallback = false;
                        return;
                      }
                    } catch {
                      // Ignore and keep memory fallback
                    }
                    appliedFallback = true;
                    activeStorage = memoryStorage;
                  }
                });
                appliedFallback = true;
              } catch (defineError) {
                try {
                  window[name] = memoryStorage;
                  appliedFallback = true;
                } catch {
                  appliedFallback = false;
                }
              }

              if (appliedFallback) {
                sendConsoleMessage('warn', [name + ' unavailable in sandbox - using in-memory fallback']);
              } else {
                sendConsoleMessage('error', ['Failed to install in-memory fallback for ' + name + ': ' + String(storageError)]);
              }
            }
          };

          ensureStorage('localStorage');
          ensureStorage('sessionStorage');

          sendConsoleMessage('info', ['[Preview Bootstrap] Instrumentation ready']);
        } catch (instrumentationError) {
          try {
            window.parent.postMessage({
              type: 'preview-error',
              error: {
                message: 'Instrumentation failed: ' + instrumentationError.message,
                timestamp: Date.now()
              }
            }, '*');
          } catch (postMessageError) {
            // Ignore postMessage errors
          }
        }
      })();
    </script>`;

    // Build HTML using string concatenation to avoid nested template literal issues
    let html = '<!DOCTYPE html>\n';
    html += '<html lang="en">\n';
    html += '<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '  <title>React App</title>\n';
    html += '  <style>\n';
    html += '    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }\n';
    html += '    /* CSS length: ' + css.length + ' */\n';
    html += '    ' + css + '\n';
    html += '  </style>\n';
    html += '  <script type="importmap">\n';
    html += '  {\n';
    html += '    "imports": {\n';
    html += '      "react": "https://esm.sh/react@18.2.0",\n';
    html += '      "react/": "https://esm.sh/react@18.2.0/",\n';
    html += '      "react-dom": "https://esm.sh/react-dom@18.2.0",\n';
    html += '      "react-dom/": "https://esm.sh/react@18.2.0/",\n';
    html += '      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"\n';
    html += '    }\n';
    html += '  }\n';
    html += '  </script>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '  <div id="root"></div>\n\n';

    // Instrumentation script
    html += instrumentationScript + '\n\n';

    // Bundled code module
    html += '  <script type="module">\n';
    html += bundledCode + '\n';
    html += '  </script>\n\n';

    // Render module script
    html += '  <script type="module">\n';
    html += '    const notifyPreviewStatus = (stage, detail) => {\n';
    html += '      try {\n';
    html += '        const payload = detail ? { stage, detail } : { stage };\n';
    html += '        console.log(\'[Preview Status]\', stage, detail || \'\');\n';
    html += '        window.parent.postMessage(Object.assign({ type: \'preview-status\' }, payload), \'*\');\n';
    html += '      } catch (statusError) {\n';
    html += '        console.warn(\'[Preview Status] Failed to notify parent window:\', statusError);\n';
    html += '      }\n';
    html += '    };\n\n';
    html += '    const notifyPreviewReady = (status) => {\n';
    html += '      try {\n';
    html += '        console.log(\'[Preview Render] Sending preview-ready message (\' + status + \')\');\n';
    html += '        window.parent.postMessage({ type: \'preview-ready\' }, \'*\');\n';
    html += '      } catch (postMessageError) {\n';
    html += '        console.warn(\'[Preview Render] Failed to notify parent window:\', postMessageError);\n';
    html += '      }\n';
    html += '    };\n\n';
    html += '    async function renderApp() {\n';
    html += '      notifyPreviewStatus(\'render-start\');\n\n';
    html += '      try {\n';
    html += '        if (!window.__APP_COMPONENT__) {\n';
    html += '          throw new Error(\'Component not found on window.__APP_COMPONENT__\');\n';
    html += '        }\n\n';
    html += '        notifyPreviewStatus(\'import-react-start\');\n';
    html += '        const ReactModule = await import(\'react\');\n';
    html += '        notifyPreviewStatus(\'import-react-complete\');\n\n';
    html += '        notifyPreviewStatus(\'import-react-dom-start\');\n';
    html += '        const ReactDOMModule = await import(\'react-dom/client\');\n';
    html += '        notifyPreviewStatus(\'import-react-dom-complete\');\n\n';
    html += '        const React = ReactModule.default || ReactModule;\n';
    html += '        const ReactDOM = ReactDOMModule.default || ReactDOMModule;\n';
    html += '        notifyPreviewStatus(\'react-bindings-ready\');\n\n';
    html += '        const rootElement = document.getElementById(\'root\');\n';
    html += '        if (!rootElement) {\n';
    html += '          throw new Error(\'Preview root element not found\');\n';
    html += '        }\n';
    html += '        const root = ReactDOM.createRoot(rootElement);\n';
    html += '        notifyPreviewStatus(\'root-created\');\n\n';
    html += '        root.render(React.createElement(window.__APP_COMPONENT__));\n';
    html += '        notifyPreviewStatus(\'render-invoked\');\n\n';
    html += '        notifyPreviewReady(\'success\');\n';
    html += '        notifyPreviewStatus(\'render-complete\');\n\n';
    html += '        // Post-render validation: Check if content is actually visible\n';
    html += '        setTimeout(() => {\n';
    html += '          const rootEl = document.getElementById(\'root\');\n';
    html += '          if (rootEl) {\n';
    html += '            const hasContent = rootEl.children.length > 0;\n';
    html += '            const contentLength = rootEl.innerHTML.length;\n';
    html += '            const hasHeight = rootEl.offsetHeight > 0;\n';
    html += '            const hasWidth = rootEl.offsetWidth > 0;\n\n';
    html += '            if (!hasContent || !hasHeight) {\n';
    html += '              console.error(\'[Post-Render Validation] Content issue detected:\', {\n';
    html += '                hasChildren: hasContent,\n';
    html += '                childrenCount: rootEl.children.length,\n';
    html += '                contentLength: contentLength,\n';
    html += '                offsetHeight: rootEl.offsetHeight,\n';
    html += '                offsetWidth: rootEl.offsetWidth,\n';
    html += '                computedDisplay: window.getComputedStyle(rootEl).display,\n';
    html += '                computedVisibility: window.getComputedStyle(rootEl).visibility\n';
    html += '              });\n\n';
    html += '              if (!hasContent) {\n';
    html += '                rootEl.innerHTML = \'<div style="padding: 20px; font-family: monospace; color: red; background: #ffe6e6; border: 2px solid red; margin: 20px; border-radius: 8px;">\' +\n';
    html += '                  \'<h3>⚠ Render Validation Failed</h3>\' +\n';
    html += '                  \'<p><strong>Issue:</strong> Component rendered but produced no DOM elements</p>\' +\n';
    html += '                  \'<p><strong>Possible causes:</strong></p>\' +\n';
    html += '                  \'<ul>\' +\n';
    html += '                  \'<li>Component returns null or undefined</li>\' +\n';
    html += '                  \'<li>Conditional rendering that evaluates to false</li>\' +\n';
    html += '                  \'<li>Empty fragments or arrays</li>\' +\n';
    html += '                  \'</ul>\' +\n';
    html += '                  \'<p style="margin-top: 16px; font-size: 12px; color: #666;">Check console for component details</p>\' +\n';
    html += '                  \'</div>\';\n';
    html += '              } else if (!hasHeight) {\n';
    html += '                console.warn(\'[Post-Render Validation] Content exists but has no height - possible CSS issue\');\n';
    html += '              }\n';
    html += '            } else {\n';
    html += '              console.log(\'[Post-Render Validation] ✓ Content rendered successfully:\', {\n';
    html += '                children: rootEl.children.length,\n';
    html += '                height: rootEl.offsetHeight,\n';
    html += '                width: rootEl.offsetWidth\n';
    html += '              });\n';
    html += '            }\n';
    html += '          }\n';
    html += '        }, 1000);\n';
    html += '      } catch (error) {\n';
    html += '        console.error(\'[Preview Render] ERROR:\', error instanceof Error ? error.message : error);\n';
    html += '        console.error(\'[Preview Render] Full error:\', error);\n';
    html += '        if (error instanceof Error && error.stack) {\n';
    html += '          console.error(\'[Preview Render] Error stack:\', error.stack);\n';
    html += '        }\n\n';
    html += '        notifyPreviewStatus(\'render-error\', {\n';
    html += '          message: error instanceof Error ? error.message : String(error)\n';
    html += '        });\n\n';
    html += '        document.body.innerHTML = \'<div style="color: red; padding: 20px; font-family: monospace;">\' +\n';
    html += '          \'<h2>Render Error</h2>\' +\n';
    html += '          \'<pre>\' + (error instanceof Error ? error.message : String(error)) + \'</pre>\' +\n';
    html += '          \'<p style="margin-top: 20px; font-size: 14px;">Check console for details</p>\' +\n';
    html += '          \'</div>\';\n\n';
    html += '        notifyPreviewReady(\'error\');\n';
    html += '      }\n';
    html += '    }\n\n';
    html += '    renderApp().catch((renderError) => {\n';
    html += '      console.error(\'[Preview Render] Unhandled renderApp rejection:\', renderError);\n';
    html += '      notifyPreviewStatus(\'render-unhandled-rejection\', {\n';
    html += '        message: renderError instanceof Error ? renderError.message : String(renderError)\n';
    html += '      });\n';
    html += '      notifyPreviewReady(\'exception\');\n';
    html += '    });\n';
    html += '  </script>\n';
    html += '</body>\n';
    html += '</html>';

    return html;
  }
}
