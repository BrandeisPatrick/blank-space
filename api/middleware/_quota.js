/**
 * Quota Middleware
 *
 * Checks and enforces user quotas for AI requests.
 * Tracks usage separately for Lite and Pro models using flat structure.
 */

import { getFirestore } from './_auth.js';
import admin from 'firebase-admin';
import { TIER_QUOTAS, getModelQuota, canAccessModel } from '../config/quotas.js';

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
 * Get field names for a model tier
 */
function getFieldNames(modelTier) {
  const prefix = modelTier; // 'lite' or 'pro'
  return {
    dailyCount: `${prefix}DailyCount`,
    dailyResetAt: `${prefix}DailyResetAt`,
    weeklyCount: `${prefix}WeeklyCount`,
    weeklyResetAt: `${prefix}WeeklyResetAt`,
    monthlyCount: `${prefix}MonthlyCount`,
    monthlyResetAt: `${prefix}MonthlyResetAt`,
  };
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
 * Reset counters if needed and return updated usage
 */
function resetCountersIfNeeded(usage, modelTier, now) {
  const fields = getFieldNames(modelTier);
  let updated = false;

  if (new Date(usage[fields.dailyResetAt]) <= now) {
    usage[fields.dailyCount] = 0;
    usage[fields.dailyResetAt] = getNextDailyReset();
    updated = true;
  }

  if (new Date(usage[fields.weeklyResetAt]) <= now) {
    usage[fields.weeklyCount] = 0;
    usage[fields.weeklyResetAt] = getNextWeeklyReset();
    updated = true;
  }

  if (new Date(usage[fields.monthlyResetAt]) <= now) {
    usage[fields.monthlyCount] = 0;
    usage[fields.monthlyResetAt] = getNextMonthlyReset();
    updated = true;
  }

  return updated;
}

/**
 * Check if user has quota remaining for a specific model
 *
 * @param {string} userId - Firebase user ID
 * @param {string} modelTier - 'lite' or 'pro'
 * @returns {Object} Quota check result
 */
export async function checkQuota(userId, modelTier = 'lite') {
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
  const tierConfig = TIER_QUOTAS[tier] || TIER_QUOTAS.free;

  // Check if user can access this model
  if (!canAccessModel(tier, modelTier)) {
    return {
      allowed: false,
      tier,
      error: `${modelTier === 'pro' ? 'Pro' : 'Lite'} model requires ${modelTier === 'pro' ? 'Lite or Pro' : ''} subscription`,
      status: 403,
    };
  }

  // Get limits for this model
  const limits = getModelQuota(tier, modelTier);
  if (!limits) {
    return {
      allowed: false,
      tier,
      error: `No quota configured for ${modelTier} model`,
      status: 403,
    };
  }

  // Initialize or migrate usage
  let usage = user.usage ? migrateUsage(user.usage) : createDefaultUsage();
  const now = new Date();
  let usageUpdated = false;

  // Reset counters if needed for both models
  if (resetCountersIfNeeded(usage, 'lite', now)) usageUpdated = true;
  if (resetCountersIfNeeded(usage, 'pro', now)) usageUpdated = true;

  // Update usage in database if reset or migration occurred
  if (usageUpdated || user.usage?.liteDailyCount === undefined) {
    await userRef.update({ usage });
  }

  const fields = getFieldNames(modelTier);

  // Check limits
  const dailyExceeded = usage[fields.dailyCount] >= limits.daily;
  const weeklyExceeded = usage[fields.weeklyCount] >= limits.weekly;
  const monthlyExceeded = usage[fields.monthlyCount] >= limits.monthly;

  const remaining = {
    daily: Math.max(0, limits.daily - usage[fields.dailyCount]),
    weekly: Math.max(0, limits.weekly - usage[fields.weeklyCount]),
    monthly: Math.max(0, limits.monthly - usage[fields.monthlyCount]),
  };

  if (dailyExceeded || weeklyExceeded || monthlyExceeded) {
    let resetAt;
    let limitType;

    if (dailyExceeded) {
      resetAt = usage[fields.dailyResetAt];
      limitType = 'daily';
    } else if (weeklyExceeded) {
      resetAt = usage[fields.weeklyResetAt];
      limitType = 'weekly';
    } else {
      resetAt = usage[fields.monthlyResetAt];
      limitType = 'monthly';
    }

    return {
      allowed: false,
      tier,
      modelTier,
      limits,
      usage,
      remaining,
      resetAt,
      limitType,
      error: `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} ${modelTier} model quota exceeded`,
      status: 429,
    };
  }

  return {
    allowed: true,
    tier,
    modelTier,
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
 * Increment usage after successful request
 *
 * @param {string} userId - Firebase user ID
 * @param {string} modelTier - 'lite' or 'pro'
 */
export async function incrementUsage(userId, modelTier = 'lite') {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  const fields = getFieldNames(modelTier);

  // Simple flat increment - no nested paths!
  await userRef.update({
    [`usage.${fields.dailyCount}`]: admin.firestore.FieldValue.increment(1),
    [`usage.${fields.weeklyCount}`]: admin.firestore.FieldValue.increment(1),
    [`usage.${fields.monthlyCount}`]: admin.firestore.FieldValue.increment(1),
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
  const modelTier = quotaResult.modelTier || 'lite';
  return {
    'X-Quota-Tier': quotaResult.tier || 'free',
    'X-Quota-Model': modelTier,
    'X-Quota-Daily-Remaining': String(quotaResult.remaining?.daily ?? 0),
    'X-Quota-Weekly-Remaining': String(quotaResult.remaining?.weekly ?? 0),
    'X-Quota-Monthly-Remaining': String(quotaResult.remaining?.monthly ?? 0),
  };
}

export { canAccessModel };

export default {
  checkQuota,
  canAccessModel,
  incrementUsage,
  getQuotaHeaders,
  TIER_QUOTAS,
};
