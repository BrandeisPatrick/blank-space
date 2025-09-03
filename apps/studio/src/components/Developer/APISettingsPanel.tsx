import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface APIEndpoint {
  name: string
  path: string
  method: 'GET' | 'POST'
  description: string
  status?: 'testing' | 'success' | 'error'
  responseTime?: number
  lastTested?: string
}

export const APISettingsPanel = () => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const [serverUrl, setServerUrl] = useState('http://localhost:3001')
  const [endpoints] = useState<APIEndpoint[]>([
    {
      name: 'Health Check',
      path: '/api/health',
      method: 'GET',
      description: 'Server health status'
    },
    {
      name: 'Generate Website',
      path: '/api/generate',
      method: 'POST',
      description: 'Generate website from prompt'
    },
    {
      name: 'Chat Response',
      path: '/api/chat',
      method: 'POST',
      description: 'Generate chat response'
    },
    {
      name: 'Classify Intent',
      path: '/api/classify-intent',
      method: 'POST',
      description: 'Classify user intent'
    },
    {
      name: 'List Providers',
      path: '/api/providers',
      method: 'GET',
      description: 'Get available AI providers'
    },
    {
      name: 'Test Provider',
      path: '/api/test-provider',
      method: 'POST',
      description: 'Test AI provider connection'
    }
  ])

  const [endpointStates, setEndpointStates] = useState<Record<string, APIEndpoint>>(
    endpoints.reduce((acc, endpoint) => ({
      ...acc,
      [endpoint.name]: endpoint
    }), {})
  )

  const testEndpoint = async (endpoint: APIEndpoint) => {
    setEndpointStates(prev => ({
      ...prev,
      [endpoint.name]: { ...prev[endpoint.name], status: 'testing' }
    }))

    const startTime = Date.now()
    
    try {
      const url = `${serverUrl}${endpoint.path}`
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Add test data for POST endpoints
      if (endpoint.method === 'POST') {
        if (endpoint.path === '/api/generate') {
          options.body = JSON.stringify({
            prompt: 'Create a simple hello world page',
            device: 'desktop',
            framework: 'vanilla'
          })
        } else if (endpoint.path === '/api/chat') {
          options.body = JSON.stringify({
            message: 'Hello, how are you?',
            context: {}
          })
        } else if (endpoint.path === '/api/classify-intent') {
          options.body = JSON.stringify({
            message: 'Create a website',
            hasActiveCode: false
          })
        } else if (endpoint.path === '/api/test-provider') {
          options.body = JSON.stringify({
            testPrompt: 'Hello test'
          })
        }
      }

      const response = await fetch(url, options)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      setEndpointStates(prev => ({
        ...prev,
        [endpoint.name]: {
          ...prev[endpoint.name],
          status: response.ok ? 'success' : 'error',
          responseTime,
          lastTested: new Date().toLocaleTimeString()
        }
      }))
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      setEndpointStates(prev => ({
        ...prev,
        [endpoint.name]: {
          ...prev[endpoint.name],
          status: 'error',
          responseTime,
          lastTested: new Date().toLocaleTimeString()
        }
      }))
    }
  }

  const testAllEndpoints = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'testing': return theme.colors.accent.primary
      case 'success': return theme.colors.status.success
      case 'error': return theme.colors.status.error
      default: return theme.colors.text.secondary
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'testing': return 'Testing...'
      case 'success': return 'Success'
      case 'error': return 'Error'
      default: return 'Not tested'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      {/* Server Configuration */}
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
          Server Configuration
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginTop: theme.spacing.md,
        }}>
          <label style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            minWidth: '100px',
          }}>
            Server URL:
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            style={{
              flex: 1,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.bg.primary,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily.mono,
            }}
          />
          <button
            onClick={testAllEndpoints}
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
            Test All
          </button>
        </div>
      </div>

      {/* API Endpoints */}
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
          API Endpoints
        </h3>
        
        <div style={{
          display: 'grid',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
        }}>
          {endpoints.map((endpoint) => {
            const state = endpointStates[endpoint.name]
            return (
              <div
                key={endpoint.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: theme.spacing.md,
                  background: theme.colors.bg.primary,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.xs,
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}>
                      {endpoint.name}
                    </span>
                    <span style={{
                      background: endpoint.method === 'GET' ? theme.colors.status.success : theme.colors.accent.primary,
                      color: 'white',
                      padding: `2px ${theme.spacing.xs}`,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}>
                      {endpoint.method}
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    fontFamily: theme.typography.fontFamily.mono,
                    marginBottom: theme.spacing.xs,
                  }}>
                    {endpoint.path}
                  </div>
                  
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                  }}>
                    {endpoint.description}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  minWidth: '200px',
                  justifyContent: 'flex-end',
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: theme.spacing.xs,
                  }}>
                    <div style={{
                      color: getStatusColor(state?.status),
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}>
                      {getStatusText(state?.status)}
                    </div>
                    
                    {state?.responseTime && (
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.secondary,
                      }}>
                        {state.responseTime}ms
                      </div>
                    )}
                    
                    {state?.lastTested && (
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.secondary,
                      }}>
                        {state.lastTested}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => testEndpoint(endpoint)}
                    disabled={state?.status === 'testing'}
                    style={{
                      background: state?.status === 'testing' 
                        ? theme.colors.bg.hover 
                        : theme.colors.bg.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      cursor: state?.status === 'testing' ? 'not-allowed' : 'pointer',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}