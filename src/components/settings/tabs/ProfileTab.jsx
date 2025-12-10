import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { getTheme } from '../../../styles/theme';

export const ProfileTab = () => {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useUserProfile();
  const theme = getTheme(mode);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const success = await updateProfile({
      displayName: formData.displayName.trim(),
      bio: formData.bio,
    });

    setSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const hasChanges = profile && (
    formData.displayName !== (profile.displayName || '') ||
    formData.bio !== (profile.bio || '')
  );

  if (loading && !profile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        color: theme.colors.text.secondary,
      }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div>
      {/* Avatar Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: theme.radius.full,
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
            : 'linear-gradient(135deg, #60A5FA, #A78BFA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: theme.typography.fontWeight.semibold,
          color: 'white',
          marginBottom: theme.spacing.sm,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}>
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt="Avatar"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: theme.radius.full,
                objectFit: 'cover',
              }}
            />
          ) : (
            (formData.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
          )}
        </div>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        }}>
          {user?.email}
        </span>
      </div>

      {/* Display Name */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
        }}>
          Display Name
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          maxLength={50}
          placeholder="Enter your display name"
          style={{
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
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = mode === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        }}>
          {formData.displayName.length}/50
        </div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <label style={{
          display: 'block',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
        }}>
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          maxLength={500}
          rows={4}
          placeholder="Tell us a bit about yourself..."
          style={{
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
            resize: 'vertical',
            minHeight: '100px',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = mode === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        }}>
          {formData.bio.length}/500
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          border: 'none',
          background: saveSuccess
            ? '#10B981'
            : hasChanges
              ? '#3B82F6'
              : mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
          color: hasChanges || saveSuccess ? 'white' : theme.colors.text.tertiary,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          fontFamily: theme.typography.fontFamily.sans,
          cursor: hasChanges && !saving ? 'pointer' : 'default',
          transition: `all ${theme.animation.fast}`,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
};

export default ProfileTab;
