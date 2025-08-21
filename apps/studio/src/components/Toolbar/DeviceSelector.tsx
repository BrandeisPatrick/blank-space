import { getDevicePresets } from '@ui-grid-ai/grid-engine'
import { useAppStore } from '../../state/appStore'

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