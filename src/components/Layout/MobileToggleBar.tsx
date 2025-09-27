import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

export const MobileToggleBar = React.memo(() => {
  const { showChat, showCode, showPreview, togglePanel } = useAppStore()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const toggleButtons = [
    { key: 'chat', label: 'Chat', active: showChat },
    { key: 'code', label: 'Code', active: showCode },
    { key: 'preview', label: 'Preview', active: showPreview },
  ] as const

  return (
    <div style={{
      display: 'flex',
      background: theme.colors.gradient.subtle,
      borderBottom: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.sm,
      gap: theme.spacing.xs,
      boxShadow: theme.shadows.outsetMd,
    }}>
      {toggleButtons.map(({ key, label, active }) => (
        <button
          key={key}
          onClick={() => togglePanel(key)}
          style={{
            flex: 1,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: active ? theme.colors.gradient.primary : theme.colors.bg.secondary,
            color: active ? theme.colors.accent.primary : theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.radius.lg,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${theme.animation.fast}`,
            boxShadow: active ? theme.shadows.sm : theme.shadows.outset,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
})