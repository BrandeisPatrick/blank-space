import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';

export const SignInPage = ({ onNavigateToMain, onNavigateToSignUp, onSignInSuccess }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { signIn, signInWithGoogle, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when user starts typing
    clearError();
    setShowWarning(false);
  };

  const showNotImplementedWarning = (feature) => {
    setWarningMessage(`${feature} is not implemented yet`);
    setShowWarning(true);
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowWarning(false);

    try {
      await signIn(formData.email, formData.password);
      // Success! The AuthContext will update user state
      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // Error is already set in AuthContext, show it as warning
      if (authError) {
        setWarningMessage(authError);
        setShowWarning(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setShowWarning(false);

    try {
      await signInWithGoogle();
      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      if (authError) {
        setWarningMessage(authError);
        setShowWarning(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            Welcome Back
          </h1>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            margin: 0,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Warning Notification */}
        {showWarning && (
          <div style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.outsetMd,
            border: `1px solid ${theme.colors.status.warning}`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            animation: 'slideIn 0.3s ease',
          }}>
            <span style={{
              fontSize: theme.typography.fontSize.lg,
            }}>⚠️</span>
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              fontFamily: theme.typography.fontFamily.sans,
              flex: 1,
            }}>
              {warningMessage}
            </p>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.tertiary,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.lg,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Sign In Form */}
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
              placeholder="Enter your password"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            <input
              type="checkbox"
              name="rememberMe"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              style={{
                width: '18px',
                height: '18px',
                accentColor: theme.colors.accent.primary,
              }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.sans,
                cursor: 'pointer',
              }}
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Sign In Button */}
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
            onMouseDown={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.sm;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onMouseUp={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.glow;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
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

        {/* Social Sign In */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
        }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              flex: 1,
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
            Google
          </button>
        </div>

        {/* Footer Links */}
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
            Don't have an account?{' '}
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
              onClick={onNavigateToSignUp}
            >
              Sign up
            </button>
          </p>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            margin: `${theme.spacing.sm} 0 0 0`,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
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
              onClick={() => showNotImplementedWarning('Password reset')}
            >
              Forgot your password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
