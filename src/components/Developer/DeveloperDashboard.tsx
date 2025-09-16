import { useState } from 'react'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'
import { APISettingsPanel } from './APISettingsPanel'
import { AIProviderPanel } from './AIProviderPanel'
import { SystemMonitoringPanel } from './SystemMonitoringPanel'

interface DeveloperDashboardProps {
  onNavigateBack: () => void
}

type DeveloperTab = 'api' | 'providers' | 'monitoring'

export const DeveloperDashboard = ({ onNavigateBack }: DeveloperDashboardProps) => {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('api')
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Security check - only show in development
  const isDeveloperMode = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVELOPER_MODE === 'true'
  
  if (!isDeveloperMode) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.primary,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.sans,
      }}>
        <div style={{
          textAlign: 'center',
          padding: theme.spacing.xl,
        }}>
          <h2 style={{ marginBottom: theme.spacing.md }}>Access Denied</h2>
          <p>Developer features are only available in development mode.</p>
          <button
            onClick={onNavigateBack}
            style={{
              marginTop: theme.spacing.lg,
              background: theme.colors.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const tabStyle = (isActive: boolean) => ({
    background: isActive ? theme.colors.accent.primary : theme.colors.bg.secondary,
    color: isActive ? 'white' : theme.colors.text.secondary,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.sans,
    transition: `all ${theme.animation.normal}`,
    boxShadow: isActive ? theme.shadows.sm : theme.shadows.outset,
  })

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.colors.bg.primary,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      {/* Header */}
      <div style={{
        height: '64px',
        background: theme.colors.gradient.subtle,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${theme.spacing.lg}`,
        boxShadow: theme.shadows.outsetMd,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <button
            onClick={onNavigateBack}
            style={{
              background: theme.colors.bg.secondary,
              color: theme.colors.text.secondary,
              border: 'none',
              borderRadius: theme.radius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.sm,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            margin: 0,
          }}>
            Developer Dashboard
          </h1>
        </div>
        
        <div style={{
          background: theme.colors.accent.warning + '20',
          color: theme.colors.accent.warning,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderRadius: theme.radius.sm,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          DEV MODE
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: theme.colors.bg.secondary,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.md,
        display: 'flex',
        gap: theme.spacing.sm,
      }}>
        <button
          onClick={() => setActiveTab('api')}
          style={tabStyle(activeTab === 'api')}
        >
          API Settings
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          style={tabStyle(activeTab === 'providers')}
        >
          AI Providers
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          style={tabStyle(activeTab === 'monitoring')}
        >
          System Monitoring
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: theme.spacing.lg,
        overflow: 'auto',
      }}>
        {activeTab === 'api' && <APISettingsPanel />}
        {activeTab === 'providers' && <AIProviderPanel />}
        {activeTab === 'monitoring' && <SystemMonitoringPanel />}
      </div>
    </div>
  )
}