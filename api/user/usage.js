/**
 * User Usage & Subscription Endpoint
 *
 * GET /api/user/usage
 * Returns current usage, quota limits, and subscription info
 * Model: Daily burst limit + Monthly total budget
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';
import { TIER_QUOTAS } from '../config/quotas.js';

/**
 * Get next reset times
 */
function getNextDailyReset() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.toISOString();
}

function getNextMonthlyReset() {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1, 0, 0, 0, 0
  ));
  return nextMonth.toISOString();
}

/**
 * Create default usage object (flat structure)
 */
function createDefaultUsage() {
  return {
    liteDailyCount: 0,
    liteDailyResetAt: getNextDailyReset(),
    liteMonthlyCount: 0,
    liteMonthlyResetAt: getNextMonthlyReset(),
    proDailyCount: 0,
    proDailyResetAt: getNextDailyReset(),
    proMonthlyCount: 0,
    proMonthlyResetAt: getNextMonthlyReset(),
    lastRequestAt: null,
  };
}

/**
 * Migrate old usage structure to new flat structure
 */
function migrateUsage(oldUsage) {
  // Already new flat structure (no weekly)
  if (oldUsage.liteDailyCount !== undefined && oldUsage.liteWeeklyCount === undefined) {
    return oldUsage;
  }

  const newUsage = createDefaultUsage();

  // Migrate from flat structure with weekly (remove weekly)
  if (oldUsage.liteDailyCount !== undefined) {
    newUsage.liteDailyCount = oldUsage.liteDailyCount;
    newUsage.liteDailyResetAt = oldUsage.liteDailyResetAt || getNextDailyReset();
    newUsage.liteMonthlyCount = oldUsage.liteMonthlyCount || 0;
    newUsage.liteMonthlyResetAt = oldUsage.liteMonthlyResetAt || getNextMonthlyReset();
    newUsage.proDailyCount = oldUsage.proDailyCount || 0;
    newUsage.proDailyResetAt = oldUsage.proDailyResetAt || getNextDailyReset();
    newUsage.proMonthlyCount = oldUsage.proMonthlyCount || 0;
    newUsage.proMonthlyResetAt = oldUsage.proMonthlyResetAt || getNextMonthlyReset();
    newUsage.lastRequestAt = oldUsage.lastRequestAt;
    return newUsage;
  }

  // Migrate from nested structure (usage.lite.daily.requests)
  if (oldUsage.lite?.daily?.requests !== undefined) {
    newUsage.liteDailyCount = oldUsage.lite.daily.requests;
    newUsage.liteDailyResetAt = oldUsage.lite.daily.resetAt || getNextDailyReset();
    newUsage.liteMonthlyCount = oldUsage.lite.monthly?.requests || 0;
    newUsage.liteMonthlyResetAt = oldUsage.lite.monthly?.resetAt || getNextMonthlyReset();
  }
  // Migrate from semi-nested structure (usage.lite.daily = number)
  else if (typeof oldUsage.lite?.daily === 'number') {
    newUsage.liteDailyCount = oldUsage.lite.daily;
    newUsage.liteMonthlyCount = oldUsage.lite.monthly || 0;
  }
  // Migrate from old single-model structure (usage.daily.requests)
  else if (oldUsage.daily?.requests !== undefined) {
    newUsage.liteDailyCount = oldUsage.daily.requests;
    newUsage.liteDailyResetAt = oldUsage.daily.resetAt || getNextDailyReset();
    newUsage.liteMonthlyCount = oldUsage.monthly?.requests || 0;
    newUsage.liteMonthlyResetAt = oldUsage.monthly?.resetAt || getNextMonthlyReset();
  }

  // Migrate pro model if exists
  if (oldUsage.pro?.daily?.requests !== undefined) {
    newUsage.proDailyCount = oldUsage.pro.daily.requests;
    newUsage.proDailyResetAt = oldUsage.pro.daily.resetAt || getNextDailyReset();
    newUsage.proMonthlyCount = oldUsage.pro.monthly?.requests || 0;
    newUsage.proMonthlyResetAt = oldUsage.pro.monthly?.resetAt || getNextMonthlyReset();
  } else if (typeof oldUsage.pro?.daily === 'number') {
    newUsage.proDailyCount = oldUsage.pro.daily;
    newUsage.proMonthlyCount = oldUsage.pro.monthly || 0;
  }

  if (oldUsage.lastRequestAt) {
    newUsage.lastRequestAt = oldUsage.lastRequestAt;
  }

  return newUsage;
}

/**
 * Reset counters if needed
 */
function resetCountersIfNeeded(usage, prefix, now) {
  let updated = false;
  const dailyResetAt = `${prefix}DailyResetAt`;
  const monthlyResetAt = `${prefix}MonthlyResetAt`;

  if (new Date(usage[dailyResetAt]) <= now) {
    usage[`${prefix}DailyCount`] = 0;
    usage[dailyResetAt] = getNextDailyReset();
    updated = true;
  }

  if (new Date(usage[monthlyResetAt]) <= now) {
    usage[`${prefix}MonthlyCount`] = 0;
    usage[monthlyResetAt] = getNextMonthlyReset();
    updated = true;
  }

  return updated;
}

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
