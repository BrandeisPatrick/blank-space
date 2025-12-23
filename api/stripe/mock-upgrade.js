/**
 * Mock Upgrade Endpoint (Development/Testing Only)
 *
 * POST /api/stripe/mock-upgrade
 * Body: { tier: 'free' | 'lite' | 'pro' }
 *
 * Directly upgrades user tier without Stripe payment.
 * Enable with ENABLE_MOCK_PAYMENTS=true environment variable.
 */

import { verifyAuth, getFirestore } from '../middleware/auth.js';

// Tier configurations
const VALID_TIERS = ['free', 'lite', 'pro'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if mock mode is enabled
  const mockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';

  if (!mockEnabled) {
    return res.status(403).json({
      error: 'Mock payments disabled',
      message: 'Set ENABLE_MOCK_PAYMENTS=true to enable mock upgrades.',
    });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const { tier } = req.body;

    // Validate tier
    if (!tier || !VALID_TIERS.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: `Tier must be one of: ${VALID_TIERS.join(', ')}`,
      });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);

    // Update subscription
    await userRef.update({
      'subscription.tier': tier,
      'subscription.status': 'active',
      'subscription.stripeCustomerId': `mock_cus_${userId.slice(0, 8)}`,
      'subscription.stripeSubscriptionId': tier === 'free' ? null : `mock_sub_${Date.now()}`,
      'subscription.stripePriceId': tier === 'free' ? null : `mock_price_${tier}`,
      'subscription.currentPeriodEnd': tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      'subscription.cancelAtPeriodEnd': false,
    });

    // Fetch updated user
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${tier} tier (mock mode)`,
      subscription: updatedData.subscription,
      mockMode: true,
    });
  } catch (error) {
    console.error('Mock upgrade error:', error);
    return res.status(500).json({
      error: 'Failed to upgrade',
      message: error.message,
    });
  }
}
