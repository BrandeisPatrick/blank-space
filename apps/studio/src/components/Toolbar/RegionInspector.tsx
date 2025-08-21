import { GridEngine, getDevicePreset } from '@ui-grid-ai/grid-engine'
import { useAppStore } from '../../state/appStore'

export const RegionInspector = () => {
  const { deviceId, selectedRegion } = useAppStore()
  const device = getDevicePreset(deviceId)
  
  if (!selectedRegion || !device) {
    return (
      <div style={{ color: '#6b7280', fontSize: '14px' }}>
        No region selected
      </div>
    )
  }

  const gridEngine = new GridEngine(device)
  const metrics = gridEngine.getRegionMetrics(selectedRegion)
  
  return (
    <div style={{ fontSize: '14px', color: '#374151' }}>
      <span>
        {metrics.cols} × {metrics.rows} cells ({metrics.area} total)
      </span>
    </div>
  )
}