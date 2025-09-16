/**
 * Utility functions for parsing AI responses and extracting thinking sections
 */

import { ReasoningStep } from '../types'

export interface ParsedAIResponse {
  thinking?: string
  content: string
  reasoningSteps?: ReasoningStep[]
}

/**
 * Parses AI response to extract thinking sections from the content
 * Supports various thinking formats:
 * - <thinking>...</thinking>
 * - <!-- thinking: ... -->
 * - [Thinking: ...]
 * - ReAct reasoning patterns
 */
export function parseAIResponse(response: string): ParsedAIResponse {
  let thinking: string | undefined
  let content = response

  // Pattern 1: XML-style thinking tags
  const xmlThinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/i)
  if (xmlThinkingMatch) {
    thinking = xmlThinkingMatch[1].trim()
    content = response.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
  }

  // Pattern 2: HTML comment style thinking
  const commentThinkingMatch = response.match(/<!--\s*thinking:\s*([\s\S]*?)-->/i)
  if (commentThinkingMatch) {
    thinking = commentThinkingMatch[1].trim()
    content = response.replace(/<!--\s*thinking:\s*[\s\S]*?-->/gi, '').trim()
  }

  // Pattern 3: Bracket-style thinking
  const bracketThinkingMatch = response.match(/\[thinking:\s*([\s\S]*?)\]/i)
  if (bracketThinkingMatch) {
    thinking = bracketThinkingMatch[1].trim()
    content = response.replace(/\[thinking:\s*[\s\S]*?\]/gi, '').trim()
  }

  // Pattern 4: ReAct reasoning patterns (extract thought steps)
  const thoughtPattern = /(?:^|\n)(?:Thought:|THOUGHT:|🤔\s*)([\s\S]*?)(?=\n(?:Action:|ACTION:|Observation:|OBSERVATION:|Final Answer:|FINAL ANSWER:|\n|$))/gi
  const thoughtMatches = Array.from(response.matchAll(thoughtPattern))
  if (thoughtMatches.length > 0) {
    thinking = thoughtMatches
      .map(match => match[1].trim())
      .filter(thought => thought.length > 0)
      .join('\n\n')
    
    // Don't remove ReAct patterns from content as they might be part of the response
  }

  // Pattern 5: Chain of thought with explicit reasoning markers
  const cotPattern = /(?:Let me think about this|I need to consider|My reasoning is):\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/gi
  const cotMatches = Array.from(response.matchAll(cotPattern))
  if (cotMatches.length > 0 && !thinking) {
    thinking = cotMatches
      .map(match => match[0].trim())
      .join('\n\n')
    
    // For CoT, we typically keep the reasoning in the content too
  }

  // Clean up content
  content = content
    .replace(/^\s*\n+/, '') // Remove leading newlines
    .replace(/\n+\s*$/, '') // Remove trailing newlines
    .trim()

  return {
    thinking: thinking && thinking.length > 0 ? thinking : undefined,
    content: content || response // Fallback to original response if content is empty
  }
}

/**
 * Extracts a summary of the thinking process for display in collapsed state
 */
export function extractThinkingSummary(thinking: string, maxLength: number = 100): string {
  if (!thinking) return ''
  
  // Try to find the first sentence or key insight
  const firstSentence = thinking.split(/[.!?]\s+/)[0]
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence + (thinking.includes('.') || thinking.includes('!') || thinking.includes('?') ? '.' : '')
  }
  
  // If no clear sentence, truncate at word boundary
  if (thinking.length <= maxLength) {
    return thinking
  }
  
  const truncated = thinking.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

/**
 * Detects if a response contains thinking patterns
 */
export function hasThinkingContent(response: string): boolean {
  const patterns = [
    /<thinking>[\s\S]*?<\/thinking>/i,
    /<!--\s*thinking:\s*[\s\S]*?-->/i,
    /\[thinking:\s*[\s\S]*?\]/i,
    /(?:^|\n)(?:Thought:|THOUGHT:|🤔\s*)/m,
    /(?:Let me think about this|I need to consider|My reasoning is):/i
  ]
  
  return patterns.some(pattern => pattern.test(response))
}

/**
 * Parses ReAct-style reasoning from response text
 */
export function parseReActReasoning(response: string): ReasoningStep[] {
  const steps: ReasoningStep[] = []
  let stepId = 0

  // Pattern to match ReAct steps - supports various formats
  const stepPatterns = [
    // Format: **Thought:** content
    { type: 'thought', regex: /(?:^\*\*Thought:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Action|Observation|Final[_ ]answer):|$))/gim },
    // Format: **Action:** content  
    { type: 'action', regex: /(?:^\*\*Action:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Thought|Observation|Final[_ ]answer):|$))/gim },
    // Format: **Observation:** content
    { type: 'observation', regex: /(?:^\*\*Observation:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Thought|Action|Final[_ ]answer):|$))/gim },
    // Format: **Final_answer:** or **Final Answer:** content
    { type: 'final_answer', regex: /(?:^\*\*Final[_ ]?[Aa]nswer:\*\*\s*([\s\S]*?)$)/gim },

    // Format: 🤖 AI Assistant [timestamp] **Thought:** content
    { type: 'thought', regex: /🤖[\s\S]*?\*\*Thought:\*\*\s*([\s\S]*?)(?=\n🤖|$)/gim },
    { type: 'action', regex: /🤖[\s\S]*?\*\*Action:\*\*\s*([\s\S]*?)(?=\n🤖|$)/gim },
    { type: 'observation', regex: /🤖[\s\S]*?\*\*Observation:\*\*\s*([\s\S]*?)(?=\n🤖|$)/gim },
    { type: 'final_answer', regex: /🤖[\s\S]*?\*\*Final[_ ]?[Aa]nswer:\*\*\s*([\s\S]*?)(?=\n🤖|$)/gim },

    // Simple format: Thought: content
    { type: 'thought', regex: /(?:^|\n)Thought:\s*([\s\S]*?)(?=\nAction:|$)/gim },
    { type: 'action', regex: /(?:^|\n)Action:\s*([\s\S]*?)(?=\nObservation:|$)/gim },
    { type: 'observation', regex: /(?:^|\n)Observation:\s*([\s\S]*?)(?=\nThought:|$)/gim },
  ]

  stepPatterns.forEach(({ type, regex }) => {
    let match
    while ((match = regex.exec(response)) !== null) {
      const content = match[1].trim()
      if (content) {
        steps.push({
          id: `step_${stepId++}_${type}`,
          type: type as ReasoningStep['type'],
          content,
          timestamp: new Date().toISOString(),
        })
      }
    }
  })

  // Sort steps by their appearance in the original text
  steps.sort((a, b) => {
    const aIndex = response.indexOf(a.content)
    const bIndex = response.indexOf(b.content)
    return aIndex - bIndex
  })

  return steps
}

/**
 * Enhanced parseAIResponse that includes ReAct reasoning
 */
export function parseAIResponseWithReasoning(response: string): ParsedAIResponse {
  const basicParse = parseAIResponse(response)
  const reasoningSteps = parseReActReasoning(response)
  
  return {
    ...basicParse,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined
  }
}

/**
 * Detects if response contains ReAct-style reasoning
 */
export function hasReActReasoning(response: string): boolean {
  const reactPatterns = [
    /\*\*(?:Thought|Action|Observation|Final[_ ]?[Aa]nswer):\*\*/,
    /(?:^|\n)(?:Thought|Action|Observation):/m,
    /🤖[\s\S]*?\*\*(?:Thought|Action|Observation):\*\*/,
  ]
  
  return reactPatterns.some(pattern => pattern.test(response))
}