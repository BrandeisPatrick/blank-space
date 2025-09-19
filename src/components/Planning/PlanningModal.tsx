import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'
import { ProjectPlan } from '../../lib/featurePlanningService'

interface PlanningModalProps {
  isOpen: boolean
  projectPlan: ProjectPlan
  onApprove: () => void
  onReject: () => void
}

export function PlanningModal({
  isOpen,
  projectPlan,
  onApprove,
  onReject
}: PlanningModalProps) {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!isOpen) return null

  const coreFeatures = projectPlan.features.filter(f => f.category === 'core')
  const uiFeatures = projectPlan.features.filter(f => f.category === 'ui-ux')
  const dataFeatures = projectPlan.features.filter(f => f.category === 'data')
  const userFeatures = projectPlan.features.filter(f => f.category === 'user-management')

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: theme.spacing.md
      }}
      onClick={onReject}
    >
      <div
        style={{
          backgroundColor: theme.colors.bg.primary,
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bg.secondary
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs
            }}
          >
            📋 Project Plan Review
          </h2>
          <p
            style={{
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: '14px'
            }}
          >
            Review the planned features and tech stack before I start building
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            padding: theme.spacing.lg,
            overflow: 'auto',
            flex: 1
          }}
        >
          {/* App Info */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm
              }}
            >
              {projectPlan.name}
            </h3>
            <p
              style={{
                margin: 0,
                color: theme.colors.text.secondary,
                fontSize: '14px',
                marginBottom: theme.spacing.sm
              }}
            >
              {projectPlan.description}
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.sm, fontSize: '12px' }}>
              <span
                style={{
                  backgroundColor: theme.colors.accent.primary + '20',
                  color: theme.colors.accent.primary,
                  padding: '4px 8px',
                  borderRadius: theme.radius.sm,
                  textTransform: 'capitalize'
                }}
              >
                {projectPlan.analysis.appType}
              </span>
              <span
                style={{
                  backgroundColor: theme.colors.border,
                  color: theme.colors.text.secondary,
                  padding: '4px 8px',
                  borderRadius: theme.radius.sm
                }}
              >
                {projectPlan.features.length} features
              </span>
            </div>
          </div>

          {/* Features by Category */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm
              }}
            >
              Essential V1 Features
            </h4>

            {coreFeatures.length > 0 && (
              <div style={{ marginBottom: theme.spacing.md }}>
                <h5
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Core Features
                </h5>
                {coreFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    style={{
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.bg.secondary,
                      borderRadius: theme.radius.sm,
                      marginBottom: theme.spacing.xs,
                      border: feature.priority === 'high' ? `2px solid ${theme.colors.accent.primary}40` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: theme.colors.text.primary
                        }}
                      >
                        {feature.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: theme.radius.sm,
                          backgroundColor: feature.priority === 'high' ? theme.colors.accent.primary + '20' : theme.colors.border,
                          color: feature.priority === 'high' ? theme.colors.accent.primary : theme.colors.text.secondary,
                          textTransform: 'uppercase'
                        }}
                      >
                        {feature.priority}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        lineHeight: 1.4
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(uiFeatures.length > 0 || dataFeatures.length > 0 || userFeatures.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.sm }}>
                {uiFeatures.length > 0 && (
                  <div>
                    <h6 style={{ margin: 0, fontSize: '10px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                      UI/UX ({uiFeatures.length})
                    </h6>
                    {uiFeatures.slice(0, 3).map(f => (
                      <div key={f.id} style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '2px' }}>
                        • {f.name}
                      </div>
                    ))}
                  </div>
                )}
                {dataFeatures.length > 0 && (
                  <div>
                    <h6 style={{ margin: 0, fontSize: '10px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Data ({dataFeatures.length})
                    </h6>
                    {dataFeatures.slice(0, 3).map(f => (
                      <div key={f.id} style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '2px' }}>
                        • {f.name}
                      </div>
                    ))}
                  </div>
                )}
                {userFeatures.length > 0 && (
                  <div>
                    <h6 style={{ margin: 0, fontSize: '10px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                      User Mgmt ({userFeatures.length})
                    </h6>
                    {userFeatures.slice(0, 3).map(f => (
                      <div key={f.id} style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '2px' }}>
                        • {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm
              }}
            >
              Modern Tech Stack
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: theme.spacing.sm }}>
              <div>
                <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Frontend
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.text.primary }}>
                  {projectPlan.techStack.frontend.join(', ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Styling
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.text.primary }}>
                  {projectPlan.techStack.styling.join(', ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginBottom: '4px', textTransform: 'uppercase' }}>
                  State
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.text.primary }}>
                  {projectPlan.techStack.stateManagement.join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm
              }}
            >
              Development Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              {projectPlan.timeline.slice(0, 3).map((phase, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.bg.secondary,
                    borderRadius: theme.radius.sm,
                    fontSize: '12px'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: theme.colors.accent.primary,
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      marginRight: theme.spacing.sm,
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: theme.colors.text.primary }}>
                      {phase.phase}
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '11px' }}>
                      {phase.features.slice(0, 2).join(', ')} • {phase.estimatedDays} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bg.secondary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}
        >
          <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
            This plan will be saved as plan.md in your project
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={onReject}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                backgroundColor: 'transparent',
                color: theme.colors.text.secondary,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bg.primary
                e.currentTarget.style.color = theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.colors.text.secondary
              }}
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: 'none',
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.accent.primary,
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Build with this plan ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
