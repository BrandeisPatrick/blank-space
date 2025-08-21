export interface DevicePreset {
  id: string
  name: string
  width: number
  height: number
  gridCols: number
  gridRows: number
  pixelRatio?: number
}

export interface GridPosition {
  x: number
  y: number
}

export interface GridRegion {
  start: GridPosition
  end: GridPosition
}

export interface GridBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface GridMetrics {
  cellWidth: number
  cellHeight: number
  totalWidth: number
  totalHeight: number
}

export interface RegionMetrics {
  cols: number
  rows: number
  width: number
  height: number
  area: number
}