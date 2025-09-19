import { useAppStore } from '../../pages/appStore'
import { getDevicePresets } from '../../lib/mockGridEngine'

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
        {devices.map((device) => {
          const cols = device.gridCols ?? 12
          const rows = device.gridRows ?? 12
          return (
            <option key={device.id} value={device.id}>
              {device.name} ({cols}×{rows})
            </option>
          )
        })}
      </select>
    </div>
  )
}
