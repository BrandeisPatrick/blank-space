/**
 * Subscription Tab (Beta Mode)
 * Shows beta access status and usage
 */

import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { getTheme } from '../../../styles/theme';
import { SettingsSection, SettingsSeparator } from '../shared';

const UsageBar = ({ label, used, limit, resetAt, theme, mode, colors }) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percent >= 75;
  const isExceeded = percent >= 100;

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
        marginBottom: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
        fontFamily: theme.typography.fontFamily.sans,
      }}>
        <span style={{
          color: colors.textPrimary,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {label}
        </span>
        <span style={{ color: colors.textSecondary }}>
          {used} / {limit}
          {resetAt && <span style={{ marginLeft: '8px', opacity: 0.7 }}>({formatResetTime(resetAt)})</span>}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(percent, 2)}%`,
          minWidth: percent > 0 ? '8px' : '0',
          height: '100%',
          background: mode === 'dark'
            ? (isExceeded ? 'rgba(255,255,255,0.6)' : isWarning ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.4)')
            : (isExceeded ? 'rgba(0,0,0,0.5)' : isWarning ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)'),
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
  const { usage, loading } = useSubscription();

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
  };

  if (!user) {
    return (
      <div style={{ padding: `${theme.spacing.xl} 0`, textAlign: 'center' }}>
        <p style={{
          color: colors.textSecondary,
          fontFamily: theme.typography.fontFamily.sans,
          fontSize: theme.typography.fontSize.sm,
          margin: 0,
        }}>
          Sign in to view your subscription
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      {/* Usage Section */}
      <SettingsSection title="Usage">
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
      </SettingsSection>

      <SettingsSeparator />

      {/* Coming Soon Section */}
      <SettingsSection title="Subscription Plans">
        <p style={{
          color: colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          margin: 0,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          Coming soon! Unlock higher limits and premium features.
        </p>
      </SettingsSection>
    </div>
  );
};

export default SubscriptionTab;
