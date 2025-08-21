export interface SandboxMessage {
  type: 'LOAD_BUNDLE' | 'READY' | 'RUNTIME_ERROR' | 'CONSOLE_LOG'
  payload?: any
}

export interface LoadBundleMessage {
  type: 'LOAD_BUNDLE'
  payload: {
    html: string
    js: string
    css?: string
  }
}

export interface ReadyMessage {
  type: 'READY'
  payload?: {
    timestamp: number
  }
}

export interface RuntimeErrorMessage {
  type: 'RUNTIME_ERROR'
  payload: {
    message: string
    stack?: string
    timestamp: number
  }
}

export interface ConsoleLogMessage {
  type: 'CONSOLE_LOG'
  payload: {
    level: 'log' | 'warn' | 'error' | 'info'
    args: any[]
    timestamp: number
  }
}