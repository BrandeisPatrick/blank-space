import { useAppStore } from '../../state/appStore'

export const GridToggle = () => {
  const { gridVisible, toggleGrid } = useAppStore()

  return (
    <button
      onClick={toggleGrid}
      style={{
        padding: '6px 12px',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        backgroundColor: gridVisible ? '#3b82f6' : '#ffffff',
        color: gridVisible ? '#ffffff' : '#374151',
        cursor: 'pointer'
      }}
    >
      Grid {gridVisible ? 'On' : 'Off'}
    </button>
  )
}