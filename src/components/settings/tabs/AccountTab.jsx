import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { getTheme } from '../../../styles/theme';

// Icons
const CheckCircleIcon = ({ size = 20, color = '#10B981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ size = 20, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MailIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const KeyIcon = ({ size = 20, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const TrashIcon = ({ size = 20, color = '#EF4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const AccountTab = () => {
  const { mode } = useTheme();
  const { user, isEmailUser, changePassword, sendVerificationEmail, deleteAccount, error: authError, clearError } = useAuth();
  const { deleteAccountData } = useUserProfile();
  const { closeSettings } = useSettings();
  const theme = getTheme(mode);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email verification state
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');

  const isEmail = isEmailUser();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    clearError();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setPasswordChanging(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordForm(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleSendVerification = async () => {
    setVerificationSending(true);
    setError('');
    clearError();

    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setVerificationSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    clearError();
    setDeleting(true);

    try {
      // First delete Firestore data
      const dataDeleted = await deleteAccountData();
      if (!dataDeleted) {
        throw new Error('Failed to delete account data');
      }

      // Then delete Firebase Auth account
      await deleteAccount(isEmail ? deletePassword : null);

      // Close settings and redirect (user will be logged out automatically)
      closeSettings();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    border: mode === 'dark'
      ? '1px solid rgba(255, 255, 255, 0.15)'
      : '1px solid rgba(0, 0, 0, 0.1)',
    background: mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.sans,
    outline: 'none',
    transition: `all ${theme.animation.fast}`,
    boxSizing: 'border-box',
    marginBottom: theme.spacing.md,
  };

  return (
    <div>
      {/* Error Display */}
      {(error || authError) && (
        <div style={{
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444',
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.fontSize.sm,
        }}>
          {error || authError}
        </div>
      )}

      {/* Email Section */}
      <div style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        background: mode === 'dark'
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(0, 0, 0, 0.02)',
        marginBottom: theme.spacing.lg,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}>
          <MailIcon size={20} color={theme.colors.text.secondary} />
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Email Verification Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            {user?.emailVerified ? (
              <>
                <CheckCircleIcon size={18} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: theme.typography.fontSize.sm }}>
                  Verified
                </span>
              </>
            ) : (
              <>
                <AlertCircleIcon size={18} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: theme.typography.fontSize.sm }}>
                  Not verified
                </span>
              </>
            )}
          </div>

          {!user?.emailVerified && (
            <button
              onClick={handleSendVerification}
              disabled={verificationSending || verificationSent}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.radius.md,
                border: 'none',
                background: verificationSent ? '#10B981' : '#3B82F6',
                color: 'white',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: verificationSending || verificationSent ? 'default' : 'pointer',
                opacity: verificationSending ? 0.7 : 1,
                transition: `all ${theme.animation.fast}`,
              }}
            >
              {verificationSending ? 'Sending...' : verificationSent ? 'Sent!' : 'Resend'}
            </button>
          )}
        </div>
      </div>

      {/* Change Password Section (Email users only) */}
      {isEmail && (
        <div style={{
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          background: mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.02)',
          marginBottom: theme.spacing.lg,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}>
              <KeyIcon size={20} color={theme.colors.text.secondary} />
              <span style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Password
              </span>
            </div>

            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.radius.md,
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${theme.animation.fast}`,
                }}
              >
                Change
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} style={{ marginTop: theme.spacing.lg }}>
              <input
                type="password"
                placeholder="Current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                style={inputStyle}
                required
              />
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                style={inputStyle}
                minLength={6}
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                style={inputStyle}
                required
              />

              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                    border: mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    background: 'transparent',
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChanging}
                  style={{
                    flex: 1,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                    border: 'none',
                    background: passwordSuccess ? '#10B981' : '#3B82F6',
                    color: 'white',
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: passwordChanging ? 'default' : 'pointer',
                    opacity: passwordChanging ? 0.7 : 1,
                  }}
                >
                  {passwordChanging ? 'Changing...' : passwordSuccess ? 'Changed!' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sign-in Method */}
      <div style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        background: mode === 'dark'
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(0, 0, 0, 0.02)',
        marginBottom: theme.spacing.xl,
      }}>
        <div style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: theme.spacing.sm,
        }}>
          Sign-in Method
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.primary,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {isEmail ? 'Email & Password' : 'Google'}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        borderTop: '1px solid rgba(239, 68, 68, 0.3)',
        paddingTop: theme.spacing.lg,
      }}>
        <h3 style={{
          margin: `0 0 ${theme.spacing.md} 0`,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: '#EF4444',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Danger Zone
        </h3>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radius.lg,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              transition: `all ${theme.animation.fast}`,
            }}
          >
            <TrashIcon size={18} color="#EF4444" />
            Delete Account
          </button>
        ) : (
          <div style={{
            padding: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <p style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              lineHeight: 1.5,
            }}>
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>

            {isEmail && (
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{
                  ...inputStyle,
                  marginBottom: theme.spacing.md,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              />
            )}

            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || (isEmail && !deletePassword)}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: deleting || (isEmail && !deletePassword) ? 'default' : 'pointer',
                  opacity: deleting || (isEmail && !deletePassword) ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountTab;
