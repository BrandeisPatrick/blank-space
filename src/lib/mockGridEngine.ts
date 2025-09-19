import { DevicePreset, GridRegion } from '../types'

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, gridCols: 12, gridRows: 12 },
  { id: 'tablet', name: 'Tablet', width: 1024, height: 1366, gridCols: 8, gridRows: 12 },
  { id: 'mobile', name: 'Mobile', width: 390, height: 844, gridCols: 4, gridRows: 12 }
]

export function getDevicePresets(): DevicePreset[] {
  return DEVICE_PRESETS
}

export function getDevicePreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find(device => device.id === id) ?? DEVICE_PRESETS[0]
}

export class MockGridEngine {
  private readonly device: DevicePreset
  private readonly cols: number
  private readonly rows: number
  private readonly cellWidth: number
  private readonly cellHeight: number

  constructor(device: DevicePreset) {
    this.device = device
    this.cols = device.gridCols ?? 12
    this.rows = device.gridRows ?? 12
    this.cellWidth = device.width / this.cols
    this.cellHeight = device.height / this.rows
  }

  getDevice() {
    return { width: this.device.width, height: this.device.height }
  }

  getMetrics() {
    return { cellWidth: this.cellWidth, cellHeight: this.cellHeight }
  }

  snapToGrid(x: number, y: number) {
    const column = Math.min(this.cols - 1, Math.max(0, Math.round(x / this.cellWidth)))
    const row = Math.min(this.rows - 1, Math.max(0, Math.round(y / this.cellHeight)))
    return { x: column, y: row }
  }

  getRegionBounds(region: GridRegion) {
    const startColumn = Math.min(region.start.x, region.end.x)
    const endColumn = Math.max(region.start.x, region.end.x)
    const startRow = Math.min(region.start.y, region.end.y)
    const endRow = Math.max(region.start.y, region.end.y)

    return {
      left: startColumn * this.cellWidth,
      top: startRow * this.cellHeight,
      right: (endColumn + 1) * this.cellWidth,
      bottom: (endRow + 1) * this.cellHeight
    }
  }

  getRegionMetrics(region: GridRegion) {
    const cols = Math.abs(region.end.x - region.start.x) + 1
    const rows = Math.abs(region.end.y - region.start.y) + 1

    return {
      cols,
      rows,
      area: cols * rows,
      width: cols * this.cellWidth,
      height: rows * this.cellHeight
    }
  }
}
