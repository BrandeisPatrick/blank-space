import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { Z_INDEX } from '../../constants';
import { CloseIcon } from '../icons/icons';

export const AuthModal = ({ onAuthSuccess }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { signIn, signUp, error: authError, clearError } = useAuth();
  const { isAuthModalOpen, closeAuthModal } = useSettings();

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setLocalError('');

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
      } else {
        await signIn(formData.email, formData.password);
      }
      closeAuthModal();
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setLocalError('');
    clearError();
  };

  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setLocalError('');
    clearError();
    closeAuthModal();
  };

  const displayError = localError || authError;

  const inputStyle = {
    width: '100%',
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: theme.radius.lg,
    fontFamily: theme.typography.fontFamily.sans,
    outline: 'none',
    transition: `all ${theme.animation.normal}`,
    boxSizing: 'border-box',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '85vh',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          borderRadius: theme.radius['2xl'],
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
          zIndex: Z_INDEX.MODALS,
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.lg,
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.text.primary,
          }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={handleClose}
            className={`hover-glass-${mode} hover-transition`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: 'pointer',
            }}
          >
            <CloseIcon size={20} color={theme.colors.text.secondary} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.lg, overflowY: 'auto', flex: 1 }}>
          {/* Error Message */}
          {displayError && (
            <div style={{
              marginBottom: theme.spacing.lg,
              padding: theme.spacing.md,
              background: mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: theme.radius.lg,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <p style={{
                margin: 0,
                fontSize: theme.typography.fontSize.sm,
                color: '#EF4444',
                fontFamily: theme.typography.fontFamily.sans,
              }}>
                {displayError}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}>
            {/* Email Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
                fontFamily: theme.typography.fontFamily.sans,
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
                fontFamily: theme.typography.fontFamily.sans,
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`${!isLoading ? 'hover-elevate' : ''} hover-transition`}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: theme.radius.lg,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
                opacity: isLoading ? 0.7 : 1,
                marginTop: theme.spacing.sm,
              }}
            >
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div style={{
            textAlign: 'center',
            marginTop: theme.spacing.lg,
          }}>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.tertiary,
              margin: 0,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="hover-underline"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  fontFamily: theme.typography.fontFamily.sans,
                  padding: 0,
                }}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default AuthModal;
