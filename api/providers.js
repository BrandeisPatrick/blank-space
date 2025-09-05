import { setCorsHeaders, handleCorsOptions } from './utils/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (handleCorsOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Mock AI providers data
    const providers = [
      {
        name: 'Groq',
        configured: !!process.env.GROQ_API_KEY,
        models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
        isDefault: true,
        status: 'success',
        responseTime: 150,
        lastTested: new Date().toISOString(),
        testResponse: 'Groq AI is operational'
      },
      {
        name: 'OpenAI',
        configured: !!process.env.OPENAI_API_KEY,
        models: ['gpt-4', 'gpt-3.5-turbo'],
        isDefault: false,
        status: process.env.OPENAI_API_KEY ? 'success' : 'error',
        responseTime: 250,
        lastTested: new Date().toISOString(),
        testResponse: process.env.OPENAI_API_KEY ? 'OpenAI is operational' : 'API key not configured'
      },
      {
        name: 'Anthropic',
        configured: !!process.env.ANTHROPIC_API_KEY,
        models: ['claude-3-haiku', 'claude-3-sonnet'],
        isDefault: false,
        status: process.env.ANTHROPIC_API_KEY ? 'success' : 'error',
        responseTime: 200,
        lastTested: new Date().toISOString(),
        testResponse: process.env.ANTHROPIC_API_KEY ? 'Anthropic is operational' : 'API key not configured'
      },
      {
        name: 'Google Gemini',
        configured: !!process.env.GOOGLE_AI_API_KEY,
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
        isDefault: false,
        status: process.env.GOOGLE_AI_API_KEY ? 'success' : 'error',
        responseTime: 180,
        lastTested: new Date().toISOString(),
        testResponse: process.env.GOOGLE_AI_API_KEY ? 'Google Gemini is operational' : 'API key not configured'
      }
    ];

    res.status(200).json({
      success: true,
      providers,
      defaultProvider: providers.find(p => p.isDefault)?.name || 'Groq',
      totalProviders: providers.length,
      configuredProviders: providers.filter(p => p.configured).length
    });

  } catch (error) {
    console.error('Providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching providers'
    });
  }
}