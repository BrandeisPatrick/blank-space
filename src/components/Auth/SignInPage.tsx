import React, { useState } from 'react'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'

interface SignInPageProps {
  onNavigateToMain?: () => void
  onSignIn?: (email: string, password: string) => Promise<void>
}

export const SignInPage = ({ onNavigateToMain, onSignIn }: SignInPageProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (onSignIn) {
        await onSignIn(formData.email, formData.password)
      } else {
        // Fallback - simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Sign in attempted with:', formData)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
                e.currentTarget.style.color = theme.colors.accent.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.text.tertiary
              }}
            >
              ← Back to Studio
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
                e.target.style.boxShadow = theme.shadows.glow
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = theme.shadows.sm
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
                e.target.style.boxShadow = theme.shadows.glow
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = theme.shadows.sm
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
              backgroundColor: theme.colors.accent.primary,
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
                e.currentTarget.style.boxShadow = theme.shadows.glow
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.outset
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
            onMouseDown={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.sm
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
            onMouseUp={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = theme.shadows.glow
                e.currentTarget.style.transform = 'translateY(-1px)'
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
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.outset
            }}
          >
            <span>🔍</span>
            Google
          </button>
          <button
            type="button"
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
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.outset
            }}
          >
            <span>📧</span>
            GitHub
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
              onClick={() => console.log('Navigate to sign up')}
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
              onClick={() => console.log('Navigate to forgot password')}
            >
              Forgot your password?
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}