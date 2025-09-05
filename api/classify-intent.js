import { setCorsHeaders, handleCorsOptions } from './utils/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (handleCorsOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { message, hasActiveCode = false, responseMode = 'show-options' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Simple rule-based intent classification
    const messageLower = message.toLowerCase();
    let intent = 'conversation';
    let confidence = 0.5;
    let reasoning = 'Default classification based on keywords';

    // Generation keywords
    const generationKeywords = [
      'build', 'create', 'make', 'generate', 'develop', 'design', 
      'component', 'app', 'website', 'page', 'form', 'button'
    ];

    // Modification keywords  
    const modificationKeywords = [
      'change', 'update', 'modify', 'edit', 'fix', 'improve', 
      'add', 'remove', 'delete', 'refactor'
    ];

    // Explanation keywords
    const explanationKeywords = [
      'explain', 'what', 'how', 'why', 'tell me', 'describe',
      'show me', 'help', 'understand'
    ];

    // Check for generation intent
    if (generationKeywords.some(keyword => messageLower.includes(keyword))) {
      intent = 'generation';
      confidence = 0.8;
      reasoning = 'Contains generation keywords';
    }
    // Check for modification intent (only if there's active code)
    else if (hasActiveCode && modificationKeywords.some(keyword => messageLower.includes(keyword))) {
      intent = 'modification';
      confidence = 0.8;
      reasoning = 'Contains modification keywords and has active code';
    }
    // Check for explanation intent
    else if (explanationKeywords.some(keyword => messageLower.includes(keyword))) {
      intent = 'explanation';
      confidence = 0.7;
      reasoning = 'Contains explanation keywords';
    }

    // Determine execution behavior based on response mode
    const shouldExecuteDirectly = responseMode === 'just-build';
    const shouldShowOptions = responseMode === 'show-options';

    res.status(200).json({
      success: true,
      intent,
      confidence,
      reasoning,
      shouldExecuteDirectly,
      shouldShowOptions
    });

  } catch (error) {
    console.error('Intent classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during intent classification'
    });
  }
}