import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';
import { SettingsRow, SettingsSeparator, SettingsButton } from '../shared';

const UserIcon = ({ size = 48, color = '#7e7e7e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: theme.spacing.xl,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          {/* Avatar */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.radius.full,
            background: mode === 'dark' ? '#2a2a2a' : '#e5e5e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <UserIcon size={28} color={colors.textSecondary} />
            )}
          </div>
          {/* Name & Email */}
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.base,
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
