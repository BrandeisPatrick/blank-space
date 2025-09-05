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
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Simple chat response generation
    let response = '';
    const messageLower = message.toLowerCase();

    // Generate contextual responses based on the context and message
    if (context?.hasActiveCode) {
      if (messageLower.includes('explain') || messageLower.includes('what')) {
        response = `I can see you have active code. ${message.includes('this') ? 'This code' : 'Your code'} appears to be a React component. Would you like me to explain how it works or help you modify it?`;
      } else if (messageLower.includes('modify') || messageLower.includes('change')) {
        response = `I can help you modify your active code. What specific changes would you like to make? I can update styling, add functionality, or refactor the structure.`;
      } else {
        response = `I can help you with your active code. You can ask me to explain it, modify it, or create something new. What would you like to do?`;
      }
    } else {
      // No active code responses
      if (messageLower.includes('create') || messageLower.includes('build') || messageLower.includes('make')) {
        response = `I'd love to help you create something! I can build React components, websites, forms, and interactive applications. What would you like me to create?`;
      } else if (messageLower.includes('help')) {
        response = `I'm here to help! I can:
        
• Create React components and websites
• Generate interactive applications  
• Explain code and provide tutorials
• Help with styling and design
• Build forms, dashboards, and more

What would you like to work on?`;
      } else if (messageLower.includes('hello') || messageLower.includes('hi')) {
        response = `Hello! I'm your AI coding assistant. I can help you create React components, build websites, and develop interactive applications. What would you like to build today?`;
      } else {
        response = `I understand you're asking about: "${message}". I can help you with React development, component creation, and web application building. Would you like me to create something specific or explain a concept?`;
      }
    }

    res.status(200).json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      context: {
        hasActiveCode: context?.hasActiveCode || false,
        responseMode: context?.responseMode || 'show-options'
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during chat processing'
    });
  }
}