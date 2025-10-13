import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getTheme } from '../styles/theme';

export const SignUpPage = ({ onNavigateToSignIn, onNavigateToMain, onSignUpSuccess }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { signUp, signInWithGoogle, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setLocalError('');

    try {
      await signUp(formData.email, formData.password);
      // Success! The AuthContext will update user state
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      // Error is already set in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLocalError('');

    try {
      await signInWithGoogle();
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg.primary,
      backgroundImage: theme.colors.gradient.subtle,
      padding: theme.spacing.lg,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.xl,
        padding: theme.spacing['3xl'],
        boxShadow: theme.shadows.outsetMd,
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: theme.spacing['3xl'],
        }}>
          {onNavigateToMain && (
            <button
              onClick={onNavigateToMain}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.tertiary,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontFamily: theme.typography.fontFamily.sans,
                marginBottom: theme.spacing.lg,
                transition: `color ${theme.animation.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.text.tertiary;
              }}
            >
              ← Back to Home
            </button>
          )}
          <h1 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: '0 0 8px 0',
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            Create Account
          </h1>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            margin: 0,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            Sign up to start building
          </p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.outsetMd,
            border: `1px solid ${theme.colors.status.error}`,
          }}>
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.status.error,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              {displayError}
            </p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
        }}>
          {/* Email Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              fontFamily: theme.typography.fontFamily.sans,
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.bg.primary,
                border: 'none',
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.sm,
                fontFamily: theme.typography.fontFamily.sans,
                outline: 'none',
                transition: `box-shadow ${theme.animation.normal}`,
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = theme.shadows.glow;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = theme.shadows.sm;
              }}
              placeholder="Enter your email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
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
              style={{
                width: '100%',
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.bg.primary,
                border: 'none',
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.sm,
                fontFamily: theme.typography.fontFamily.sans,
                outline: 'none',
                transition: `box-shadow ${theme.animation.normal}`,
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = theme.shadows.glow;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = theme.shadows.sm;
              }}
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: theme.spacing.lg,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: '#ffffff',
              backgroundColor: '#2a2a2a',
              border: 'none',
              borderRadius: theme.radius.md,
              boxShadow: theme.shadows.outset,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.glow;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.outset;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: `${theme.spacing.xl} 0`,
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: theme.colors.bg.border,
          }} />
          <span style={{
            padding: `0 ${theme.spacing.md}`,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            or
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: theme.colors.bg.border,
          }} />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: '#ffffff',
            backgroundColor: '#333333',
            border: 'none',
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.outset,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: theme.typography.fontFamily.sans,
            transition: `all ${theme.animation.normal}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.boxShadow = theme.shadows.outset;
            }
          }}
        >
          <span>🔍</span>
          Continue with Google
        </button>

        {/* Footer Link */}
        <div style={{
          textAlign: 'center',
          marginTop: theme.spacing.xl,
        }}>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            margin: 0,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            Already have an account?{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.accent.primary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: theme.typography.fontFamily.sans,
              }}
              onClick={onNavigateToSignIn}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
