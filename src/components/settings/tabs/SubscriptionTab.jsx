/**
 * Subscription Tab
 * Shows subscription status, usage, and upgrade options
 */

import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';

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

const UsageBar = ({ label, used, limit, theme }) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percent >= 75;
  const isExceeded = percent >= 100;

  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: theme.typography.fontSize.sm,
      }}>
        <span style={{ color: theme.colors.foreground }}>{label}</span>
        <span style={{ color: theme.colors.mutedForeground }}>{used} / {limit}</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: theme.colors.muted,
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#C97D63',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
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
        />
        <UsageBar
          label="Weekly"
          used={usage?.weekly || 0}
          limit={tierConfig?.weeklyRequests || 50}
          theme={theme}
        />
        <UsageBar
          label="Monthly"
          used={usage?.monthly || 0}
          limit={tierConfig?.monthlyRequests || 100}
          theme={theme}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: tier === 'free' ? '1fr 1fr' : '1fr',
            gap: theme.spacing.md,
          }}>
            {tier === 'free' && (
              <div style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              }}>
                <h4 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.xs,
                }}>
                  Lite
                </h4>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.sm,
                }}>
                  $4.99<span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground }}>/mo</span>
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: `0 0 ${theme.spacing.md} 0`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mutedForeground,
                }}>
                  <li>50 requests/day</li>
                  <li>250 requests/week</li>
                  <li>1,000 requests/month</li>
                </ul>
                <button
                  style={buttonStyle()}
                  onClick={() => handleUpgrade('lite')}
                  disabled={upgradeLoading === 'lite'}
                >
                  {upgradeLoading === 'lite' ? 'Loading...' : 'Upgrade to Lite'}
                </button>
              </div>
            )}
            <div style={{
              border: `2px solid #C97D63`,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#C97D63',
                color: 'white',
                padding: '2px 12px',
                borderRadius: theme.radius.full,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.semibold,
              }}>
                RECOMMENDED
              </div>
              <h4 style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.foreground,
                marginBottom: theme.spacing.xs,
              }}>
                Pro
              </h4>
              <p style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.foreground,
                marginBottom: theme.spacing.sm,
              }}>
                $24.99<span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground }}>/mo</span>
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: `0 0 ${theme.spacing.md} 0`,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mutedForeground,
              }}>
                <li>200 requests/day</li>
                <li>1,000 requests/week</li>
                <li>5,000 requests/month</li>
                <li style={{ color: '#C97D63', fontWeight: 500 }}>+ Pro Model Access</li>
              </ul>
              <button
                style={buttonStyle(true)}
                onClick={() => handleUpgrade('pro')}
                disabled={upgradeLoading === 'pro'}
              >
                {upgradeLoading === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
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
