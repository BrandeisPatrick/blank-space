/**
 * User Usage & Subscription Endpoint
 *
 * GET /api/user/usage
 * Returns current usage, quota limits, and subscription info
 * Model: Daily burst limit + Monthly total budget
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';
import { TIER_QUOTAS } from '../config/_quotas.js';
import {
  createDefaultUsage,
  migrateUsage,
  resetCountersIfNeeded,
} from '../utils/_usageHelpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const user = userDoc.data();
    const tier = user.subscription?.tier || 'free';
    const tierConfig = TIER_QUOTAS[tier] || TIER_QUOTAS.free;

    // Initialize or migrate usage to flat structure
    let usage = user.usage ? migrateUsage(user.usage) : createDefaultUsage();
    const now = new Date();
    let usageUpdated = false;

    // Reset counters if needed
    if (resetCountersIfNeeded(usage, 'lite', now)) usageUpdated = true;
    if (resetCountersIfNeeded(usage, 'pro', now)) usageUpdated = true;

    // Check if migration happened (old structure had weekly or didn't have liteDailyCount)
    if (user.usage && (user.usage.liteDailyCount === undefined || user.usage.liteWeeklyCount !== undefined)) {
      usageUpdated = true;
    }

    // Update if reset occurred or migration happened
    if (usageUpdated) {
      await userRef.update({ usage });
    }

    // Get limits
    const liteLimits = tierConfig.liteModel;
    const proLimits = tierConfig.proModel;

    // Calculate remaining and percent for lite model
    const liteRemaining = {
      daily: Math.max(0, liteLimits.daily - usage.liteDailyCount),
      monthly: Math.max(0, liteLimits.monthly - usage.liteMonthlyCount),
    };
    const litePercent = {
      daily: Math.round((usage.liteDailyCount / liteLimits.daily) * 100),
      monthly: Math.round((usage.liteMonthlyCount / liteLimits.monthly) * 100),
    };

    // Calculate remaining and percent for pro model (if available)
    let proRemaining = null;
    let proPercent = null;
    if (proLimits) {
      proRemaining = {
        daily: Math.max(0, proLimits.daily - usage.proDailyCount),
        monthly: Math.max(0, proLimits.monthly - usage.proMonthlyCount),
      };
      proPercent = {
        daily: Math.round((usage.proDailyCount / proLimits.daily) * 100),
        monthly: Math.round((usage.proMonthlyCount / proLimits.monthly) * 100),
      };
    }

    return res.status(200).json({
      success: true,
      tier,
      tierConfig,
      allTiers: TIER_QUOTAS,
      subscription: {
        tier,
        status: user.subscription?.status || 'active',
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      },
      // Per-model usage (formatted for frontend)
      usage: {
        lite: {
          daily: usage.liteDailyCount,
          monthly: usage.liteMonthlyCount,
        },
        pro: proLimits ? {
          daily: usage.proDailyCount,
          monthly: usage.proMonthlyCount,
        } : null,
        lastRequestAt: usage.lastRequestAt,
      },
      // Per-model limits
      limits: {
        lite: liteLimits,
        pro: proLimits,
      },
      // Per-model remaining
      remaining: {
        lite: liteRemaining,
        pro: proRemaining,
      },
      // Per-model percent used
      percentUsed: {
        lite: litePercent,
        pro: proPercent,
      },
      // Per-model reset times
      resetAt: {
        lite: {
          daily: usage.liteDailyResetAt,
          monthly: usage.liteMonthlyResetAt,
        },
        pro: proLimits ? {
          daily: usage.proDailyResetAt,
          monthly: usage.proMonthlyResetAt,
        } : null,
      },
      models: tierConfig.models,
      canUsePro: tierConfig.models.includes('pro'),
    });
  } catch (error) {
    console.error('Usage endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
