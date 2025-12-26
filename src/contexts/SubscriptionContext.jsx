/**
 * Subscription Context (Beta Mode)
 *
 * Simplified for beta testing - all features unlocked, tracks usage only.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch usage data
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      const token = await getIdToken();
      const response = await fetch('/api/user/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  // Increment usage after a generation completes
  const incrementUsage = useCallback(async (modelTier = 'lite') => {
    if (!user) return;

    try {
      const token = await getIdToken();
      const response = await fetch('/api/user/increment-usage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelTier }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the returned usage directly to update state (format it like GET endpoint)
        if (data.usage) {
          const LIMITS = { daily: 300, monthly: 500 };
          const dailyUsed = (typeof data.usage.dailyUsed === 'number' && !isNaN(data.usage.dailyUsed)) ? data.usage.dailyUsed : 0;
          const monthlyUsed = (typeof data.usage.monthlyUsed === 'number' && !isNaN(data.usage.monthlyUsed)) ? data.usage.monthlyUsed : 0;
          setUsage({
            daily: {
              used: dailyUsed,
              limit: LIMITS.daily,
              remaining: Math.max(0, LIMITS.daily - dailyUsed),
              resetAt: data.usage.dailyResetAt,
            },
            monthly: {
              used: monthlyUsed,
              limit: LIMITS.monthly,
              remaining: Math.max(0, LIMITS.monthly - monthlyUsed),
              resetAt: data.usage.monthlyResetAt,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  }, [user, getIdToken]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Beta mode: always allow all features
  const canUseModel = useCallback(() => true, []);

  const value = {
    // State - beta users get pro tier
    subscription: { tier: 'pro', status: 'active' },
    usage,
    loading,
    error: null,
    tier: 'pro',
    tierConfig: {
      id: 'pro',
      name: 'Beta',
      models: ['lite', 'pro'],
    },
    allTiers: null,

    // Actions
    refreshUsage: fetchUsage,
    incrementUsage,
    createCheckoutSession: async () => {},
    openCustomerPortal: async () => {},
    syncSubscription: async () => null,

    // Helpers - all unlocked for beta
    canUseModel,
    getModelUsage: () => null,
    isQuotaExceeded: () => false,
    getQuotaStatus: () => ({ type: null, remaining: null, resetAt: null }),
    getTierConfig: () => ({ id: 'pro', name: 'Beta', models: ['lite', 'pro'] }),
    isPro: true,
    isLite: false,
    isFree: false,
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
