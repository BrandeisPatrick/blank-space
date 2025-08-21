import { useAppStore } from '../../state/appStore'

interface GenerateButtonProps {
  onGenerate: () => void
}

export const GenerateButton = ({ onGenerate }: GenerateButtonProps) => {
  const { selectedRegion, isGenerating } = useAppStore()

  const isDisabled = !selectedRegion || isGenerating

  return (
    <button
      onClick={onGenerate}
      disabled={isDisabled}
      style={{
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: isDisabled ? '#d1d5db' : '#10b981',
        color: '#ffffff',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontWeight: '500'
      }}
    >
      {isGenerating ? 'Generating...' : 'Generate'}
    </button>
  )
}