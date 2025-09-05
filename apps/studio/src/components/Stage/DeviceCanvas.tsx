import { useRef, useEffect } from 'react'
// Mock functions since we don't have grid-engine package  
const getDevicePreset = (id: string) => ({ id, name: id, width: 1200, height: 800 })
const GridEngine = { 
  render: () => null,
  calculateGridMetrics: () => ({ cellSize: 20, gutter: 2 }),
  getRegionBounds: () => ({ x: 0, y: 0, width: 100, height: 100 })
}
import { useAppStore } from '../../state/appStore'
import { GridRegion } from '../../types'

interface DeviceCanvasProps {
  onRegionSelect: (region: GridRegion | null) => void
}

export const DeviceCanvas = ({ onRegionSelect }: DeviceCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  
  const { deviceId, gridVisible, selectedRegion } = useAppStore()
  
  const device = getDevicePreset(deviceId)
  const gridEngine = device ? new GridEngine(device) : null

  useEffect(() => {
    if (!canvasRef.current || !gridEngine) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = gridEngine.getDevice()
    const { cellWidth, cellHeight } = gridEngine.getMetrics()

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    if (gridVisible) {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1

      for (let x = 0; x <= width; x += cellWidth) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let y = 0; y <= height; y += cellHeight) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    if (selectedRegion) {
      const bounds = gridEngine.getRegionBounds(selectedRegion)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top)
      ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top)
    }
  }, [gridEngine, gridVisible, selectedRegion])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridEngine) return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridPos = gridEngine.snapToGrid(x, y)
    
    isDragging.current = true
    dragStart.current = gridPos
    
    onRegionSelect({
      start: gridPos,
      end: gridPos
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !dragStart.current || !gridEngine) return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridPos = gridEngine.snapToGrid(x, y)
    
    onRegionSelect({
      start: dragStart.current,
      end: gridPos
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
    dragStart.current = null
  }

  if (!device) {
    return <div>Device not found</div>
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'crosshair'
        }}
      />
    </div>
  )
}