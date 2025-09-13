import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { useAppStore } from '../../state/appStore'

interface DashboardProps {
  onCreateNew: () => void
  onOpenArtifact: (artifactId: string) => void
  onSignOut: () => void
}

export const Dashboard = ({ onCreateNew, onOpenArtifact, onSignOut }: DashboardProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const { artifacts } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredArtifacts = artifacts.filter(artifact =>
    artifact.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: theme.colors.bg.primary,
      backgroundImage: theme.colors.gradient.subtle,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      {/* Header */}
      <header style={{
        padding: `${theme.spacing.xl} ${theme.spacing['3xl']}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: theme.colors.bg.secondary,
        boxShadow: theme.shadows.outset,
        borderBottom: `1px solid ${theme.colors.bg.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <h1 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{ 
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
          </h1>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <button
            onClick={onCreateNew}
            style={{
              background: theme.colors.accent.primary,
              border: 'none',
              color: mode === 'dark' ? theme.colors.text.primary : theme.colors.bg.primary,
              cursor: 'pointer',
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.bold,
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              boxShadow: theme.shadows.outset,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.glow
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.outset
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            + New Project
          </button>
          
          <button
            onClick={onSignOut}
            style={{
              background: theme.colors.bg.tertiary,
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              transition: `all ${theme.animation.normal}`,
              boxShadow: theme.shadows.outset,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.color = theme.colors.text.primary
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.bg.tertiary
              e.currentTarget.style.color = theme.colors.text.secondary
              e.currentTarget.style.boxShadow = theme.shadows.outset
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: theme.spacing['3xl'],
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Welcome Section */}
        <div style={{
          marginBottom: theme.spacing['3xl'],
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: `0 0 ${theme.spacing.md} 0`,
          }}>
            Welcome back! 👋
          </h2>
          <p style={{
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.text.secondary,
            margin: 0,
          }}>
            Continue working on your projects or start something new
          </p>
        </div>

        {/* Search and Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          flexWrap: 'wrap',
          gap: theme.spacing.lg,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
          }}>
            <input
              type="search"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.bg.secondary,
                border: 'none',
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadows.sm,
                fontFamily: theme.typography.fontFamily.sans,
                outline: 'none',
                transition: `box-shadow ${theme.animation.normal}`,
                minWidth: '300px',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = theme.shadows.glow
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = theme.shadows.sm
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: theme.spacing.xl,
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.fontSize.sm,
          }}>
            <span>{artifacts.length} projects</span>
            <span>{artifacts.filter(a => Date.now() - new Date(a.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length} this week</span>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredArtifacts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            background: theme.colors.bg.secondary,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.outset,
          }}>
            {artifacts.length === 0 ? (
              <>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: theme.spacing.xl,
                }}>🚀</div>
                <h3 style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  margin: `0 0 ${theme.spacing.md} 0`,
                }}>
                  Ready to create something amazing?
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                  margin: `0 0 ${theme.spacing.xl} 0`,
                  maxWidth: '400px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  lineHeight: theme.typography.lineHeight.normal,
                }}>
                  Start your first project by describing what you want to build. Our AI will bring your vision to life in seconds.
                </p>
                <button
                  onClick={onCreateNew}
                  style={{
                    background: theme.colors.accent.primary,
                    border: 'none',
                    color: mode === 'dark' ? theme.colors.text.primary : theme.colors.bg.primary,
                    cursor: 'pointer',
                    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
                    borderRadius: theme.radius.lg,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                    fontFamily: theme.typography.fontFamily.sans,
                    transition: `all ${theme.animation.normal}`,
                    boxShadow: theme.shadows.outsetMd,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.glow
                    e.currentTarget.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.outsetMd
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Create Your First Project
                </button>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: theme.spacing.lg,
                }}>🔍</div>
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  margin: `0 0 ${theme.spacing.sm} 0`,
                }}>
                  No projects found
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                  margin: 0,
                }}>
                  Try adjusting your search term
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: theme.spacing.xl,
          }}>
            {filteredArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                style={{
                  background: theme.colors.bg.secondary,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xl,
                  boxShadow: theme.shadows.outset,
                  cursor: 'pointer',
                  transition: `all ${theme.animation.normal}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = theme.shadows.glow
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = theme.shadows.outset
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => onOpenArtifact(artifact.id)}
              >
                {/* Project Preview */}
                <div style={{
                  height: '160px',
                  background: theme.colors.bg.primary,
                  borderRadius: theme.radius.md,
                  marginBottom: theme.spacing.lg,
                  boxShadow: theme.shadows.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    fontSize: '2rem',
                    opacity: 0.5,
                  }}>🌐</div>
                  <div style={{
                    position: 'absolute',
                    bottom: theme.spacing.sm,
                    right: theme.spacing.sm,
                    background: theme.colors.accent.primary,
                    color: mode === 'dark' ? theme.colors.text.primary : theme.colors.bg.primary,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.bold,
                  }}>
                    {Object.keys(artifact.files).length} files
                  </div>
                </div>

                {/* Project Info */}
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  margin: `0 0 ${theme.spacing.sm} 0`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {`Project ${artifact.id.slice(-8)}`}
                </h3>
                
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  margin: `0 0 ${theme.spacing.md} 0`,
                  lineHeight: theme.typography.lineHeight.normal,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {'Created ' + new Date(artifact.createdAt).toLocaleDateString()}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                }}>
                  <span>Created {formatDate(new Date(artifact.createdAt).getTime())}</span>
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                  }}>
                    {artifact.files['index.html'] && <span title="HTML">🌐</span>}
                    {artifact.files['styles.css'] && <span title="CSS">🎨</span>}
                    {artifact.files['script.js'] && <span title="JavaScript">⚙️</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}