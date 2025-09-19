import { useState, useEffect } from 'react'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline'
  timestamp: string
  uptime?: string
  version?: string
  environment?: string
}

interface Metrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastHour: {
    requests: number
    successRate: number
  }
}

export const SystemMonitoringPanel = () => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const [health, setHealth] = useState<SystemHealth>({
    status: 'offline',
    timestamp: new Date().toISOString()
  })
  const [metrics, setMetrics] = useState<Metrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastHour: {
      requests: 0,
      successRate: 0
    }
  })
  const [serverUrl] = useState('/api')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const checkHealth = async () => {
    try {
      const startTime = Date.now()
      const response = await fetch(`${serverUrl}/health`)
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        setHealth({
          status: 'healthy',
          timestamp: data.timestamp || new Date().toISOString(),
          uptime: '2h 34m', // Mock data
          version: '1.0.0', // Mock data
          environment: import.meta.env.MODE
        })
        
        // Update metrics (mock data for demonstration)
        setMetrics(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          successfulRequests: prev.successfulRequests + 1,
          averageResponseTime: Math.round((prev.averageResponseTime + responseTime) / 2),
          lastHour: {
            requests: prev.lastHour.requests + 1,
            successRate: Math.round((prev.successfulRequests / prev.totalRequests) * 100) || 0
          }
        }))
      } else {
        setHealth(prev => ({
          ...prev,
          status: 'degraded',
          timestamp: new Date().toISOString()
        }))
      }
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        status: 'offline',
        timestamp: new Date().toISOString()
      }))
      
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        failedRequests: prev.failedRequests + 1
      }))
    } finally {
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(checkHealth, 5000) // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return theme.colors.status.success
      case 'degraded': return theme.colors.status.warning
      case 'offline': return theme.colors.status.error
      default: return theme.colors.text.secondary
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'offline': return '❌'
      default: return '❓'
    }
  }

  const clearMetrics = () => {
    setMetrics({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastHour: {
        requests: 0,
        successRate: 0
      }
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      {/* System Health Status */}
      <div style={{
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: theme.shadows.sm,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            margin: 0,
          }}>
            System Health
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto-refresh
            </label>
            
            <button
              onClick={checkHealth}
              style={{
                background: theme.colors.accent.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.radius.md,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Refresh Now
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.md,
        }}>
          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: theme.spacing.sm,
            }}>
              {getHealthIcon(health.status)}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: getHealthColor(health.status),
              marginBottom: theme.spacing.xs,
              textTransform: 'capitalize',
            }}>
              {health.status}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.secondary,
            }}>
              Last checked: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>

          {health.uptime && (
            <div style={{
              background: theme.colors.bg.primary,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
              border: `1px solid ${theme.colors.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}>
                Uptime
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {health.uptime}
              </div>
            </div>
          )}

          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              Environment
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              textTransform: 'uppercase',
            }}>
              {health.environment || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: theme.shadows.sm,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            margin: 0,
          }}>
            Performance Metrics
          </h3>
          
          <button
            onClick={clearMetrics}
            style={{
              background: theme.colors.status.error + '20',
              color: theme.colors.status.error,
              border: `1px solid ${theme.colors.status.error}`,
              borderRadius: theme.radius.md,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Clear Metrics
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: theme.spacing.md,
        }}>
          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              Total Requests
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              {metrics.totalRequests}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              Success Rate
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: metrics.totalRequests > 0 
                ? (metrics.successfulRequests / metrics.totalRequests > 0.8 
                  ? theme.colors.status.success 
                  : theme.colors.status.warning)
                : theme.colors.text.primary,
            }}>
              {metrics.totalRequests > 0 
                ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100) 
                : 0}%
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              Avg Response Time
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: metrics.averageResponseTime > 1000 
                ? theme.colors.status.error 
                : metrics.averageResponseTime > 500 
                  ? theme.colors.status.warning 
                  : theme.colors.status.success,
            }}>
              {metrics.averageResponseTime}ms
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              Failed Requests
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: metrics.failedRequests > 0 
                ? theme.colors.status.error 
                : theme.colors.text.primary,
            }}>
              {metrics.failedRequests}
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div style={{
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: theme.shadows.sm,
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.md,
          margin: 0,
        }}>
          System Information
        </h3>
        
        <div style={{
          background: theme.colors.bg.primary,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.mono,
            color: theme.colors.text.secondary,
            whiteSpace: 'pre-line',
          }}>
{`Frontend URL: ${window.location.origin}
Backend URL: ${serverUrl}
Environment: ${import.meta.env.MODE}
Build Mode: ${import.meta.env.DEV ? 'Development' : 'Production'}
Developer Mode: ${import.meta.env.VITE_ENABLE_DEVELOPER_MODE ? 'Enabled' : 'Disabled'}
User Agent: ${navigator.userAgent.split(' ')[0]}...`}
          </div>
        </div>
      </div>
    </div>
  )
}
