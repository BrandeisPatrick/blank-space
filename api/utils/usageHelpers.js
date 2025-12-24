/**
 * Shared Usage Helpers
 *
 * Common functions for quota and usage tracking.
 * Used by both _quota.js middleware and usage.js endpoint.
 */

/**
 * Get next reset time for daily quota (midnight UTC)
 */
export function getNextDailyReset() {
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
 * Get next reset time for monthly quota (1st of next month midnight UTC)
 */
export function getNextMonthlyReset() {
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
export function getFieldNames(modelTier) {
  const prefix = modelTier; // 'lite' or 'pro'
  return {
    dailyCount: `${prefix}DailyCount`,
    dailyResetAt: `${prefix}DailyResetAt`,
    monthlyCount: `${prefix}MonthlyCount`,
    monthlyResetAt: `${prefix}MonthlyResetAt`,
  };
}

/**
 * Create default usage object (flat structure)
 */
export function createDefaultUsage() {
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
export function migrateUsage(oldUsage) {
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
 * Reset counters if needed and return whether usage was updated
 */
export function resetCountersIfNeeded(usage, modelTier, now) {
  const fields = getFieldNames(modelTier);
  let updated = false;

  if (new Date(usage[fields.dailyResetAt]) <= now) {
    usage[fields.dailyCount] = 0;
    usage[fields.dailyResetAt] = getNextDailyReset();
    updated = true;
  }

  if (new Date(usage[fields.monthlyResetAt]) <= now) {
    usage[fields.monthlyCount] = 0;
    usage[fields.monthlyResetAt] = getNextMonthlyReset();
    updated = true;
  }

  return updated;
}
