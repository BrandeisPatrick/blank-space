import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' || req.method === 'POST') {
    return res.status(200).json({
      message: 'API endpoint working!',
      timestamp: new Date().toISOString()
    })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}