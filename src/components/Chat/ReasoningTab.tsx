import { useState, useEffect } from 'react'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'
import { ReasoningStep } from '../../types'

interface ReasoningTabProps {
  steps: ReasoningStep[]
  isVisible?: boolean
  autoCollapse?: boolean
}

type TabType = 'summary' | 'thinking' | 'actions'

export const ReasoningTab = ({ steps, isVisible = true, autoCollapse = true }: ReasoningTabProps) => {
  const [isExpanded, setIsExpanded] = useState(!autoCollapse)
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  const { mode } = useTheme()
  const theme = getTheme(mode)

  // Auto-collapse after a delay when response completes
  useEffect(() => {
    if (autoCollapse && steps.some(step => step.type === 'final_answer')) {
      const timer = setTimeout(() => setIsExpanded(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [steps, autoCollapse])

  if (!isVisible || !steps.length) return null

  const thoughts = steps.filter(step => step.type === 'thought')
  const actions = steps.filter(step => step.type === 'action')
  const observations = steps.filter(step => step.type === 'observation')
  const finalAnswer = steps.find(step => step.type === 'final_answer')

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thought': return '🤔'
      case 'action': return '⚡'
      case 'observation': return '👀'
      case 'final_answer': return '✅'
      default: return '•'
    }
  }

  const getStepColor = (type: string) => {
    switch (type) {
      case 'thought': return theme.colors.accent.secondary
      case 'action': return theme.colors.status.warning
      case 'observation': return theme.colors.status.info
      case 'final_answer': return theme.colors.status.success
      default: return theme.colors.text.tertiary
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const renderSummaryTab = () => (
    <div style={{ padding: `${theme.spacing.md} 0` }}>
      <div style={{
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing.md,
      }}>
        <strong>Reasoning Summary:</strong> {thoughts.length} thoughts, {actions.length} actions, {observations.length} observations
      </div>
      
      {finalAnswer && (
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.bg.tertiary,
          borderRadius: theme.radius.md,
          borderLeft: `4px solid ${theme.colors.status.success}`,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.status.success,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            ✅ Final Answer
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeight.normal,
          }}>
            {finalAnswer.content}
          </div>
        </div>
      )}
    </div>
  )

  const renderStepsList = (stepsList: ReasoningStep[], title: string) => (
    <div>
      <div style={{
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
      }}>
        {title} ({stepsList.length})
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {stepsList.map((step, index) => (
          <div
            key={step.id || index}
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.bg.tertiary,
              borderRadius: theme.radius.md,
              borderLeft: `3px solid ${getStepColor(step.type)}`,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.sm,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                fontSize: theme.typography.fontSize.xs,
                color: getStepColor(step.type),
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                <span>{getStepIcon(step.type)}</span>
                <span style={{ textTransform: 'capitalize' }}>{step.type.replace('_', ' ')}</span>
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                {formatTimestamp(step.timestamp)}
              </div>
            </div>
            
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeight.relaxed,
              whiteSpace: 'pre-wrap',
            }}>
              {step.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.bg.secondary,
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.bg.tertiary
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <div style={{
            fontSize: '12px',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: theme.colors.text.tertiary,
          }}>
            ▶
          </div>
          <div style={{
            fontSize: '14px',
            marginRight: theme.spacing.sm,
          }}>
            🧠
          </div>
          <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
            AI Reasoning
          </span>
        </div>

        <div style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <span>{steps.length} steps</span>
          {finalAnswer && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.status.success,
            }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div>
          {/* Tab Navigation */}
          <div style={{
            borderTop: `1px solid ${theme.colors.border}`,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            backgroundColor: theme.colors.bg.primary,
          }}>
            {[
              { key: 'summary' as TabType, label: 'Summary', count: null },
              { key: 'thinking' as TabType, label: 'Thinking', count: thoughts.length },
              { key: 'actions' as TabType, label: 'Actions', count: actions.length + observations.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: activeTab === tab.key ? theme.colors.bg.tertiary : 'transparent',
                  border: 'none',
                  color: activeTab === tab.key ? theme.colors.text.primary : theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                {tab.label}
                {tab.count !== null && (
                  <span style={{
                    padding: `2px 6px`,
                    backgroundColor: theme.colors.bg.hover,
                    borderRadius: theme.radius.sm,
                    fontSize: '10px',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.bg.primary,
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            {activeTab === 'summary' && renderSummaryTab()}
            {activeTab === 'thinking' && renderStepsList(thoughts, 'Thoughts')}
            {activeTab === 'actions' && renderStepsList([...actions, ...observations], 'Actions & Observations')}
          </div>
        </div>
      )}
    </div>
  )
}