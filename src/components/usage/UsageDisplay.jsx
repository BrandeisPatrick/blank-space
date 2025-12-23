/**
 * Usage Display Component
 *
 * Shows current quota usage with progress bars.
 */

import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';

const UsageBar = ({ label, used, limit, resetAt, theme }) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percent >= 75;
  const isExceeded = percent >= 100;

  const barBgStyle = {
    width: '100%',
    height: '8px',
    background: theme.colors.muted,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  };

  const barFillStyle = {
    width: `${percent}%`,
    height: '100%',
    background: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#C97D63',
    borderRadius: theme.radius.full,
    transition: 'width 0.3s ease',
  };

  const formatResetTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Resets in ${diffDays}d`;
    if (diffHours > 0) return `Resets in ${diffHours}h`;
    return 'Resets soon';
  };

  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
      }}>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.foreground,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.mutedForeground,
        }}>
          {used} / {limit}
        </span>
      </div>
      <div style={barBgStyle}>
        <div style={barFillStyle} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xs,
      }}>
        <span style={{
          fontSize: theme.typography.fontSize.xs,
          color: isExceeded ? '#ef4444' : theme.colors.mutedForeground,
        }}>
          {isExceeded ? 'Limit reached' : `${percent}% used`}
        </span>
        <span style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.mutedForeground,
        }}>
          {formatResetTime(resetAt)}
        </span>
      </div>
    </div>
  );
};

export const UsageDisplay = ({ compact = false }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const {
    tier,
    tierConfig,
    usage,
    subscription,
    loading,
    openCustomerPortal,
  } = useSubscription();

  if (loading) {
    return (
      <div style={{
        ...createGlassEffect(theme),
        padding: theme.spacing.xl,
        borderRadius: theme.radius.xl,
      }}>
        <p style={{ color: theme.colors.mutedForeground }}>Loading usage...</p>
      </div>
    );
  }

  const containerStyle = {
    ...createGlassEffect(theme),
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const tierBadgeStyle = {
    background: tier === 'pro' ? '#C97D63' : tier === 'lite' ? theme.colors.muted : 'transparent',
    color: tier === 'pro' ? 'white' : theme.colors.foreground,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.full,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    border: tier === 'free' ? `1px solid ${theme.colors.border}` : 'none',
  };

  const manageButtonStyle = {
    background: 'none',
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.foreground,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.lg,
    fontSize: theme.typography.fontSize.sm,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.foreground,
            marginBottom: theme.spacing.xs,
          }}>
            Usage & Billing
          </h3>
          <span style={tierBadgeStyle}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
          </span>
        </div>
        {tier !== 'free' && (
          <button style={manageButtonStyle} onClick={openCustomerPortal}>
            Manage
          </button>
        )}
      </div>

      {subscription?.status === 'past_due' && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          color: '#991b1b',
          fontSize: theme.typography.fontSize.sm,
        }}>
          Payment failed. Please update your payment method.
        </div>
      )}

      {subscription?.cancelAtPeriodEnd && (
        <div style={{
          background: '#fefce8',
          border: '1px solid #fef08a',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          color: '#854d0e',
          fontSize: theme.typography.fontSize.sm,
        }}>
          Your subscription will cancel at the end of the billing period.
        </div>
      )}

      {!compact && (
        <>
          <UsageBar
            label="Daily"
            used={usage?.daily || 0}
            limit={tierConfig?.dailyRequests || 10}
            resetAt={usage?.remaining?.daily !== undefined ? usage.resetAt?.daily : null}
            theme={theme}
          />
          <UsageBar
            label="Weekly"
            used={usage?.weekly || 0}
            limit={tierConfig?.weeklyRequests || 50}
            resetAt={usage?.resetAt?.weekly}
            theme={theme}
          />
          <UsageBar
            label="Monthly"
            used={usage?.monthly || 0}
            limit={tierConfig?.monthlyRequests || 100}
            resetAt={usage?.resetAt?.monthly}
            theme={theme}
          />
        </>
      )}

      {compact && (
        <UsageBar
          label="Daily"
          used={usage?.daily || 0}
          limit={tierConfig?.dailyRequests || 10}
          resetAt={usage?.resetAt?.daily}
          theme={theme}
        />
      )}

      {tier === 'free' && (
        <a
          href="/pricing"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: theme.spacing.lg,
            color: '#C97D63',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            textDecoration: 'none',
          }}
        >
          Upgrade for more requests →
        </a>
      )}
    </div>
  );
};

export default UsageDisplay;
