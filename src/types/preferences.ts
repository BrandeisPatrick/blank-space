export type AutomationLevel = 'conservative' | 'balanced' | 'aggressive'

export type ApprovalMode = 'manual' | 'auto-edit' | 'full-auto'

export interface UserPreferences {
  // Core automation settings
  automationLevel: AutomationLevel
  approvalMode: ApprovalMode
  
  // Per-operation permissions
  permissions: {
    fileEdits: boolean
    fileCreation: boolean
    styleChanges: boolean
    codeGeneration: boolean
    shellCommands: boolean
  }
  
  // Decision thresholds
  thresholds: {
    autoExecuteConfidence: number  // Above this confidence, auto-execute based on approval mode
    suggestionConfidence: number   // Above this confidence, provide suggestions
    conversationFallback: number   // Below this confidence, fall back to conversation
  }
  
  // UI preferences
  ui: {
    showConfidenceScores: boolean
    showPreviewChanges: boolean
    showUncertaintyIndicators: boolean
    enableProgressiveDisclosure: boolean
  }
  
  // Learning preferences
  learning: {
    adaptToUserPatterns: boolean
    rememberDecisions: boolean
    suggestWorkflowImprovements: boolean
  }
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  automationLevel: 'conservative',
  approvalMode: 'manual',
  
  permissions: {
    fileEdits: true,
    fileCreation: true,
    styleChanges: true,
    codeGeneration: true,
    shellCommands: false  // Conservative default for security
  },
  
  thresholds: {
    autoExecuteConfidence: 0.9,   // Very high confidence required
    suggestionConfidence: 0.6,    // Medium confidence for suggestions
    conversationFallback: 0.4     // Low confidence falls back to conversation
  },
  
  ui: {
    showConfidenceScores: false,        // Don't overwhelm new users
    showPreviewChanges: true,
    showUncertaintyIndicators: true,
    enableProgressiveDisclosure: true
  },
  
  learning: {
    adaptToUserPatterns: true,
    rememberDecisions: true,
    suggestWorkflowImprovements: true
  }
}

export const AUTOMATION_LEVEL_CONFIGS: Record<AutomationLevel, Partial<UserPreferences>> = {
  conservative: {
    approvalMode: 'manual',
    thresholds: {
      autoExecuteConfidence: 0.95,
      suggestionConfidence: 0.7,
      conversationFallback: 0.5
    },
    permissions: {
      fileEdits: true,
      fileCreation: true,
      styleChanges: true,
      codeGeneration: true,
      shellCommands: false
    }
  },
  
  balanced: {
    approvalMode: 'auto-edit',
    thresholds: {
      autoExecuteConfidence: 0.8,
      suggestionConfidence: 0.6,
      conversationFallback: 0.4
    },
    permissions: {
      fileEdits: true,
      fileCreation: true,
      styleChanges: true,
      codeGeneration: true,
      shellCommands: false
    }
  },
  
  aggressive: {
    approvalMode: 'full-auto',
    thresholds: {
      autoExecuteConfidence: 0.7,
      suggestionConfidence: 0.5,
      conversationFallback: 0.3
    },
    permissions: {
      fileEdits: true,
      fileCreation: true,
      styleChanges: true,
      codeGeneration: true,
      shellCommands: true  // Only in aggressive mode
    }
  }
}