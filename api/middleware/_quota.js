/**
 * Quota Middleware
 *
 * Checks and enforces user quotas for AI requests.
 * Tracks daily, weekly, and monthly usage limits.
 */

import { getFirestore } from './_auth.js';
import admin from 'firebase-admin';

/**
 * Tier quota limits
 */
const TIER_QUOTAS = {
  free: {
    dailyRequests: 200,
    weeklyRequests: 50,
    monthlyRequests: 100,
    models: ['lite'],
  },
  lite: {
    dailyRequests: 50,
    weeklyRequests: 250,
    monthlyRequests: 1000,
    models: ['lite'],
  },
  pro: {
    dailyRequests: 200,
    weeklyRequests: 1000,
    monthlyRequests: 5000,
    models: ['lite', 'pro'],
  },
};

/**
 * Get next reset time for daily quota (midnight UTC)
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

/**
 * Get next reset time for weekly quota (next Monday midnight UTC)
 */
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

/**
 * Get next reset time for monthly quota (1st of next month midnight UTC)
 */
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
 * Create default usage object
 */
function createDefaultUsage() {
  return {
    daily: {
      requests: 0,
      resetAt: getNextDailyReset(),
    },
    weekly: {
      requests: 0,
      resetAt: getNextWeeklyReset(),
    },
    monthly: {
      requests: 0,
      resetAt: getNextMonthlyReset(),
    },
    lastRequestAt: null,
  };
}

/**
 * Check if user has quota remaining
 *
 * @param {string} userId - Firebase user ID
 * @returns {Object} Quota check result
 */
export async function checkQuota(userId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return {
      allowed: false,
      error: 'User not found',
      status: 404,
    };
  }

  const user = userDoc.data();
  const tier = user.subscription?.tier || 'free';
  const limits = TIER_QUOTAS[tier] || TIER_QUOTAS.free;

  // Initialize usage if missing
  let usage = user.usage || createDefaultUsage();
  const now = new Date();
  let usageUpdated = false;

  // Check and reset daily quota if needed
  if (new Date(usage.daily.resetAt) <= now) {
    usage.daily.requests = 0;
    usage.daily.resetAt = getNextDailyReset();
    usageUpdated = true;
  }

  // Check and reset weekly quota if needed
  if (new Date(usage.weekly.resetAt) <= now) {
    usage.weekly.requests = 0;
    usage.weekly.resetAt = getNextWeeklyReset();
    usageUpdated = true;
  }

  // Check and reset monthly quota if needed
  if (new Date(usage.monthly.resetAt) <= now) {
    usage.monthly.requests = 0;
    usage.monthly.resetAt = getNextMonthlyReset();
    usageUpdated = true;
  }

  // Update usage in database if reset occurred
  if (usageUpdated) {
    await userRef.update({ usage });
  }

  // Check limits
  const dailyExceeded = usage.daily.requests >= limits.dailyRequests;
  const weeklyExceeded = usage.weekly.requests >= limits.weeklyRequests;
  const monthlyExceeded = usage.monthly.requests >= limits.monthlyRequests;

  const remaining = {
    daily: Math.max(0, limits.dailyRequests - usage.daily.requests),
    weekly: Math.max(0, limits.weeklyRequests - usage.weekly.requests),
    monthly: Math.max(0, limits.monthlyRequests - usage.monthly.requests),
  };

  if (dailyExceeded || weeklyExceeded || monthlyExceeded) {
    let resetAt;
    let limitType;

    if (dailyExceeded) {
      resetAt = usage.daily.resetAt;
      limitType = 'daily';
    } else if (weeklyExceeded) {
      resetAt = usage.weekly.resetAt;
      limitType = 'weekly';
    } else {
      resetAt = usage.monthly.resetAt;
      limitType = 'monthly';
    }

    return {
      allowed: false,
      tier,
      limits,
      usage,
      remaining,
      resetAt,
      limitType,
      error: `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} quota exceeded`,
      status: 429,
    };
  }

  return {
    allowed: true,
    tier,
    limits,
    usage,
    remaining: {
      daily: remaining.daily - 1,
      weekly: remaining.weekly - 1,
      monthly: remaining.monthly - 1,
    },
  };
}

/**
 * Check if user can access a specific model
 *
 * @param {string} tier - User's subscription tier
 * @param {string} modelTier - 'lite' or 'pro'
 * @returns {boolean} Whether the model is accessible
 */
export function canAccessModel(tier, modelTier) {
  const limits = TIER_QUOTAS[tier] || TIER_QUOTAS.free;
  return limits.models.includes(modelTier);
}

/**
 * Increment usage after successful request
 *
 * @param {string} userId - Firebase user ID
 */
export async function incrementUsage(userId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);

  await userRef.update({
    'usage.daily.requests': admin.firestore.FieldValue.increment(1),
    'usage.weekly.requests': admin.firestore.FieldValue.increment(1),
    'usage.monthly.requests': admin.firestore.FieldValue.increment(1),
    'usage.lastRequestAt': new Date().toISOString(),
  });
}

/**
 * Format quota info for response headers
 *
 * @param {Object} quotaResult - Result from checkQuota
 * @returns {Object} Headers to add to response
 */
export function getQuotaHeaders(quotaResult) {
  return {
    'X-Quota-Tier': quotaResult.tier || 'free',
    'X-Quota-Daily-Remaining': String(quotaResult.remaining?.daily ?? 0),
    'X-Quota-Weekly-Remaining': String(quotaResult.remaining?.weekly ?? 0),
    'X-Quota-Monthly-Remaining': String(quotaResult.remaining?.monthly ?? 0),
  };
}

export default {
  checkQuota,
  canAccessModel,
  incrementUsage,
  getQuotaHeaders,
  TIER_QUOTAS,
};
