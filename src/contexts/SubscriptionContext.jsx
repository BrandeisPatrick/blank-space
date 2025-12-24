/**
 * Subscription Context
 *
 * Manages subscription state, usage tracking, and Stripe integration.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

/**
 * Tier quota limits (must match backend)
 */
const TIER_QUOTAS = {
  free: {
    id: 'free',
    name: 'Free',
    dailyRequests: 200,
    weeklyRequests: 50,
    monthlyRequests: 100,
    models: ['lite'],
    price: 0,
  },
  lite: {
    id: 'lite',
    name: 'Lite',
    dailyRequests: 50,
    weeklyRequests: 250,
    monthlyRequests: 1000,
    models: ['lite'],
    price: 9.99,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    dailyRequests: 200,
    weeklyRequests: 1000,
    monthlyRequests: 5000,
    models: ['lite', 'pro'],
    price: 29.99,
  },
};

export const SubscriptionProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
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
      setUsage({
        daily: data.usage.daily,
        weekly: data.usage.weekly,
        monthly: data.usage.monthly,
        lastRequestAt: data.usage.lastRequestAt,
        remaining: data.remaining,
        percentUsed: data.percentUsed,
        resetAt: data.resetAt,
      });
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
    const tierConfig = TIER_QUOTAS[tier];
    if (!tierConfig || tier === 'free') {
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
   * Check if user can use a specific model
   */
  const canUseModel = useCallback((modelTier) => {
    const tier = subscription?.tier || 'free';
    const tierConfig = TIER_QUOTAS[tier];
    return tierConfig?.models?.includes(modelTier) || false;
  }, [subscription]);

  /**
   * Get current tier config
   */
  const getTierConfig = useCallback(() => {
    const tier = subscription?.tier || 'free';
    return TIER_QUOTAS[tier];
  }, [subscription]);

  /**
   * Check if quota is exceeded
   */
  const isQuotaExceeded = useCallback(() => {
    if (!usage?.remaining) return false;
    return usage.remaining.daily <= 0 ||
           usage.remaining.weekly <= 0 ||
           usage.remaining.monthly <= 0;
  }, [usage]);

  /**
   * Get most restrictive limit info
   */
  const getQuotaStatus = useCallback(() => {
    if (!usage?.remaining || !usage?.resetAt) {
      return { type: null, remaining: null, resetAt: null };
    }

    if (usage.remaining.daily <= 0) {
      return { type: 'daily', remaining: 0, resetAt: usage.resetAt.daily };
    }
    if (usage.remaining.weekly <= 0) {
      return { type: 'weekly', remaining: 0, resetAt: usage.resetAt.weekly };
    }
    if (usage.remaining.monthly <= 0) {
      return { type: 'monthly', remaining: 0, resetAt: usage.resetAt.monthly };
    }

    // Return the most restrictive remaining
    const minRemaining = Math.min(
      usage.remaining.daily,
      usage.remaining.weekly,
      usage.remaining.monthly
    );

    if (usage.remaining.daily === minRemaining) {
      return { type: 'daily', remaining: minRemaining, resetAt: usage.resetAt.daily };
    }
    if (usage.remaining.weekly === minRemaining) {
      return { type: 'weekly', remaining: minRemaining, resetAt: usage.resetAt.weekly };
    }
    return { type: 'monthly', remaining: minRemaining, resetAt: usage.resetAt.monthly };
  }, [usage]);

  const value = {
    // State
    subscription,
    usage,
    loading,
    error,
    tier: subscription?.tier || 'free',
    tierConfig: getTierConfig(),
    TIER_QUOTAS,

    // Actions
    createCheckoutSession,
    openCustomerPortal,
    refreshUsage: fetchSubscriptionData,

    // Helpers
    canUseModel,
    isQuotaExceeded,
    getQuotaStatus,
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
