import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTheme } from '../../../styles/theme';

// User icon for avatar fallback
const UserIcon = ({ size = 48, color = '#7e7e7e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const AccountTab = () => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const theme = getTheme(mode);

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      {/* User Profile Section */}
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

      {/* Sign In Prompt for Guests */}
      {!user && (
        <div style={{
          paddingTop: theme.spacing.lg,
        }}>
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.sm,
            color: colors.textSecondary,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            Sign in to sync your settings and projects across devices.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountTab;
