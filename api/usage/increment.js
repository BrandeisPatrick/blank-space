/**
 * Usage Increment Endpoint
 *
 * POST /api/usage/increment
 * Increments usage by 1 for the authenticated user.
 * Called by frontend after a generation completes (counts per-generation, not per-API-call).
 */

import { verifyAuth } from '../middleware/_auth.js';
import { incrementUsage, canAccessModel } from '../middleware/_quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId, tier } = authResult;
    const { modelTier = 'lite' } = req.body;

    // Validate modelTier
    if (!['lite', 'pro'].includes(modelTier)) {
      return res.status(400).json({
        error: 'Invalid modelTier',
        message: 'modelTier must be "lite" or "pro"',
      });
    }

    // Check if user can access this model tier
    if (!canAccessModel(tier || 'free', modelTier)) {
      return res.status(403).json({
        error: 'Model not accessible',
        message: `Your subscription does not include access to the ${modelTier} model`,
      });
    }

    // Increment usage
    await incrementUsage(userId, modelTier);

    return res.status(200).json({
      success: true,
      modelTier,
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
