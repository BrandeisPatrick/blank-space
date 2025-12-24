/**
 * Subscription Tier Quotas Configuration
 *
 * Defines limits for each subscription tier.
 * Used by both frontend (display) and backend (enforcement).
 */

/**
 * Tier quota definitions
 */
export const TIER_QUOTAS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic access',
    dailyRequests: 200,
    weeklyRequests: 50,
    monthlyRequests: 100,
    models: ['lite'],
    price: 0,
    stripePriceId: null,
    features: [
      '200 AI requests per day',
      'Lite model only',
      'Basic code generation',
      'Community support',
    ],
  },
  lite: {
    id: 'lite',
    name: 'Lite',
    description: 'For hobbyists and side projects',
    dailyRequests: 50,
    weeklyRequests: 250,
    monthlyRequests: 1000,
    models: ['lite'],
    price: 9.99,
    stripePriceId: process.env.STRIPE_PRICE_LITE_MONTHLY || 'price_lite_monthly',
    features: [
      '50 AI requests per day',
      'Lite model (fast)',
      'Priority code generation',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and teams',
    dailyRequests: 200,
    weeklyRequests: 1000,
    monthlyRequests: 5000,
    models: ['lite', 'pro'],
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    features: [
      '200 AI requests per day',
      'Pro model (most capable)',
      'Advanced code generation',
      'Priority support',
    ],
    highlighted: true,
  },
};

/**
 * Get quota for a tier
 * @param {string} tier - 'free', 'lite', or 'pro'
 * @returns {Object} Quota configuration
 */
export function getQuotaForTier(tier) {
  return TIER_QUOTAS[tier] || TIER_QUOTAS.free;
}

/**
 * Check if a tier can use a model
 * @param {string} tier - User's subscription tier
 * @param {string} model - 'lite' or 'pro'
 * @returns {boolean} Whether the model is accessible
 */
export function canUseModel(tier, model) {
  const quota = getQuotaForTier(tier);
  return quota.models.includes(model);
}

/**
 * Get next reset time for daily quota (midnight UTC)
 * @returns {string} ISO timestamp
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
 * Get next reset time for weekly quota (next Monday midnight UTC)
 * @returns {string} ISO timestamp
 */
export function getNextWeeklyReset() {
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
 * @returns {string} ISO timestamp
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
 * Default subscription object for new users
 */
export const DEFAULT_SUBSCRIPTION = {
  tier: 'free',
  status: 'active',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

/**
 * Create default usage object
 * @returns {Object} Default usage tracking object
 */
export function createDefaultUsage() {
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

export default {
  TIER_QUOTAS,
  getQuotaForTier,
  canUseModel,
  getNextDailyReset,
  getNextWeeklyReset,
  getNextMonthlyReset,
  DEFAULT_SUBSCRIPTION,
  createDefaultUsage,
};
