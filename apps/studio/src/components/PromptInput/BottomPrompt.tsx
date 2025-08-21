import { useState } from 'react'
import { useAppStore } from '../../state/appStore'

interface BottomPromptProps {
  onGenerate: () => void
}

export const BottomPrompt = ({ onGenerate }: BottomPromptProps) => {
  const { prompt, setPrompt, isGenerating } = useAppStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{
      backgroundColor: '#2d2d2d',
      borderTop: '1px solid #3e3e3e',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '8px'
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#1e1e1e',
          border: '1px solid #3e3e3e',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <textarea
            value={prompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={isExpanded ? 5 : 1}
            placeholder="Make changes, add new features, ask for anything"
            style={{
              width: '100%',
              height: '100%',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '14px',
              lineHeight: '20px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onFocus={(e) => {
              e.target.parentElement!.style.borderColor = '#007acc'
            }}
            onBlur={(e) => {
              e.target.parentElement!.style.borderColor = '#3e3e3e'
            }}
          />
          
          <button
            onClick={toggleExpanded}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: '#888888',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#383838'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {isExpanded ? '⌄' : '⌃'}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          style={{
            padding: '12px 20px',
            backgroundColor: (!prompt.trim() || isGenerating) ? '#383838' : '#007acc',
            color: (!prompt.trim() || isGenerating) ? '#888888' : '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (!prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            minWidth: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isGenerating ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #888888',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            '▶'
          )}
        </button>
      </div>

      {/* Tips */}
      <div style={{
        fontSize: '12px',
        color: '#888888',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Press ⌘+Enter to send</span>
        <span>{prompt.length}/2000</span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}