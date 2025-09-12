import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    success: true,
    message: 'Hello from Vercel API!',
    method: req.method,
    timestamp: new Date().toISOString()
  })
}