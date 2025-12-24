/**
 * Quota Configuration - SINGLE SOURCE OF TRUTH
 *
 * All quota limits and tier info are defined here.
 * Quotas are tracked separately for Lite model vs Pro model.
 *
 * Model: Daily burst limit + Monthly total budget
 */

export const TIER_QUOTAS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic access',
    liteModel: {
      daily: 150,
      monthly: 300,
    },
    proModel: null, // No access
    models: ['lite'],
    price: 0,
    stripePriceId: null,
    features: [
      '150 generations per day',
      '300 generations per month',
      'Lite model (fast)',
      'Community support',
    ],
  },
  lite: {
    id: 'lite',
    name: 'Lite',
    description: 'For hobbyists and side projects',
    liteModel: {
      daily: 150,
      monthly: 1500,
    },
    proModel: {
      daily: 20,
      monthly: 100,
    },
    models: ['lite', 'pro'],
    price: 4.99,
    stripePriceId: process.env.STRIPE_PRICE_LITE_MONTHLY || 'price_lite_monthly',
    features: [
      '150 Lite generations per day',
      '1,500 Lite generations per month',
      '100 Pro generations per month',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and teams',
    liteModel: {
      daily: 500,
      monthly: 5000,
    },
    proModel: {
      daily: 100,
      monthly: 1000,
    },
    models: ['lite', 'pro'],
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    features: [
      '500 Lite generations per day',
      '5,000 Lite generations per month',
      '1,000 Pro generations per month',
      'Priority support',
    ],
    highlighted: true,
  },
};

/**
 * Get quota config for a tier
 * @param {string} tier - 'free', 'lite', or 'pro'
 * @returns {Object} Tier configuration
 */
export function getTierConfig(tier) {
  return TIER_QUOTAS[tier] || TIER_QUOTAS.free;
}

/**
 * Get quota limits for a specific model
 * @param {string} tier - User's subscription tier
 * @param {string} modelTier - 'lite' or 'pro'
 * @returns {Object|null} Quota limits or null if no access
 */
export function getModelQuota(tier, modelTier) {
  const config = getTierConfig(tier);
  if (modelTier === 'lite') {
    return config.liteModel;
  } else if (modelTier === 'pro') {
    return config.proModel;
  }
  return null;
}

/**
 * Check if a tier can use a specific model
 * @param {string} tier - User's subscription tier
 * @param {string} model - 'lite' or 'pro'
 * @returns {boolean} Whether the model is accessible
 */
export function canAccessModel(tier, model) {
  const config = getTierConfig(tier);
  return config.models.includes(model);
}

/**
 * Get all tier configs (for pricing pages, etc.)
 * @returns {Object} All tier configurations
 */
export function getAllTiers() {
  return TIER_QUOTAS;
}

export default {
  TIER_QUOTAS,
  getTierConfig,
  getModelQuota,
  canAccessModel,
  getAllTiers,
};
