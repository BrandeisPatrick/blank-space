/**
 * Subscription Tab (Beta Mode)
 * Shows beta access status and usage
 */

import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { getTheme } from '../../../styles/theme';

const UsageBar = ({ label, used, limit, resetAt, theme, mode, colors }) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percent >= 75;
  const isExceeded = percent >= 100;

  // Format reset time
  const formatResetTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `Resets in ${diffDays}d`;
    if (diffHours > 0) return `Resets in ${diffHours}h`;
    return 'Resets soon';
  };

  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: theme.typography.fontSize.sm,
        fontFamily: theme.typography.fontFamily.sans,
      }}>
        <span style={{ color: colors.textPrimary }}>{label}</span>
        <span style={{ color: colors.textSecondary }}>
          {used} / {limit}
          {resetAt && <span style={{ marginLeft: '8px', opacity: 0.7 }}>({formatResetTime(resetAt)})</span>}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '10px',
        background: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        borderRadius: '5px',
        overflow: 'hidden',
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
        }} />
      </div>
    </div>
  );
};

export const SubscriptionTab = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user } = useAuth();
  const { usage, loading } = useSubscription();

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    separator: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  };

  if (!user) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <p style={{
          color: colors.textSecondary,
          fontFamily: theme.typography.fontFamily.sans,
          fontSize: theme.typography.fontSize.sm,
        }}>
          Sign in to view your account
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>

      {/* Usage */}
      <div style={{ paddingBottom: theme.spacing.xl }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: colors.textPrimary,
          fontFamily: theme.typography.fontFamily.sans,
          margin: 0,
          marginBottom: theme.spacing.lg,
        }}>
          Usage
        </h3>

        {loading ? (
          <p style={{
            color: colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.sans,
            margin: 0,
          }}>
            Loading...
          </p>
        ) : usage ? (
          <>
            <UsageBar
              label="Daily"
              used={usage.daily?.used || 0}
              limit={usage.daily?.limit || 300}
              resetAt={usage.daily?.resetAt}
              theme={theme}
              mode={mode}
              colors={colors}
            />
            <UsageBar
              label="Monthly"
              used={usage.monthly?.used || 0}
              limit={usage.monthly?.limit || 500}
              resetAt={usage.monthly?.resetAt}
              theme={theme}
              mode={mode}
              colors={colors}
            />
            <p style={{
              color: colors.textSecondary,
              fontSize: theme.typography.fontSize.xs,
              margin: 0,
              marginTop: theme.spacing.xs,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              Pro model uses 3 credits per request
            </p>
          </>
        ) : (
          <p style={{
            color: colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.sans,
            margin: 0,
          }}>
            No usage data available
          </p>
        )}
      </div>

      {/* Separator line */}
      <div style={{ height: '1px', background: colors.separator, marginBottom: theme.spacing.xl }} />

      {/* Features */}
      <div style={{ paddingBottom: theme.spacing.xl }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: colors.textPrimary,
          margin: 0,
          marginBottom: theme.spacing.md,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Included Features
        </h3>
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          color: colors.textPrimary,
          fontSize: theme.typography.fontSize.sm,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          {[
            'Lite Model (1 credit/request)',
            'Pro Model (3 credits/request)',
            'Unlimited projects',
          ].map((feature, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}>
              <span style={{ color: '#10b981' }}>✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Separator line */}
      <div style={{ height: '1px', background: colors.separator, marginBottom: theme.spacing.xl }} />

      {/* Coming Soon */}
      <div>
        <h3 style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: colors.textPrimary,
          margin: 0,
          marginBottom: theme.spacing.sm,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Subscription Plans
        </h3>
        <p style={{
          color: colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          margin: 0,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Coming soon! Unlock higher limits and premium features.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionTab;
