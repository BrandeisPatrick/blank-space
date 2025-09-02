import { useAppStore } from '../../state/appStore'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface GenerateButtonProps {
  onGenerate: () => void
}

export const GenerateButton = ({ onGenerate }: GenerateButtonProps) => {
  const { selectedRegion, isGenerating } = useAppStore()
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const isDisabled = !selectedRegion || isGenerating

  return (
    <button
      onClick={onGenerate}
      disabled={isDisabled}
      style={{
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        borderRadius: theme.radius.lg,
        border: 'none',
        background: isDisabled 
          ? theme.colors.bg.tertiary 
          : '#333333',
        color: '#ffffff',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: theme.typography.fontSize.base,
        height: '48px',
        minWidth: '120px',
        boxShadow: isDisabled ? theme.shadows.md : theme.shadows.outset,
        transition: `all ${theme.animation.normal}`,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = theme.shadows.glow
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = theme.shadows.outset
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {isGenerating ? 'Generating...' : 'Generate'}
    </button>
  )
}