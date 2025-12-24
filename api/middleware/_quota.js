/**
 * Quota Middleware
 *
 * Checks and enforces user quotas for AI requests.
 * Tracks usage separately for Lite and Pro models.
 * Model: Daily burst limit + Monthly total budget
 */

import { getFirestore } from './_auth.js';
import admin from 'firebase-admin';
import { TIER_QUOTAS, getModelQuota, canAccessModel } from '../config/_quotas.js';
import {
  getFieldNames,
  createDefaultUsage,
  migrateUsage,
  resetCountersIfNeeded,
} from '../utils/_usageHelpers.js';

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
  if (usageUpdated || user.usage?.liteDailyCount === undefined || user.usage?.liteWeeklyCount !== undefined) {
    await userRef.update({ usage });
  }

  const fields = getFieldNames(modelTier);

  // Check limits
  const dailyExceeded = usage[fields.dailyCount] >= limits.daily;
  const monthlyExceeded = usage[fields.monthlyCount] >= limits.monthly;

  const remaining = {
    daily: Math.max(0, limits.daily - usage[fields.dailyCount]),
    monthly: Math.max(0, limits.monthly - usage[fields.monthlyCount]),
  };

  if (dailyExceeded || monthlyExceeded) {
    let resetAt;
    let limitType;

    if (dailyExceeded) {
      resetAt = usage[fields.dailyResetAt];
      limitType = 'daily';
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

  await userRef.update({
    [`usage.${fields.dailyCount}`]: admin.firestore.FieldValue.increment(1),
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
