/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly VITE_ENABLE_DEVELOPER_MODE?: string
  readonly VITE_DEVELOPER_PASSWORD?: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}