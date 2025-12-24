/**
 * Quota Configuration - SINGLE SOURCE OF TRUTH
 *
 * All quota limits and tier info are defined here.
 * Quotas are tracked separately for Lite model vs Pro model.
 */

export const TIER_QUOTAS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic access',
    liteModel: {
      daily: 150,
      weekly: 250,
      monthly: 300,
    },
    proModel: null, // No access
    models: ['lite'],
    price: 0,
    stripePriceId: null,
    features: [
      '150 generations per day',
      '300 generations per month',
      'Community support',
    ],
  },
  lite: {
    id: 'lite',
    name: 'Lite',
    description: 'For hobbyists and side projects',
    liteModel: {
      daily: 250,
      weekly: 350,
      monthly: 500,
    },
    proModel: {
      daily: 15,
      weekly: 35,
      monthly: 70,
    },
    models: ['lite', 'pro'],
    price: 4.99,
    stripePriceId: process.env.STRIPE_PRICE_LITE_MONTHLY || 'price_lite_monthly',
    features: [
      '250 Lite generations per day',
      '500 Lite generations per month',
      '70 Pro generations per month',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and teams',
    liteModel: {
      daily: 700,
      weekly: 1000,
      monthly: 1700,
    },
    proModel: {
      daily: 100,
      weekly: 200,
      monthly: 350,
    },
    models: ['lite', 'pro'],
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    features: [
      '700 Lite generations per day',
      '1,700 Lite generations per month',
      '350 Pro generations per month',
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
