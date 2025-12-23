/**
 * Subscription Tab
 * Shows subscription status, usage, and upgrade options
 */

import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';
import { createGlassEffect } from '../../../styles/componentStyles';

const TIER_INFO = {
  free: {
    name: 'Free',
    price: '$0',
    color: '#6B7280',
  },
  lite: {
    name: 'Lite',
    price: '$4.99/mo',
    color: '#3B82F6',
  },
  pro: {
    name: 'Pro',
    price: '$24.99/mo',
    color: '#C97D63',
  },
};

const UsageBar = ({ label, used, limit, theme, mode }) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percent >= 75;
  const isExceeded = percent >= 100;

  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: theme.typography.fontSize.sm,
      }}>
        <span style={{ color: theme.colors.foreground }}>{label}</span>
        <span style={{ color: theme.colors.mutedForeground }}>{used} / {limit}</span>
      </div>
      <div style={{
        width: '100%',
        height: '10px',
        background: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: mode === 'dark'
          ? 'inset 0 1px 2px rgba(0,0,0,0.3)'
          : 'inset 0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          width: `${Math.max(percent, 2)}%`,
          minWidth: percent > 0 ? '8px' : '0',
          height: '100%',
          background: isExceeded
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : isWarning
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #C97D63, #b06b52)',
          borderRadius: '5px',
          transition: 'width 0.3s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
};

export const SubscriptionTab = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user } = useAuth();
  const {
    tier,
    tierConfig,
    usage,
    subscription,
    loading,
    createCheckoutSession,
    openCustomerPortal,
  } = useSubscription();

  const [upgradeLoading, setUpgradeLoading] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('lite');

  const handleUpgrade = async (targetTier) => {
    try {
      setUpgradeLoading(targetTier);
      await createCheckoutSession(targetTier);
    } catch (error) {
      console.error('Upgrade error:', error);
      setUpgradeLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  const currentTierInfo = TIER_INFO[tier] || TIER_INFO.free;

  const sectionStyle = {
    background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  };

  const buttonStyle = (primary = false) => ({
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.lg,
    border: primary ? 'none' : `1px solid ${theme.colors.border}`,
    background: primary ? '#C97D63' : 'transparent',
    color: primary ? 'white' : theme.colors.foreground,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  });

  if (!user) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <p style={{ color: theme.colors.mutedForeground }}>
          Sign in to view subscription details
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <p style={{ color: theme.colors.mutedForeground }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Current Plan */}
      <div style={sectionStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <div>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.foreground,
              marginBottom: '4px',
            }}>
              Current Plan
            </h3>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              background: currentTierInfo.color + '20',
              borderRadius: theme.radius.full,
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentTierInfo.color,
              }} />
              <span style={{
                color: currentTierInfo.color,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
              }}>
                {currentTierInfo.name}
              </span>
              <span style={{
                color: theme.colors.mutedForeground,
                fontSize: theme.typography.fontSize.sm,
              }}>
                {currentTierInfo.price}
              </span>
            </div>
          </div>
          {tier !== 'free' && (
            <button style={buttonStyle()} onClick={handleManage}>
              Manage Billing
            </button>
          )}
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            color: '#92400e',
            fontSize: theme.typography.fontSize.sm,
          }}>
            Your subscription will cancel at the end of the billing period.
          </div>
        )}
      </div>

      {/* Usage */}
      <div style={sectionStyle}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.foreground,
          marginBottom: theme.spacing.lg,
        }}>
          Usage
        </h3>
        <UsageBar
          label="Daily"
          used={usage?.daily || 0}
          limit={tierConfig?.dailyRequests || 10}
          theme={theme}
          mode={mode}
        />
        <UsageBar
          label="Weekly"
          used={usage?.weekly || 0}
          limit={tierConfig?.weeklyRequests || 50}
          theme={theme}
          mode={mode}
        />
        <UsageBar
          label="Monthly"
          used={usage?.monthly || 0}
          limit={tierConfig?.monthlyRequests || 100}
          theme={theme}
          mode={mode}
        />
      </div>

      {/* Upgrade Options */}
      {tier !== 'pro' && (
        <div style={sectionStyle}>
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.foreground,
            marginBottom: theme.spacing.lg,
          }}>
            Upgrade
          </h3>

          {/* Plan Tab Bar */}
          {tier === 'free' && (
            <div style={{
              display: 'flex',
              ...createGlassEffect(theme),
              borderRadius: theme.radius.lg,
              padding: '4px',
              marginBottom: theme.spacing.lg,
            }}>
              <button
                onClick={() => setSelectedPlan('lite')}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: 'none',
                  borderRadius: theme.radius.md,
                  ...(selectedPlan === 'lite' ? createGlassEffect(theme) : {}),
                  background: selectedPlan === 'lite'
                    ? (mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)')
                    : 'transparent',
                  color: selectedPlan === 'lite' ? theme.colors.foreground : theme.colors.mutedForeground,
                  fontWeight: selectedPlan === 'lite' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedPlan === 'lite'
                    ? '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'none',
                }}
              >
                Lite
              </button>
              <button
                onClick={() => setSelectedPlan('pro')}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: 'none',
                  borderRadius: theme.radius.md,
                  ...(selectedPlan === 'pro' ? createGlassEffect(theme) : {}),
                  background: selectedPlan === 'pro'
                    ? (mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)')
                    : 'transparent',
                  color: selectedPlan === 'pro' ? theme.colors.foreground : theme.colors.mutedForeground,
                  fontWeight: selectedPlan === 'pro' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedPlan === 'pro'
                    ? '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'none',
                }}
              >
                Pro
              </button>
            </div>
          )}

          {/* Plan Card */}
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
          }}>
            {(tier === 'lite' || selectedPlan === 'pro') ? (
              <>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.md,
                }}>
                  $24.99<span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground }}>/mo</span>
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: `0 0 ${theme.spacing.lg} 0`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mutedForeground,
                }}>
                  <li style={{ marginBottom: theme.spacing.xs }}>200 calls/day</li>
                  <li style={{ marginBottom: theme.spacing.xs }}>1,000 calls/week</li>
                  <li style={{ marginBottom: theme.spacing.xs }}>5,000 calls/month</li>
                  <li>+ Pro Model Access</li>
                </ul>
                <button
                  style={buttonStyle(true)}
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgradeLoading === 'pro'}
                >
                  {upgradeLoading === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              </>
            ) : (
              <>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.md,
                }}>
                  $4.99<span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground }}>/mo</span>
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: `0 0 ${theme.spacing.lg} 0`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mutedForeground,
                }}>
                  <li style={{ marginBottom: theme.spacing.xs }}>50 calls/day</li>
                  <li style={{ marginBottom: theme.spacing.xs }}>250 calls/week</li>
                  <li style={{ marginBottom: theme.spacing.xs }}>1,000 calls/month</li>
                </ul>
                <button
                  style={buttonStyle(true)}
                  onClick={() => handleUpgrade('lite')}
                  disabled={upgradeLoading === 'lite'}
                >
                  {upgradeLoading === 'lite' ? 'Loading...' : 'Upgrade to Lite'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pro user message */}
      {tier === 'pro' && (
        <div style={{
          ...sectionStyle,
          textAlign: 'center',
          background: '#C97D6320',
        }}>
          <p style={{
            color: '#C97D63',
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            You're on the Pro plan with full access to all features!
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
