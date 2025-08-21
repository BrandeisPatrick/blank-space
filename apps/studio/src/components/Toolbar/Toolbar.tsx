import { DeviceSelector } from './DeviceSelector'
import { GridToggle } from './GridToggle'
import { RegionInspector } from './RegionInspector'
import { GenerateButton } from './GenerateButton'

interface ToolbarProps {
  onGenerate: () => void
}

export const Toolbar = ({ onGenerate }: ToolbarProps) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff'
    }}>
      <DeviceSelector />
      <GridToggle />
      <RegionInspector />
      <div style={{ marginLeft: 'auto' }}>
        <GenerateButton onGenerate={onGenerate} />
      </div>
    </div>
  )
}