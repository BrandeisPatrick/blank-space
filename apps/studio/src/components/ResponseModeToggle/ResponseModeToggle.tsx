import React from 'react'
import { ResponseMode, RESPONSE_MODES } from '../../types'

interface ResponseModeToggleProps {
  currentMode: ResponseMode
  onModeChange: (mode: ResponseMode) => void
  className?: string
}

export const ResponseModeToggle: React.FC<ResponseModeToggleProps> = ({
  currentMode,
  onModeChange,
  className = ''
}) => {
  const modes = Object.values(RESPONSE_MODES)

  return (
    <div className={`response-mode-toggle ${className}`}>
      <div className="mode-selector">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
            title={mode.description}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mode-description">
        <span className="description-text">
          {RESPONSE_MODES[currentMode].description}
        </span>
      </div>
    </div>
  )
}

export default ResponseModeToggle