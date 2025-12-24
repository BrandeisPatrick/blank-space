/**
 * User Usage & Subscription Endpoint
 *
 * GET /api/user/usage
 * Returns current usage, quota limits, and subscription info
 * Usage is tracked separately for Lite and Pro models using flat structure
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

function getNextWeeklyReset() {
  const now = new Date();
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
  const nextMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilMonday,
    0, 0, 0, 0
  ));
  return nextMonday.toISOString();
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
    liteWeeklyCount: 0,
    liteWeeklyResetAt: getNextWeeklyReset(),
    liteMonthlyCount: 0,
    liteMonthlyResetAt: getNextMonthlyReset(),
    proDailyCount: 0,
    proDailyResetAt: getNextDailyReset(),
    proWeeklyCount: 0,
    proWeeklyResetAt: getNextWeeklyReset(),
    proMonthlyCount: 0,
    proMonthlyResetAt: getNextMonthlyReset(),
    lastRequestAt: null,
  };
}

/**
 * Migrate old usage structure to new flat structure
 */
function migrateUsage(oldUsage) {
  // Already flat structure
  if (oldUsage.liteDailyCount !== undefined) {
    return oldUsage;
  }

  const newUsage = createDefaultUsage();

  // Migrate from nested structure (usage.lite.daily.requests)
  if (oldUsage.lite?.daily?.requests !== undefined) {
    newUsage.liteDailyCount = oldUsage.lite.daily.requests;
    newUsage.liteDailyResetAt = oldUsage.lite.daily.resetAt || getNextDailyReset();
    newUsage.liteWeeklyCount = oldUsage.lite.weekly?.requests || 0;
    newUsage.liteWeeklyResetAt = oldUsage.lite.weekly?.resetAt || getNextWeeklyReset();
    newUsage.liteMonthlyCount = oldUsage.lite.monthly?.requests || 0;
    newUsage.liteMonthlyResetAt = oldUsage.lite.monthly?.resetAt || getNextMonthlyReset();
  }
  // Migrate from semi-nested structure (usage.lite.daily = number)
  else if (typeof oldUsage.lite?.daily === 'number') {
    newUsage.liteDailyCount = oldUsage.lite.daily;
    newUsage.liteWeeklyCount = oldUsage.lite.weekly || 0;
    newUsage.liteMonthlyCount = oldUsage.lite.monthly || 0;
  }
  // Migrate from old single-model structure (usage.daily.requests)
  else if (oldUsage.daily?.requests !== undefined) {
    newUsage.liteDailyCount = oldUsage.daily.requests;
    newUsage.liteDailyResetAt = oldUsage.daily.resetAt || getNextDailyReset();
    newUsage.liteWeeklyCount = oldUsage.weekly?.requests || 0;
    newUsage.liteWeeklyResetAt = oldUsage.weekly?.resetAt || getNextWeeklyReset();
    newUsage.liteMonthlyCount = oldUsage.monthly?.requests || 0;
    newUsage.liteMonthlyResetAt = oldUsage.monthly?.resetAt || getNextMonthlyReset();
  }

  // Migrate pro model if exists
  if (oldUsage.pro?.daily?.requests !== undefined) {
    newUsage.proDailyCount = oldUsage.pro.daily.requests;
    newUsage.proDailyResetAt = oldUsage.pro.daily.resetAt || getNextDailyReset();
    newUsage.proWeeklyCount = oldUsage.pro.weekly?.requests || 0;
    newUsage.proWeeklyResetAt = oldUsage.pro.weekly?.resetAt || getNextWeeklyReset();
    newUsage.proMonthlyCount = oldUsage.pro.monthly?.requests || 0;
    newUsage.proMonthlyResetAt = oldUsage.pro.monthly?.resetAt || getNextMonthlyReset();
  } else if (typeof oldUsage.pro?.daily === 'number') {
    newUsage.proDailyCount = oldUsage.pro.daily;
    newUsage.proWeeklyCount = oldUsage.pro.weekly || 0;
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
  const weeklyResetAt = `${prefix}WeeklyResetAt`;
  const monthlyResetAt = `${prefix}MonthlyResetAt`;

  if (new Date(usage[dailyResetAt]) <= now) {
    usage[`${prefix}DailyCount`] = 0;
    usage[dailyResetAt] = getNextDailyReset();
    updated = true;
  }

  if (new Date(usage[weeklyResetAt]) <= now) {
    usage[`${prefix}WeeklyCount`] = 0;
    usage[weeklyResetAt] = getNextWeeklyReset();
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

    // Check if migration happened (old structure didn't have liteDailyCount)
    if (user.usage && user.usage.liteDailyCount === undefined) {
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
      weekly: Math.max(0, liteLimits.weekly - usage.liteWeeklyCount),
      monthly: Math.max(0, liteLimits.monthly - usage.liteMonthlyCount),
    };
    const litePercent = {
      daily: Math.round((usage.liteDailyCount / liteLimits.daily) * 100),
      weekly: Math.round((usage.liteWeeklyCount / liteLimits.weekly) * 100),
      monthly: Math.round((usage.liteMonthlyCount / liteLimits.monthly) * 100),
    };

    // Calculate remaining and percent for pro model (if available)
    let proRemaining = null;
    let proPercent = null;
    if (proLimits) {
      proRemaining = {
        daily: Math.max(0, proLimits.daily - usage.proDailyCount),
        weekly: Math.max(0, proLimits.weekly - usage.proWeeklyCount),
        monthly: Math.max(0, proLimits.monthly - usage.proMonthlyCount),
      };
      proPercent = {
        daily: Math.round((usage.proDailyCount / proLimits.daily) * 100),
        weekly: Math.round((usage.proWeeklyCount / proLimits.weekly) * 100),
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
          weekly: usage.liteWeeklyCount,
          monthly: usage.liteMonthlyCount,
        },
        pro: proLimits ? {
          daily: usage.proDailyCount,
          weekly: usage.proWeeklyCount,
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
          weekly: usage.liteWeeklyResetAt,
          monthly: usage.liteMonthlyResetAt,
        },
        pro: proLimits ? {
          daily: usage.proDailyResetAt,
          weekly: usage.proWeeklyResetAt,
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
