import { useAppStore } from '../../pages/appStore'

export const GridModeToggle = () => {
  const { gridModeEnabled, setGridMode } = useAppStore()

  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#374151'
      }}>
        <input
          type="checkbox"
          checked={gridModeEnabled}
          onChange={(e) => setGridMode(e.target.checked)}
          style={{
            width: '16px',
            height: '16px'
          }}
        />
        <span>Enable Grid Mode (Advanced)</span>
      </label>
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '4px',
        marginLeft: '24px'
      }}>
        Select specific regions on a grid for component-level editing
      </div>
    </div>
  )
}