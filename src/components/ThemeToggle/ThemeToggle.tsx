import React from 'react'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'

export const ThemeToggle = React.memo(() => {
  const { mode, toggleMode } = useTheme()
  const currentTheme = getTheme(mode)

  return (
    <button
      onClick={toggleMode}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: currentTheme.spacing.md,
        padding: `${currentTheme.spacing.md} ${currentTheme.spacing.lg}`,
        background: mode === 'dark' ? currentTheme.colors.gradient.button : currentTheme.colors.bg.secondary,
        border: 'none',
        borderRadius: currentTheme.radius.lg,
        color: mode === 'dark' ? '#ffffff' : currentTheme.colors.text.secondary,
        fontSize: currentTheme.typography.fontSize.sm,
        fontWeight: currentTheme.typography.fontWeight.medium,
        cursor: 'pointer',
        transition: `all ${currentTheme.animation.normal}`,
        boxShadow: currentTheme.shadows.outset,
        height: '48px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = currentTheme.colors.accent.primary
        e.currentTarget.style.background = currentTheme.colors.bg.hover
        e.currentTarget.style.boxShadow = currentTheme.shadows.glow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = currentTheme.colors.text.secondary
        e.currentTarget.style.background = currentTheme.colors.bg.secondary
        e.currentTarget.style.boxShadow = currentTheme.shadows.outset
      }}
    >
      <span style={{ fontSize: currentTheme.typography.fontSize.sm }}>
        {mode === 'light' ? '🌙' : '☀️'}
      </span>
      <span>
        {mode === 'light' ? 'Dark' : 'Light'}
      </span>
    </button>
  )
})