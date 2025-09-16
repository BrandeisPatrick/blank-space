// Mock function since we don't have grid-engine package
const getDevicePresets = () => [
  { id: 'desktop', name: 'Desktop', width: 1200, height: 800 },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024 },
  { id: 'mobile', name: 'Mobile', width: 375, height: 667 }
]
import { useAppStore } from '../../pages/appStore'

export const DeviceSelector = () => {
  const { deviceId, setDevice } = useAppStore()
  const devices = getDevicePresets()

  return (
    <div className="device-selector">
      <label htmlFor="device-select">Device:</label>
      <select
        id="device-select"
        value={deviceId}
        onChange={(e) => setDevice(e.target.value)}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d1d5db'
        }}
      >
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name} ({device.gridCols}×{device.gridRows})
          </option>
        ))}
      </select>
    </div>
  )
}