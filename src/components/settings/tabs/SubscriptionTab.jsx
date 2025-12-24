/**
 * Subscription Tab
 * Shows subscription status, usage, and upgrade options
 * Uses tier config from API (single source of truth)
 */

import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';

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

// Tier colors
const TIER_COLORS = {
  free: '#6B7280',
  lite: '#3B82F6',
  pro: '#C97D63',
};

export const SubscriptionTab = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user } = useAuth();
  const {
    tier,
    tierConfig,
    allTiers,
    usage,
    subscription,
    loading,
    createCheckoutSession,
    openCustomerPortal,
  } = useSubscription();

  const [upgradeLoading, setUpgradeLoading] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('lite');
  const [selectedUsageModel, setSelectedUsageModel] = useState('lite');

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

  // Get tier info from API or fallback
  const currentTierConfig = tierConfig || allTiers?.[tier] || { name: 'Free', price: 0 };
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.free;
  const priceDisplay = currentTierConfig.price > 0 ? `$${currentTierConfig.price}/mo` : '$0';

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

  // Get upgrade tier config
  const getUpgradeTierConfig = (targetTier) => {
    return allTiers?.[targetTier] || { name: targetTier, price: 0, liteModel: {}, proModel: {} };
  };

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
              background: tierColor + '20',
              borderRadius: theme.radius.full,
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: tierColor,
              }} />
              <span style={{
                color: tierColor,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
              }}>
                {currentTierConfig.name}
              </span>
              <span style={{
                color: theme.colors.mutedForeground,
                fontSize: theme.typography.fontSize.sm,
              }}>
                {priceDisplay}
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

        {/* Model Tab Bar */}
        <div style={{
          display: 'flex',
          background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: theme.radius.lg,
          padding: '4px',
          marginBottom: theme.spacing.lg,
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
        }}>
          <button
            onClick={() => setSelectedUsageModel('lite')}
            style={{
              flex: 1,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: 'none',
              borderRadius: theme.radius.md,
              background: selectedUsageModel === 'lite'
                ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                : 'transparent',
              backdropFilter: selectedUsageModel === 'lite' ? 'blur(4px)' : 'none',
              WebkitBackdropFilter: selectedUsageModel === 'lite' ? 'blur(4px)' : 'none',
              color: selectedUsageModel === 'lite' ? theme.colors.foreground : theme.colors.mutedForeground,
              fontWeight: selectedUsageModel === 'lite' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedUsageModel === 'lite'
                ? (mode === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)')
                : 'none',
            }}
          >
            Lite Model
          </button>
          <button
            onClick={() => setSelectedUsageModel('pro')}
            style={{
              flex: 1,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: 'none',
              borderRadius: theme.radius.md,
              background: selectedUsageModel === 'pro'
                ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                : 'transparent',
              backdropFilter: selectedUsageModel === 'pro' ? 'blur(4px)' : 'none',
              WebkitBackdropFilter: selectedUsageModel === 'pro' ? 'blur(4px)' : 'none',
              color: selectedUsageModel === 'pro' ? theme.colors.foreground : theme.colors.mutedForeground,
              fontWeight: selectedUsageModel === 'pro' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedUsageModel === 'pro'
                ? (mode === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)')
                : 'none',
            }}
          >
            Pro Model
          </button>
        </div>

        {/* Usage Bars for selected model */}
        {(() => {
          const modelUsage = usage?.[selectedUsageModel];
          const modelLimits = selectedUsageModel === 'lite'
            ? tierConfig?.liteModel
            : tierConfig?.proModel;

          if (!modelLimits) {
            return (
              <p style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.mutedForeground,
                fontSize: theme.typography.fontSize.sm,
              }}>
                Pro model is not available on the Free plan
              </p>
            );
          }

          return (
            <>
              <UsageBar
                label="Daily"
                used={modelUsage?.daily || 0}
                limit={modelLimits.daily}
                theme={theme}
                mode={mode}
              />
              <UsageBar
                label="Monthly"
                used={modelUsage?.monthly || 0}
                limit={modelLimits.monthly}
                theme={theme}
                mode={mode}
              />
            </>
          );
        })()}
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
              background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: theme.radius.lg,
              padding: '4px',
              marginBottom: theme.spacing.lg,
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
            }}>
              <button
                onClick={() => setSelectedPlan('lite')}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: 'none',
                  borderRadius: theme.radius.md,
                  background: selectedPlan === 'lite'
                    ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                    : 'transparent',
                  backdropFilter: selectedPlan === 'lite' ? 'blur(4px)' : 'none',
                  WebkitBackdropFilter: selectedPlan === 'lite' ? 'blur(4px)' : 'none',
                  color: selectedPlan === 'lite' ? theme.colors.foreground : theme.colors.mutedForeground,
                  fontWeight: selectedPlan === 'lite' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedPlan === 'lite'
                    ? (mode === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)')
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
                  background: selectedPlan === 'pro'
                    ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                    : 'transparent',
                  backdropFilter: selectedPlan === 'pro' ? 'blur(4px)' : 'none',
                  WebkitBackdropFilter: selectedPlan === 'pro' ? 'blur(4px)' : 'none',
                  color: selectedPlan === 'pro' ? theme.colors.foreground : theme.colors.mutedForeground,
                  fontWeight: selectedPlan === 'pro' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedPlan === 'pro'
                    ? (mode === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)')
                    : 'none',
                }}
              >
                Pro
              </button>
            </div>
          )}

          {/* Plan Card - uses API data */}
          {(() => {
            const targetTier = tier === 'lite' ? 'pro' : selectedPlan;
            const upgradeTierConfig = getUpgradeTierConfig(targetTier);
            const liteModel = upgradeTierConfig.liteModel || {};
            const proModel = upgradeTierConfig.proModel || {};

            return (
              <div style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              }}>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.md,
                }}>
                  ${upgradeTierConfig.price}<span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground }}>/mo</span>
                </p>
                <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing.lg }}>
                  <p style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.foreground, marginBottom: theme.spacing.xs }}>Lite Model</p>
                  <p style={{ marginBottom: '2px' }}>{liteModel.daily?.toLocaleString() || '—'} / day</p>
                  <p style={{ marginBottom: theme.spacing.md }}>{liteModel.monthly?.toLocaleString() || '—'} / month</p>
                  <p style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.foreground, marginBottom: theme.spacing.xs }}>Pro Model</p>
                  <p style={{ marginBottom: '2px' }}>{proModel.daily?.toLocaleString() || '—'} / day</p>
                  <p>{proModel.monthly?.toLocaleString() || '—'} / month</p>
                </div>
                <button
                  style={buttonStyle(true)}
                  onClick={() => handleUpgrade(targetTier)}
                  disabled={upgradeLoading === targetTier}
                >
                  {upgradeLoading === targetTier ? 'Loading...' : `Upgrade to ${upgradeTierConfig.name}`}
                </button>
              </div>
            );
          })()}
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
