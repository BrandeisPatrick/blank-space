import { useState } from 'react'
import { useAppStore } from '../../pages/appStore'
import { ResponseModeToggle } from '../ResponseModeToggle/ResponseModeToggle'
import '../ResponseModeToggle/ResponseModeToggle.css'

interface PromptInputProps {
  onGenerate: () => void
}

export const PromptInput = ({ onGenerate }: PromptInputProps) => {
  const { prompt, setPrompt, isGenerating, responseMode, setResponseMode } = useAppStore()
  const [rows, setRows] = useState(3)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    
    // Auto-resize textarea
    const minRows = 3
    const maxRows = 10
    const newRows = Math.max(minRows, Math.min(maxRows, e.target.value.split('\n').length))
    setRows(newRows)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (prompt.trim() && !isGenerating) {
        onGenerate()
      }
    }
  }

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onGenerate()
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div style={{
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '8px'
        }}>
          Generate Website
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Describe the website you want to create. Be specific about design, functionality, and content.
        </p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <ResponseModeToggle
          currentMode={responseMode}
          onModeChange={setResponseMode}
        />
      </div>
      
      <div style={{
        position: 'relative',
        marginBottom: '16px'
      }}>
        <textarea
          value={prompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder="Create a modern landing page for a SaaS product with a hero section, features grid, testimonials, and pricing table. Use a blue and white color scheme..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            lineHeight: '24px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          {prompt.length}/2000
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Press Cmd+Enter to generate
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          style={{
            padding: '12px 24px',
            backgroundColor: (!prompt.trim() || isGenerating) ? '#e5e7eb' : '#3b82f6',
            color: (!prompt.trim() || isGenerating) ? '#9ca3af' : '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: (!prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            minWidth: '120px'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  )
}