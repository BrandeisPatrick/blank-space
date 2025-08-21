import { DevicePreset } from './types'

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  iphone_14: {
    id: 'iphone_14',
    name: 'iPhone 14',
    width: 390,
    height: 844,
    gridCols: 12,
    gridRows: 20,
    pixelRatio: 3
  },
  iphone_14_pro: {
    id: 'iphone_14_pro',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    gridCols: 12,
    gridRows: 20,
    pixelRatio: 3
  },
  ipad_mini: {
    id: 'ipad_mini',
    name: 'iPad Mini',
    width: 744,
    height: 1133,
    gridCols: 16,
    gridRows: 24,
    pixelRatio: 2
  },
  macbook_air: {
    id: 'macbook_air',
    name: 'MacBook Air',
    width: 1280,
    height: 832,
    gridCols: 24,
    gridRows: 20,
    pixelRatio: 2
  },
  desktop_1080p: {
    id: 'desktop_1080p',
    name: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    gridCols: 24,
    gridRows: 20,
    pixelRatio: 1
  }
}

export const getDevicePreset = (id: string): DevicePreset | undefined => {
  return DEVICE_PRESETS[id]
}

export const getDevicePresets = (): DevicePreset[] => {
  return Object.values(DEVICE_PRESETS)
}