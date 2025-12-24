/**
 * User Usage & Subscription Endpoint
 *
 * GET /api/user/usage
 * Returns current usage, quota limits, and subscription info
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';

/**
 * Tier quota limits
 */
const TIER_QUOTAS = {
  free: {
    dailyRequests: 200,
    weeklyRequests: 50,
    monthlyRequests: 100,
    models: ['lite'],
    price: 0,
  },
  lite: {
    dailyRequests: 50,
    weeklyRequests: 250,
    monthlyRequests: 1000,
    models: ['lite'],
    price: 9.99,
  },
  pro: {
    dailyRequests: 200,
    weeklyRequests: 1000,
    monthlyRequests: 5000,
    models: ['lite', 'pro'],
    price: 29.99,
  },
};

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

function createDefaultUsage() {
  return {
    daily: { requests: 0, resetAt: getNextDailyReset() },
    weekly: { requests: 0, resetAt: getNextWeeklyReset() },
    monthly: { requests: 0, resetAt: getNextMonthlyReset() },
    lastRequestAt: null,
  };
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
    const limits = TIER_QUOTAS[tier] || TIER_QUOTAS.free;

    // Initialize or get usage
    let usage = user.usage || createDefaultUsage();
    const now = new Date();
    let usageUpdated = false;

    // Check and reset quotas if needed
    if (new Date(usage.daily.resetAt) <= now) {
      usage.daily.requests = 0;
      usage.daily.resetAt = getNextDailyReset();
      usageUpdated = true;
    }

    if (new Date(usage.weekly.resetAt) <= now) {
      usage.weekly.requests = 0;
      usage.weekly.resetAt = getNextWeeklyReset();
      usageUpdated = true;
    }

    if (new Date(usage.monthly.resetAt) <= now) {
      usage.monthly.requests = 0;
      usage.monthly.resetAt = getNextMonthlyReset();
      usageUpdated = true;
    }

    // Update if reset occurred
    if (usageUpdated) {
      await userRef.update({ usage });
    }

    // Calculate remaining
    const remaining = {
      daily: Math.max(0, limits.dailyRequests - usage.daily.requests),
      weekly: Math.max(0, limits.weeklyRequests - usage.weekly.requests),
      monthly: Math.max(0, limits.monthlyRequests - usage.monthly.requests),
    };

    // Calculate percentages
    const percentUsed = {
      daily: Math.round((usage.daily.requests / limits.dailyRequests) * 100),
      weekly: Math.round((usage.weekly.requests / limits.weeklyRequests) * 100),
      monthly: Math.round((usage.monthly.requests / limits.monthlyRequests) * 100),
    };

    return res.status(200).json({
      success: true,
      tier,
      subscription: {
        tier,
        status: user.subscription?.status || 'active',
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      },
      limits: {
        daily: limits.dailyRequests,
        weekly: limits.weeklyRequests,
        monthly: limits.monthlyRequests,
      },
      usage: {
        daily: usage.daily.requests,
        weekly: usage.weekly.requests,
        monthly: usage.monthly.requests,
        lastRequestAt: usage.lastRequestAt,
      },
      remaining,
      percentUsed,
      resetAt: {
        daily: usage.daily.resetAt,
        weekly: usage.weekly.resetAt,
        monthly: usage.monthly.resetAt,
      },
      models: limits.models,
      canUsePro: limits.models.includes('pro'),
    });
  } catch (error) {
    console.error('Usage endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
