/**
 * Simple Quota Middleware (Beta)
 *
 * All users get:
 * - 300 daily limit
 * - 500 monthly limit
 * - Pro model costs 3x
 */

import { getFirestore } from './_auth.js';

const LIMITS = {
  daily: 300,
  monthly: 500,
};

const MODEL_COST = {
  lite: 1,
  pro: 3,
};

/**
 * Get next reset time for daily quota (2 AM EST)
 * 2 AM EST = 7 AM UTC (EST = UTC-5)
 */
function getNextDailyReset() {
  const now = new Date();

  // 2 AM EST = 7 AM UTC
  const resetHourUTC = 7;

  // Check if we've passed today's reset time
  let resetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    resetHourUTC, 0, 0, 0
  ));

  // If we've passed today's reset, use tomorrow's
  if (now >= resetDate) {
    resetDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      resetHourUTC, 0, 0, 0
    ));
  }

  return resetDate.toISOString();
}

/**
 * Get next reset time for monthly quota (1st of next month 2 AM EST)
 */
function getNextMonthlyReset() {
  const now = new Date();
  const resetHourUTC = 7; // 2 AM EST = 7 AM UTC

  // 1st of next month at 2 AM EST
  const nextMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1, resetHourUTC, 0, 0, 0
  ));

  return nextMonth.toISOString();
}

/**
 * Create default usage object
 */
function createDefaultUsage() {
  return {
    dailyUsed: 0,
    dailyResetAt: getNextDailyReset(),
    monthlyUsed: 0,
    monthlyResetAt: getNextMonthlyReset(),
  };
}

/**
 * Check if counters need reset and reset them if needed
 */
function resetIfNeeded(usage) {
  const now = new Date();
  let updated = false;

  if (new Date(usage.dailyResetAt) <= now) {
    usage.dailyUsed = 0;
    usage.dailyResetAt = getNextDailyReset();
    updated = true;
  }

  if (new Date(usage.monthlyResetAt) <= now) {
    usage.monthlyUsed = 0;
    usage.monthlyResetAt = getNextMonthlyReset();
    updated = true;
  }

  return updated;
}

/**
 * Check if user has quota for a request
 * @param {string} userId - Firebase user ID
 * @param {string} modelTier - 'lite' or 'pro'
 * @returns {object} { allowed, usage, cost, limits, error? }
 */
export async function checkQuota(userId, modelTier = 'lite') {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  // Get or create usage
  let usage = userDoc.exists && userDoc.data().usage
    ? { ...userDoc.data().usage }
    : createDefaultUsage();

  // Reset counters if needed
  const needsReset = resetIfNeeded(usage);
  if (needsReset) {
    await userRef.set({ usage }, { merge: true });
  }

  const cost = MODEL_COST[modelTier] || 1;

  // Check if request would exceed limits
  const dailyRemaining = LIMITS.daily - usage.dailyUsed;
  const monthlyRemaining = LIMITS.monthly - usage.monthlyUsed;

  if (cost > dailyRemaining) {
    return {
      allowed: false,
      error: 'Daily limit reached',
      resetAt: usage.dailyResetAt,
      usage,
      limits: LIMITS,
    };
  }

  if (cost > monthlyRemaining) {
    return {
      allowed: false,
      error: 'Monthly limit reached',
      resetAt: usage.monthlyResetAt,
      usage,
      limits: LIMITS,
    };
  }

  return {
    allowed: true,
    usage,
    cost,
    limits: LIMITS,
    remaining: {
      daily: dailyRemaining,
      monthly: monthlyRemaining,
    },
  };
}

/**
 * Increment usage after successful request
 * @param {string} userId - Firebase user ID
 * @param {string} modelTier - 'lite' or 'pro'
 */
export async function incrementUsage(userId, modelTier = 'lite') {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  const cost = MODEL_COST[modelTier] || 1;

  const userDoc = await userRef.get();
  let usage = userDoc.exists && userDoc.data().usage
    ? { ...userDoc.data().usage }
    : createDefaultUsage();

  // Reset if needed before incrementing
  resetIfNeeded(usage);

  // Increment
  usage.dailyUsed += cost;
  usage.monthlyUsed += cost;
  usage.lastRequestAt = new Date().toISOString();

  await userRef.set({ usage }, { merge: true });

  return usage;
}
