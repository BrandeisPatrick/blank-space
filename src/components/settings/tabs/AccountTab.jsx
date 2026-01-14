import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { useConversation } from '../../../contexts/ConversationContext';
import { getTheme } from '../../../styles/theme';
import { SettingsRow, SettingsSeparator, SettingsButton } from '../shared';

export const AccountTab = () => {
  const { mode } = useTheme();
  const { user, signOut } = useAuth();
  const { deleteConversationData } = useUserProfile();
  const { clearAllConversations } = useConversation();
  const theme = getTheme(mode);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const colors = {
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    danger: '#ef4444',
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteConversations = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      // Delete from server
      const result = await deleteConversationData();

      if (result.success) {
        // Clear local state
        if (clearAllConversations) {
          clearAllConversations();
        }
        setDeleteResult({ success: true, count: result.deletedCount });
      } else {
        setDeleteResult({ success: false, error: result.error });
      }
    } catch (error) {
      setDeleteResult({ success: false, error: error.message });
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setDeleteResult(null);
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

      {/* Delete Conversation Data - Only show for authenticated users */}
      {user && (
        <>
          <SettingsSeparator />

          <SettingsRow
            title="Delete Conversation History"
            description={
              showConfirm
                ? "Are you sure? This action cannot be undone."
                : "Permanently delete all your chat conversations"
            }
            action={
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                {showConfirm && (
                  <SettingsButton onClick={handleCancelDelete} disabled={isDeleting}>
                    Cancel
                  </SettingsButton>
                )}
                <SettingsButton
                  onClick={handleDeleteConversations}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : showConfirm ? 'Confirm' : 'Delete'}
                </SettingsButton>
              </div>
            }
          />

          {/* Result message */}
          {deleteResult && (
            <div style={{
              padding: theme.spacing.sm,
              marginTop: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.sans,
              color: deleteResult.success ? '#22c55e' : colors.danger,
              backgroundColor: deleteResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: theme.radius.md,
            }}>
              {deleteResult.success
                ? `Successfully deleted ${deleteResult.count} conversation${deleteResult.count !== 1 ? 's' : ''}`
                : `Error: ${deleteResult.error}`
              }
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountTab;
