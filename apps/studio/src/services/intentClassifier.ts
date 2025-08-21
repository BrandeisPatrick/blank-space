export interface IntentResult {
  intent: 'conversation' | 'generation' | 'modification' | 'explanation'
  confidence: number
  suggestedAction?: string
}

export class IntentClassifier {
  private conversationPatterns = [
    // Greetings (flexible matching for creative spelling)
    /h+e+l+o+w*/i,  // matches hello, hellooo, helo, hellllow, etc.
    /h+i+y*/i,      // matches hi, hiii, hiy, etc.
    /h+e+y+/i,      // matches hey, heyy, heyyy, etc.
    /good\s+(morning|afternoon|evening)/i,
    /greetings?/i,
    
    // Personal questions (flexible)
    /(how\s+(is|are)\s+(you|ur|your)\s*(day|doing|things)?)/i,
    /(what\s*'?s\s*up)/i,
    /(how\s*'?s\s*it\s*going)/i,
    /(how\s*have\s*you\s*been)/i,
    /howdy/i,
    
    // Questions about the assistant
    /(what\s+(can\s+you\s+do|do\s+you\s+do|are\s+you))/i,
    /(who\s+are\s+you)/i,
    /(help|how\s+does\s+this\s+work|what\s+features)/i,
    
    // Small talk
    /(weather|coffee|tired|busy|weekend|monday|friday|morning|afternoon|evening)/i,
    
    // General chat
    /(thanks?|thank\s+you|nice|cool|awesome|great)/i,
    /(bye|goodbye|see\s+you)/i,
  ]

  private generationPatterns = [
    // Explicit generation requests
    /(create|build|make|generate|design|develop) (a |an )?website/i,
    /(create|build|make|generate) (a |an )?(page|site|app|application)/i,
    /(build|create) (me )?a .*(portfolio|blog|dashboard|landing page)/i,
    
    // Website types
    /(portfolio|blog|e-?commerce|dashboard|landing page) (website|page|site)/i,
    /website (for|about|with)/i,
    
    // Component requests
    /(navigation|header|footer|sidebar|form|button) component/i,
    /(login|signup|contact) (form|page)/i,
  ]

  private modificationPatterns = [
    // Changes to existing code
    /(change|update|modify|edit|fix) (this|the)/i,
    /(add|remove|delete) .* (to|from) (this|the)/i,
    /(make it|make this) (bigger|smaller|red|blue|responsive)/i,
    
    // Style changes
    /change the (color|background|font|size)/i,
    /(center|align|move) (this|the)/i,
  ]

  private explanationPatterns = [
    // Code explanation requests
    /(what does this do|explain this|how does this work)/i,
    /(what is this|tell me about this)/i,
    /why (is|does) (this|the)/i,
    
    // Learning requests
    /(how do I|how to|show me how)/i,
    /(what'?s the difference between|compare)/i,
  ]

  classify(message: string, hasActiveCode: boolean = false): IntentResult {
    const trimmed = message.trim()
    
    // Check conversation patterns first (highest priority for short messages)
    if (trimmed.length < 50) {
      for (const pattern of this.conversationPatterns) {
        if (pattern.test(trimmed)) {
          return {
            intent: 'conversation',
            confidence: 0.9,
            suggestedAction: 'Provide friendly conversational response'
          }
        }
      }
    }

    // If user has code selected/active, context changes
    if (hasActiveCode) {
      // Check modification patterns
      for (const pattern of this.modificationPatterns) {
        if (pattern.test(message)) {
          return {
            intent: 'modification',
            confidence: 0.85,
            suggestedAction: 'Modify existing code'
          }
        }
      }

      // Check explanation patterns
      for (const pattern of this.explanationPatterns) {
        if (pattern.test(message)) {
          return {
            intent: 'explanation',
            confidence: 0.8,
            suggestedAction: 'Explain the selected code'
          }
        }
      }
    }

    // Check generation patterns
    for (const pattern of this.generationPatterns) {
      if (pattern.test(message)) {
        return {
          intent: 'generation',
          confidence: 0.9,
          suggestedAction: 'Generate new website/component'
        }
      }
    }

    // Fallback logic based on message characteristics
    const words = trimmed.split(/\s+/)
    const wordCount = words.length

    // Short messages are likely conversational
    if (wordCount <= 5) {
      return {
        intent: 'conversation',
        confidence: 0.6,
        suggestedAction: 'Treat as conversation'
      }
    }

    // Medium messages with specific keywords
    const generationKeywords = [
      'website', 'page', 'site', 'app', 'application', 'component',
      'create', 'build', 'make', 'design', 'develop', 'generate'
    ]
    
    const hasGenerationKeywords = generationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )

    if (hasGenerationKeywords) {
      return {
        intent: 'generation',
        confidence: 0.7,
        suggestedAction: 'Generate code based on description'
      }
    }

    // Long messages without clear keywords - likely generation requests
    if (wordCount > 15) {
      return {
        intent: 'generation',
        confidence: 0.5,
        suggestedAction: 'Assume user wants to generate something'
      }
    }

    // Default to conversation for ambiguous cases
    return {
      intent: 'conversation',
      confidence: 0.4,
      suggestedAction: 'Provide conversational response and ask for clarification'
    }
  }

  // Get suggestions for how to improve unclear requests
  getSuggestions(intent: string, confidence: number): string[] {
    if (confidence < 0.6) {
      switch (intent) {
        case 'generation':
          return [
            "Try: 'Create a portfolio website with dark theme'",
            "Try: 'Build a landing page for my startup'",
            "Try: 'Make a contact form component'"
          ]
        case 'modification':
          return [
            "Select some code first, then ask me to modify it",
            "Try: 'Change the background color to blue'",
            "Try: 'Add a navigation bar to this page'"
          ]
        case 'conversation':
          return [
            "Ask me 'What can you do?' to learn about my features",
            "Say 'Hello' to start a conversation",
            "Tell me what kind of website you want to build"
          ]
      }
    }
    return []
  }
}

// Export singleton instance
export const intentClassifier = new IntentClassifier()