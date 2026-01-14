import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';
import { SettingsRow, SettingsSeparator, SettingsButton } from '../shared';

export const AccountTab = () => {
  const { mode } = useTheme();
  const { user, signOut } = useAuth();
  const theme = getTheme(mode);

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      {/* Profile Section */}
      <div style={{ paddingBottom: theme.spacing.xl }}>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: colors.textPrimary,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          {user?.displayName || 'Guest User'}
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: colors.textSecondary,
          fontFamily: theme.typography.fontFamily.sans,
        }}>
          {user?.email || 'Not signed in'}
        </div>
      </div>

      <SettingsSeparator />

      {/* Sign Out Option */}
      {user ? (
        <SettingsRow
          title="Sign Out"
          description="Sign out of your account on this device"
          action={<SettingsButton onClick={handleSignOut}>Sign Out</SettingsButton>}
        />
      ) : (
        <SettingsRow
          title="Sign In"
          description="Sign in to sync your settings and projects across devices"
        />
      )}
    </div>
  );
};

export default AccountTab;
