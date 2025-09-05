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
    const timestamp = new Date().toISOString();
    
    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp,
      uptime: '2h 34m', // Mock uptime data
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      message: 'AI-powered ReAct reasoning system is healthy'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Internal server error during health check'
    });
  }
}