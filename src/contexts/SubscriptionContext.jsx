/**
 * Subscription Context
 *
 * Manages subscription state, usage tracking, and Stripe integration.
 * Quota config is fetched from API (single source of truth in backend).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

// Default tier config (fallback before API loads - must match server)
const DEFAULT_TIER_CONFIG = {
  id: 'free',
  name: 'Free',
  liteModel: { daily: 150, monthly: 300 },
  proModel: null,
  models: ['lite'],
  price: 0,
};

export const SubscriptionProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [tierConfig, setTierConfig] = useState(DEFAULT_TIER_CONFIG);
  const [allTiers, setAllTiers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch subscription and usage data
   */
  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const token = await getIdToken();
      const response = await fetch('/api/user/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      // Per-model usage structure (daily + monthly only)
      setUsage({
        lite: data.usage.lite,
        pro: data.usage.pro,
        lastRequestAt: data.usage.lastRequestAt,
        remaining: data.remaining,
        percentUsed: data.percentUsed,
        resetAt: data.resetAt,
        limits: data.limits,
      });
      // Store tier config from API (single source of truth)
      if (data.tierConfig) {
        setTierConfig(data.tierConfig);
      }
      if (data.allTiers) {
        setAllTiers(data.allTiers);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  /**
   * Create Stripe checkout session
   */
  const createCheckoutSession = async (tier) => {
    const tierData = allTiers?.[tier];
    if (!tierData || tier === 'free') {
      throw new Error('Invalid tier for checkout');
    }

    const priceId = tier === 'pro'
      ? import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY
      : import.meta.env.VITE_STRIPE_PRICE_LITE_MONTHLY;

    const token = await getIdToken();
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    window.location.href = url;
  };

  /**
   * Open Stripe customer portal
   */
  const openCustomerPortal = async () => {
    const token = await getIdToken();
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  };

  /**
   * Sync subscription with Stripe (call after checkout success)
   * This is more reliable than waiting for webhooks
   */
  const syncSubscription = useCallback(async () => {
    if (!user) return null;

    try {
      const token = await getIdToken();
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription');
      }

      const result = await response.json();

      // Refresh subscription data after sync
      if (result.synced) {
        await fetchSubscriptionData();
      }

      return result;
    } catch (err) {
      console.error('Failed to sync subscription:', err);
      return null;
    }
  }, [user, getIdToken, fetchSubscriptionData]);

  // Auto-sync when returning from checkout (success=true in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log('[Subscription] Checking URL params:', window.location.search);
    if (params.get('success') === 'true' && user) {
      console.log('[Subscription] Success param detected, syncing...');
      // Remove success param from URL
      params.delete('success');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Sync subscription with Stripe
      syncSubscription().then(result => {
        console.log('[Subscription] Sync result:', result);
      });
    }
  }, [user, syncSubscription]);

  /**
   * Check if user can use a specific model
   */
  const canUseModel = useCallback((modelTier) => {
    return tierConfig?.models?.includes(modelTier) || false;
  }, [tierConfig]);

  /**
   * Get usage data for a specific model
   * @param {string} modelTier - 'lite' or 'pro'
   */
  const getModelUsage = useCallback((modelTier) => {
    if (!usage) return null;
    return {
      used: usage[modelTier],
      remaining: usage.remaining?.[modelTier],
      percentUsed: usage.percentUsed?.[modelTier],
      resetAt: usage.resetAt?.[modelTier],
      limits: usage.limits?.[modelTier],
    };
  }, [usage]);

  /**
   * Get current tier config
   */
  const getTierConfig = useCallback(() => {
    return tierConfig;
  }, [tierConfig]);

  /**
   * Check if quota is exceeded for a specific model
   * @param {string} modelTier - 'lite' or 'pro' (defaults to 'lite')
   */
  const isQuotaExceeded = useCallback((modelTier = 'lite') => {
    const remaining = usage?.remaining?.[modelTier];
    if (!remaining) return false;
    return remaining.daily <= 0 || remaining.monthly <= 0;
  }, [usage]);

  /**
   * Get most restrictive limit info for a specific model
   * @param {string} modelTier - 'lite' or 'pro' (defaults to 'lite')
   */
  const getQuotaStatus = useCallback((modelTier = 'lite') => {
    const remaining = usage?.remaining?.[modelTier];
    const resetAt = usage?.resetAt?.[modelTier];

    if (!remaining || !resetAt) {
      return { type: null, remaining: null, resetAt: null, modelTier };
    }

    if (remaining.daily <= 0) {
      return { type: 'daily', remaining: 0, resetAt: resetAt.daily, modelTier };
    }
    if (remaining.monthly <= 0) {
      return { type: 'monthly', remaining: 0, resetAt: resetAt.monthly, modelTier };
    }

    // Return the most restrictive remaining
    const minRemaining = Math.min(remaining.daily, remaining.monthly);

    if (remaining.daily === minRemaining) {
      return { type: 'daily', remaining: minRemaining, resetAt: resetAt.daily, modelTier };
    }
    return { type: 'monthly', remaining: minRemaining, resetAt: resetAt.monthly, modelTier };
  }, [usage]);

  const value = {
    // State
    subscription,
    usage,
    loading,
    error,
    tier: subscription?.tier || 'free',
    tierConfig,
    allTiers, // All tier configs from API (for pricing pages, etc.)

    // Actions
    createCheckoutSession,
    openCustomerPortal,
    syncSubscription,
    refreshUsage: fetchSubscriptionData,

    // Helpers
    canUseModel,
    getModelUsage,
    isQuotaExceeded,
    getQuotaStatus,
    getTierConfig,
    isPro: subscription?.tier === 'pro',
    isLite: subscription?.tier === 'lite',
    isFree: !subscription?.tier || subscription?.tier === 'free',
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
