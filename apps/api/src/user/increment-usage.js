/**
 * Increment Usage Endpoint
 * POST /api/user/increment-usage
 * Called after a generation completes (not per API call)
 */

import { verifyAuth } from '../middleware/_auth.js';
import { incrementUsage } from '../middleware/_quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const { modelTier = 'lite' } = req.body;

    // Validate modelTier
    if (modelTier !== 'lite' && modelTier !== 'pro') {
      return res.status(400).json({ error: 'Invalid modelTier' });
    }

    const usage = await incrementUsage(userId, modelTier);

    return res.status(200).json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error('Increment usage error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
