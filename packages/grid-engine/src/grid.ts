import { DevicePreset, GridPosition, GridRegion, GridBounds, GridMetrics, RegionMetrics } from './types'

export class GridEngine {
  private device: DevicePreset
  private metrics: GridMetrics

  constructor(device: DevicePreset) {
    this.device = device
    this.metrics = this.calculateMetrics()
  }

  private calculateMetrics(): GridMetrics {
    return {
      cellWidth: this.device.width / this.device.gridCols,
      cellHeight: this.device.height / this.device.gridRows,
      totalWidth: this.device.width,
      totalHeight: this.device.height
    }
  }

  getMetrics(): GridMetrics {
    return { ...this.metrics }
  }

  getDevice(): DevicePreset {
    return { ...this.device }
  }

  snapToGrid(x: number, y: number): GridPosition {
    const col = Math.round(x / this.metrics.cellWidth)
    const row = Math.round(y / this.metrics.cellHeight)
    
    return {
      x: Math.max(0, Math.min(col, this.device.gridCols - 1)),
      y: Math.max(0, Math.min(row, this.device.gridRows - 1))
    }
  }

  gridToPixel(position: GridPosition): { x: number; y: number } {
    return {
      x: position.x * this.metrics.cellWidth,
      y: position.y * this.metrics.cellHeight
    }
  }

  pixelToGrid(x: number, y: number): GridPosition {
    return {
      x: Math.floor(x / this.metrics.cellWidth),
      y: Math.floor(y / this.metrics.cellHeight)
    }
  }

  normalizeRegion(region: GridRegion): GridRegion {
    return {
      start: {
        x: Math.min(region.start.x, region.end.x),
        y: Math.min(region.start.y, region.end.y)
      },
      end: {
        x: Math.max(region.start.x, region.end.x),
        y: Math.max(region.start.y, region.end.y)
      }
    }
  }

  getRegionBounds(region: GridRegion): GridBounds {
    const normalized = this.normalizeRegion(region)
    const startPixel = this.gridToPixel(normalized.start)
    const endPixel = this.gridToPixel({
      x: normalized.end.x + 1,
      y: normalized.end.y + 1
    })

    return {
      left: startPixel.x,
      top: startPixel.y,
      right: endPixel.x,
      bottom: endPixel.y
    }
  }

  getRegionMetrics(region: GridRegion): RegionMetrics {
    const normalized = this.normalizeRegion(region)
    const bounds = this.getRegionBounds(region)
    
    const cols = normalized.end.x - normalized.start.x + 1
    const rows = normalized.end.y - normalized.start.y + 1

    return {
      cols,
      rows,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      area: cols * rows
    }
  }

  isValidRegion(region: GridRegion): boolean {
    const { start, end } = region
    
    return (
      start.x >= 0 && start.x < this.device.gridCols &&
      start.y >= 0 && start.y < this.device.gridRows &&
      end.x >= 0 && end.x < this.device.gridCols &&
      end.y >= 0 && end.y < this.device.gridRows
    )
  }

  clampRegion(region: GridRegion): GridRegion {
    return {
      start: {
        x: Math.max(0, Math.min(region.start.x, this.device.gridCols - 1)),
        y: Math.max(0, Math.min(region.start.y, this.device.gridRows - 1))
      },
      end: {
        x: Math.max(0, Math.min(region.end.x, this.device.gridCols - 1)),
        y: Math.max(0, Math.min(region.end.y, this.device.gridRows - 1))
      }
    }
  }
}