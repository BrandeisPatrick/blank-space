import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { webContainerService } from '../../lib/webContainerService'

export const PreviewPanel = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { currentArtifactId, artifacts } = useAppStore()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const currentArtifact = artifacts.find((a: any) => a.id === currentArtifactId)

  useEffect(() => {
    if (!currentArtifact) {
      setPreviewUrl(null)
      setStatusMessage('')
      return
    }

    let isCancelled = false

    const setupPreview = async () => {
      setIsLoading(true)
      setError(null)
      setStatusMessage('Booting WebContainer...')

      try {
        // Check if the artifact has a server process already
        if (currentArtifact.serverProcess?.url) {
          setPreviewUrl(currentArtifact.serverProcess.url)
          setIsLoading(false)
          setStatusMessage('Connected to dev server')
          return
        }

        // Otherwise, check existing server URL from WebContainer
        const existingUrl = webContainerService.getServerUrl()
        if (existingUrl) {
          setPreviewUrl(existingUrl)
          setIsLoading(false)
          setStatusMessage('Connected to dev server')
          return
        }

        // BinaArtifact system: Actions (including server start) are handled by chatService
        // Just wait for the server-ready event
        setStatusMessage('Waiting for dev server...')

        // Poll for server URL (will be set by BinaAction execution)
        const pollInterval = setInterval(() => {
          const url = webContainerService.getServerUrl()
          if (url && !isCancelled) {
            setPreviewUrl(url)
            setIsLoading(false)
            setStatusMessage('Connected')
            clearInterval(pollInterval)
          }
        }, 500)

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!webContainerService.getServerUrl() && !isCancelled) {
            clearInterval(pollInterval)
            setError('Server startup timeout. Try regenerating.')
            setIsLoading(false)
          }
        }, 30000)

        return () => {
          clearInterval(pollInterval)
        }

      } catch (err) {
        console.error('Failed to setup preview:', err)
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview')
          setIsLoading(false)
        }
      }
    }

    setupPreview()

    return () => {
      isCancelled = true
    }
  }, [currentArtifact])

  if (!currentArtifact) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            No website generated yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Enter a prompt above to generate your website
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Starting preview...
          </div>
          <div style={{ fontSize: '14px' }}>
            {statusMessage || 'Initializing...'}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#dc2626'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Preview Error
          </div>
          <div style={{ fontSize: '14px' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      position: 'relative',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '8px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981'
        }}></div>
        Live Preview (WebContainer)
      </div>

      <iframe
        ref={iframeRef}
        src={previewUrl || ''}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          paddingTop: '40px',
          boxSizing: 'border-box'
        }}
        sandbox="allow-scripts allow-same-origin"
        title="Live Preview"
      />
    </div>
  )
}