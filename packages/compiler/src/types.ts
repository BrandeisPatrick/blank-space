export interface CompilerInput {
  files: Record<string, string>
  entry: string
}

export interface CompilerOutput {
  html: string
  js: string
  css?: string
  errors?: string[]
  warnings?: string[]
}

export interface CompilerOptions {
  minify?: boolean
  sourcemap?: boolean
  target?: string
}