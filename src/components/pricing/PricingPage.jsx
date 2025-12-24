/**
 * Pricing Page Component
 *
 * Full-page pricing display with all tiers.
 */

import { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { PricingCard } from './PricingCard';

const TIER_FEATURES = {
  free: {
    name: 'Free',
    description: 'Get started with basic access',
    price: 0,
    features: [
      '300 AI requests per day',
      '400 requests per week',
      '400 requests per month',
      'Lite model (fast)',
      'Basic code generation',
    ],
  },
  lite: {
    name: 'Lite',
    description: 'For hobbyists and side projects',
    price: 4.99,
    features: [
      '700 AI requests per day',
      '1,000 requests per week',
      '1,500 requests per month',
      'Lite model (fast)',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For professionals and teams',
    price: 29.99,
    features: [
      '2,000 AI requests per day',
      '3,000 requests per week',
      '5,000 requests per month',
      'Pro model (most capable)',
      'Priority support',
      'Advanced features',
    ],
    highlighted: true,
  },
};

export const PricingPage = ({ onClose }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user, openAuthModal } = useAuth();
  const { tier, createCheckoutSession, loading: subLoading } = useSubscription();
  const [loadingTier, setLoadingTier] = useState(null);

  const handleSelectTier = async (selectedTier) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (selectedTier === 'free') {
      // Already free or downgrade via portal
      return;
    }

    try {
      setLoadingTier(selectedTier);
      await createCheckoutSession(selectedTier);
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingTier(null);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: theme.colors.background,
    padding: theme.spacing['2xl'],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
  };

  const titleStyle = {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  };

  const subtitleStyle = {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.mutedForeground,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: theme.spacing.xl,
    maxWidth: '1000px',
    width: '100%',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.colors.mutedForeground,
  };

  return (
    <div style={containerStyle}>
      {onClose && (
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>
      )}

      <div style={headerStyle}>
        <h1 style={titleStyle}>Choose Your Plan</h1>
        <p style={subtitleStyle}>
          Unlock more AI power with our premium plans
        </p>
      </div>

      <div style={gridStyle}>
        {Object.entries(TIER_FEATURES).map(([tierKey, tierData]) => (
          <PricingCard
            key={tierKey}
            tier={tierKey}
            name={tierData.name}
            description={tierData.description}
            price={tierData.price}
            features={tierData.features}
            isCurrentPlan={tier === tierKey}
            highlighted={tierData.highlighted}
            onSelect={handleSelectTier}
            loading={loadingTier === tierKey || (subLoading && loadingTier === null)}
          />
        ))}
      </div>

      <p style={{
        marginTop: theme.spacing['2xl'],
        color: theme.colors.mutedForeground,
        fontSize: theme.typography.fontSize.sm,
        textAlign: 'center',
      }}>
        All plans include a 7-day free trial. Cancel anytime.
      </p>
    </div>
  );
};

export default PricingPage;
