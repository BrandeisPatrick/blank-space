import { describe, it, expect, beforeEach } from 'vitest'
import { GridEngine } from './grid'
import { DEVICE_PRESETS } from './presets'

describe('GridEngine', () => {
  let gridEngine: GridEngine

  beforeEach(() => {
    gridEngine = new GridEngine(DEVICE_PRESETS.iphone_14)
  })

  describe('snapToGrid', () => {
    it('should snap coordinates to the nearest grid cell', () => {
      const result = gridEngine.snapToGrid(50, 100)
      expect(result).toEqual({ x: 2, y: 2 })
    })

    it('should clamp coordinates to grid bounds', () => {
      const result = gridEngine.snapToGrid(-10, 2000)
      expect(result.x).toBe(0)
      expect(result.y).toBe(19)
    })
  })

  describe('normalizeRegion', () => {
    it('should normalize region with swapped coordinates', () => {
      const region = {
        start: { x: 5, y: 5 },
        end: { x: 2, y: 2 }
      }
      const normalized = gridEngine.normalizeRegion(region)
      expect(normalized).toEqual({
        start: { x: 2, y: 2 },
        end: { x: 5, y: 5 }
      })
    })
  })

  describe('getRegionMetrics', () => {
    it('should calculate correct region metrics', () => {
      const region = {
        start: { x: 1, y: 1 },
        end: { x: 3, y: 2 }
      }
      const metrics = gridEngine.getRegionMetrics(region)
      expect(metrics.cols).toBe(3)
      expect(metrics.rows).toBe(2)
      expect(metrics.area).toBe(6)
    })
  })

  describe('isValidRegion', () => {
    it('should return true for valid region', () => {
      const region = {
        start: { x: 0, y: 0 },
        end: { x: 5, y: 5 }
      }
      expect(gridEngine.isValidRegion(region)).toBe(true)
    })

    it('should return false for region outside bounds', () => {
      const region = {
        start: { x: -1, y: 0 },
        end: { x: 5, y: 5 }
      }
      expect(gridEngine.isValidRegion(region)).toBe(false)
    })
  })
})