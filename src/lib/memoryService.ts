/**
 * Memory Service - Implements three-tier memory system
 * - Short-term: Current conversation context (handled by chatService)
 * - Mid-term: Session summaries and patterns (this service)
 * - Long-term: Persistent user profiles and knowledge base (future)
 */

import { ChatMessage } from '../types'

export interface ConversationSummary {
  id: string
  timestamp: number
  messageCount: number
  keyPoints: string[]
  userPreferences: UserPreference[]
  projectContext: string
  componentsGenerated: string[]
}

export interface UserPreference {
  type: 'styling' | 'framework' | 'naming' | 'structure' | 'library'
  preference: string
  confidence: number
  examples: string[]
}

export interface SessionMemory {
  summaries: ConversationSummary[]
  detectedPatterns: UserPreference[]
  currentProject: {
    name?: string
    description?: string
    techStack: string[]
    goals: string[]
  }
  totalMessageCount: number
}

export class MemoryService {
  private sessionMemory: SessionMemory = {
    summaries: [],
    detectedPatterns: [],
    currentProject: {
      techStack: [],
      goals: []
    },
    totalMessageCount: 0
  }

  private readonly SUMMARIZE_INTERVAL = 15 // Summarize every 15 messages
  private readonly MAX_SUMMARIES = 5 // Keep last 5 summaries

  /**
   * Add new messages and trigger summarization if needed
   */
  addMessages(messages: ChatMessage[]) {
    this.sessionMemory.totalMessageCount += messages.length

    // Check if we need to summarize
    if (this.shouldSummarize()) {
      this.summarizeRecentConversation(messages)
    }

    // Extract patterns from new messages
    this.extractPatterns(messages)
  }

  /**
   * Get current session context for AI prompts
   */
  getSessionContext(): string {
    const context: string[] = []

    // Add project context
    if (this.sessionMemory.currentProject.name) {
      context.push(`Project: ${this.sessionMemory.currentProject.name}`)
    }
    if (this.sessionMemory.currentProject.description) {
      context.push(`Description: ${this.sessionMemory.currentProject.description}`)
    }
    if (this.sessionMemory.currentProject.techStack.length > 0) {
      context.push(`Tech Stack: ${this.sessionMemory.currentProject.techStack.join(', ')}`)
    }

    // Add recent summaries
    const recentSummaries = this.sessionMemory.summaries.slice(-2)
    if (recentSummaries.length > 0) {
      context.push('\n--- Recent Conversation Summary ---')
      recentSummaries.forEach(summary => {
        context.push(`• ${summary.keyPoints.join(' • ')}`)
        if (summary.projectContext) {
          context.push(`• Project context: ${summary.projectContext}`)
        }
      })
    }

    // Add detected user preferences
    const highConfidencePrefs = this.sessionMemory.detectedPatterns.filter(p => p.confidence > 0.7)
    if (highConfidencePrefs.length > 0) {
      context.push('\n--- User Preferences ---')
      highConfidencePrefs.forEach(pref => {
        context.push(`• ${pref.type}: ${pref.preference}`)
      })
    }

    return context.join('\n')
  }

  /**
   * Get user preferences for specific type
   */
  getUserPreferences(type?: UserPreference['type']): UserPreference[] {
    if (type) {
      return this.sessionMemory.detectedPatterns.filter(p => p.type === type)
    }
    return this.sessionMemory.detectedPatterns
  }

  /**
   * Update project context
   */
  updateProjectContext(updates: Partial<SessionMemory['currentProject']>) {
    this.sessionMemory.currentProject = {
      ...this.sessionMemory.currentProject,
      ...updates
    }
  }

  /**
   * Export session memory for persistence
   */
  exportMemory(): SessionMemory {
    return { ...this.sessionMemory }
  }

  /**
   * Import session memory (for restoration)
   */
  importMemory(memory: SessionMemory) {
    this.sessionMemory = { ...memory }
  }

  /**
   * Reset session memory
   */
  reset() {
    this.sessionMemory = {
      summaries: [],
      detectedPatterns: [],
      currentProject: {
        techStack: [],
        goals: []
      },
      totalMessageCount: 0
    }
  }

  private shouldSummarize(): boolean {
    const lastSummary = this.sessionMemory.summaries[this.sessionMemory.summaries.length - 1]
    const messagesSinceLastSummary = lastSummary
      ? this.sessionMemory.totalMessageCount - lastSummary.messageCount
      : this.sessionMemory.totalMessageCount

    return messagesSinceLastSummary >= this.SUMMARIZE_INTERVAL
  }

  private summarizeRecentConversation(recentMessages: ChatMessage[]) {
    // Get messages since last summary
    const lastSummary = this.sessionMemory.summaries[this.sessionMemory.summaries.length - 1]
    const startIndex = lastSummary ? lastSummary.messageCount : 0

    // Extract key information from recent messages
    const keyPoints: string[] = []
    const componentsGenerated: string[] = []
    let projectContext = ''

    recentMessages.forEach(msg => {
      if (msg.type === 'user') {
        // Extract user requests and goals
        if (msg.content.toLowerCase().includes('build') || msg.content.toLowerCase().includes('create')) {
          keyPoints.push(`User requested: ${this.extractIntent(msg.content)}`)
        }
        if (msg.content.toLowerCase().includes('project') || msg.content.toLowerCase().includes('app')) {
          projectContext = this.extractProjectContext(msg.content)
        }
      } else if (msg.type === 'assistant') {
        // Extract what was built
        if (msg.artifactId) {
          componentsGenerated.push(this.extractComponentName(msg.content))
        }
      }
    })

    // Create summary
    const summary: ConversationSummary = {
      id: `summary_${Date.now()}`,
      timestamp: Date.now(),
      messageCount: this.sessionMemory.totalMessageCount,
      keyPoints,
      userPreferences: this.extractUserPreferencesFromMessages(recentMessages),
      projectContext,
      componentsGenerated
    }

    // Add to summaries and maintain max limit
    this.sessionMemory.summaries.push(summary)
    if (this.sessionMemory.summaries.length > this.MAX_SUMMARIES) {
      this.sessionMemory.summaries.shift()
    }

    console.log('📝 Created conversation summary:', summary)
  }

  private extractPatterns(messages: ChatMessage[]) {
    messages.forEach(msg => {
      if (msg.type === 'user') {
        // Detect styling preferences
        this.detectStylingPreferences(msg.content)

        // Detect framework preferences
        this.detectFrameworkPreferences(msg.content)

        // Detect naming conventions
        this.detectNamingPreferences(msg.content)

        // Detect structure preferences
        this.detectStructurePreferences(msg.content)
      }
    })
  }

  private detectStylingPreferences(content: string) {
    const lowerContent = content.toLowerCase()

    // CSS-in-JS preferences
    if (lowerContent.includes('styled-components') || lowerContent.includes('emotion')) {
      this.addOrUpdatePreference('styling', 'CSS-in-JS', 0.8, [content])
    }

    // Tailwind preferences
    if (lowerContent.includes('tailwind') || lowerContent.includes('utility-first')) {
      this.addOrUpdatePreference('styling', 'Tailwind CSS', 0.8, [content])
    }

    // CSS modules preferences
    if (lowerContent.includes('css modules') || lowerContent.includes('.module.css')) {
      this.addOrUpdatePreference('styling', 'CSS Modules', 0.8, [content])
    }

    // Color preferences
    const colors = ['blue', 'green', 'red', 'purple', 'pink', 'yellow', 'orange']
    colors.forEach(color => {
      if (lowerContent.includes(color)) {
        this.addOrUpdatePreference('styling', `Prefers ${color} colors`, 0.6, [content])
      }
    })
  }

  private detectFrameworkPreferences(content: string) {
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes('typescript') || lowerContent.includes('tsx')) {
      this.addOrUpdatePreference('framework', 'TypeScript', 0.9, [content])
    }

    if (lowerContent.includes('hooks') || lowerContent.includes('usestate') || lowerContent.includes('useeffect')) {
      this.addOrUpdatePreference('framework', 'React Hooks', 0.8, [content])
    }
  }

  private detectNamingPreferences(content: string) {
    // Detect camelCase vs PascalCase preferences
    const camelCasePattern = /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g
    const pascalCasePattern = /\b[A-Z][a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g

    const camelCaseMatches = content.match(camelCasePattern) || []
    const pascalCaseMatches = content.match(pascalCasePattern) || []

    if (camelCaseMatches.length > pascalCaseMatches.length) {
      this.addOrUpdatePreference('naming', 'camelCase', 0.6, [content])
    } else if (pascalCaseMatches.length > camelCaseMatches.length) {
      this.addOrUpdatePreference('naming', 'PascalCase', 0.6, [content])
    }
  }

  private detectStructurePreferences(content: string) {
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes('component') && lowerContent.includes('folder')) {
      this.addOrUpdatePreference('structure', 'Component-based folders', 0.7, [content])
    }

    if (lowerContent.includes('pages') || lowerContent.includes('views')) {
      this.addOrUpdatePreference('structure', 'Pages/Views structure', 0.7, [content])
    }
  }

  private addOrUpdatePreference(type: UserPreference['type'], preference: string, confidence: number, examples: string[]) {
    const existing = this.sessionMemory.detectedPatterns.find(p => p.type === type && p.preference === preference)

    if (existing) {
      // Update confidence (weighted average)
      existing.confidence = (existing.confidence + confidence) / 2
      existing.examples.push(...examples)
      // Keep only last 3 examples
      existing.examples = existing.examples.slice(-3)
    } else {
      this.sessionMemory.detectedPatterns.push({
        type,
        preference,
        confidence,
        examples: examples.slice(0, 3)
      })
    }
  }

  private extractIntent(content: string): string {
    // Simple intent extraction - could be enhanced with NLP
    const words = content.toLowerCase().split(' ')
    const buildIndex = words.findIndex(w => ['build', 'create', 'make', 'generate'].includes(w))

    if (buildIndex !== -1 && buildIndex < words.length - 1) {
      return words.slice(buildIndex, buildIndex + 5).join(' ')
    }

    return content.slice(0, 50) + '...'
  }

  private extractProjectContext(content: string): string {
    // Extract project-related information
    const sentences = content.split('.')
    const projectSentence = sentences.find(s =>
      s.toLowerCase().includes('project') ||
      s.toLowerCase().includes('app') ||
      s.toLowerCase().includes('website')
    )

    return projectSentence ? projectSentence.trim() : ''
  }

  private extractComponentName(content: string): string {
    // Extract component name from success messages
    const match = content.match(/created?\s+(?:a\s+)?(.+?)(?:\s+component|\s+is|\.|$)/i)
    return match ? match[1] : 'Unknown component'
  }

  private extractUserPreferencesFromMessages(messages: ChatMessage[]): UserPreference[] {
    const preferences: UserPreference[] = []

    messages.forEach(msg => {
      if (msg.type === 'user') {
        // This is a simplified version - the detectPatterns method handles this more thoroughly
        const content = msg.content.toLowerCase()

        if (content.includes('dark theme') || content.includes('dark mode')) {
          preferences.push({
            type: 'styling',
            preference: 'Dark theme',
            confidence: 0.9,
            examples: [msg.content]
          })
        }

        if (content.includes('responsive') || content.includes('mobile')) {
          preferences.push({
            type: 'structure',
            preference: 'Responsive design',
            confidence: 0.8,
            examples: [msg.content]
          })
        }
      }
    })

    return preferences
  }
}

// Singleton instance
export const memoryService = new MemoryService()