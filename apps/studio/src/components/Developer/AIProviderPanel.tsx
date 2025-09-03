import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface Provider {
  name: string
  configured: boolean
  models: string[]
  isDefault: boolean
  status?: 'testing' | 'success' | 'error'
  responseTime?: number
  lastTested?: string
  testResponse?: string
}

export const AIProviderPanel = () => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [serverUrl] = useState('http://localhost:3001')
  
  const fetchProviders = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/providers`)
      const data = await response.json()
      
      if (data.success) {
        setProviders(data.providers)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const testProvider = async (providerName: string) => {
    setProviders(prev => prev.map(p => 
      p.name === providerName 
        ? { ...p, status: 'testing', testResponse: undefined }
        : p
    ))

    const startTime = Date.now()
    
    try {
      const response = await fetch(`${serverUrl}/api/test-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerName,
          testPrompt: 'Hello! Can you introduce yourself briefly?'
        })
      })

      const data = await response.json()
      const endTime = Date.now()
      const responseTime = endTime - startTime

      setProviders(prev => prev.map(p => 
        p.name === providerName 
          ? { 
              ...p, 
              status: data.success ? 'success' : 'error',
              responseTime,
              lastTested: new Date().toLocaleTimeString(),
              testResponse: data.success ? data.response : data.error
            }
          : p
      ))
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      setProviders(prev => prev.map(p => 
        p.name === providerName 
          ? { 
              ...p, 
              status: 'error',
              responseTime,
              lastTested: new Date().toLocaleTimeString(),
              testResponse: error instanceof Error ? error.message : 'Connection failed'
            }
          : p
      ))
    }
  }

  const testAllProviders = async () => {
    const configuredProviders = providers.filter(p => p.configured)
    
    for (const provider of configuredProviders) {
      await testProvider(provider.name)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
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
      case 'success': return 'Online'
      case 'error': return 'Error'
      default: return 'Not tested'
    }
  }

  const maskApiKey = (configured: boolean) => {
    return configured ? '••••••••••••••••' : 'Not configured'
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: theme.colors.text.secondary,
      }}>
        Loading providers...
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      {/* Provider Overview */}
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
            AI Provider Configuration
          </h3>
          
          <button
            onClick={testAllProviders}
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
            Test All Configured
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gap: theme.spacing.md,
        }}>
          {providers.map((provider) => (
            <div
              key={provider.name}
              style={{
                background: theme.colors.bg.primary,
                borderRadius: theme.radius.md,
                padding: theme.spacing.lg,
                border: `2px solid ${provider.isDefault ? theme.colors.accent.primary : theme.colors.border}`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: theme.spacing.md,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  }}>
                    <h4 style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      margin: 0,
                      textTransform: 'capitalize',
                    }}>
                      {provider.name}
                    </h4>
                    
                    {provider.isDefault && (
                      <span style={{
                        background: theme.colors.accent.primary,
                        color: 'white',
                        padding: `2px ${theme.spacing.xs}`,
                        borderRadius: theme.radius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}>
                        DEFAULT
                      </span>
                    )}
                    
                    <span style={{
                      background: provider.configured 
                        ? theme.colors.status.success + '20'
                        : theme.colors.status.error + '20',
                      color: provider.configured 
                        ? theme.colors.status.success
                        : theme.colors.status.error,
                      padding: `2px ${theme.spacing.xs}`,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}>
                      {provider.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.sm,
                  }}>
                    <strong>API Key:</strong> {maskApiKey(provider.configured)}
                  </div>
                  
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.sm,
                  }}>
                    <strong>Available Models:</strong> {provider.models.join(', ') || 'None'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: theme.spacing.xs,
                  minWidth: '120px',
                }}>
                  <div style={{
                    color: getStatusColor(provider.status),
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}>
                    {getStatusText(provider.status)}
                  </div>
                  
                  {provider.responseTime && (
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}>
                      {provider.responseTime}ms
                    </div>
                  )}
                  
                  {provider.lastTested && (
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}>
                      {provider.lastTested}
                    </div>
                  )}
                  
                  <button
                    onClick={() => testProvider(provider.name)}
                    disabled={!provider.configured || provider.status === 'testing'}
                    style={{
                      background: provider.configured 
                        ? (provider.status === 'testing' ? theme.colors.bg.hover : theme.colors.bg.secondary)
                        : theme.colors.bg.hover,
                      color: provider.configured ? theme.colors.text.primary : theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      cursor: provider.configured && provider.status !== 'testing' ? 'pointer' : 'not-allowed',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    {provider.configured ? 'Test' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Test Response */}
              {provider.testResponse && (
                <div style={{
                  background: provider.status === 'success' 
                    ? theme.colors.status.success + '10'
                    : theme.colors.status.error + '10',
                  border: `1px solid ${
                    provider.status === 'success' 
                      ? theme.colors.status.success + '30'
                      : theme.colors.status.error + '30'
                  }`,
                  borderRadius: theme.radius.sm,
                  padding: theme.spacing.sm,
                  marginTop: theme.spacing.sm,
                }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: provider.status === 'success' 
                      ? theme.colors.status.success
                      : theme.colors.status.error,
                    marginBottom: theme.spacing.xs,
                  }}>
                    {provider.status === 'success' ? 'Test Response:' : 'Error:'}
                  </div>
                  
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.primary,
                    fontFamily: theme.typography.fontFamily.mono,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '100px',
                    overflow: 'auto',
                  }}>
                    {provider.testResponse}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Environment Variables Reference */}
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
          Environment Variables Reference
        </h3>
        
        <div style={{
          background: theme.colors.bg.primary,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            fontFamily: theme.typography.fontFamily.mono,
            color: theme.colors.text.secondary,
            whiteSpace: 'pre-line',
          }}>
{`# Add these to your .env file:
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here`}
          </div>
        </div>
      </div>
    </div>
  )
}