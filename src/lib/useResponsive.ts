import { useState, useEffect } from 'react'

export interface ResponsiveBreakpoints {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
}

const RESPONSIVE_DESIGN_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const

export function useResponsive(): ResponsiveBreakpoints {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenWidth < RESPONSIVE_DESIGN_BREAKPOINTS.mobile
  const isTablet = screenWidth >= RESPONSIVE_DESIGN_BREAKPOINTS.mobile && screenWidth < RESPONSIVE_DESIGN_BREAKPOINTS.tablet
  const isDesktop = screenWidth >= RESPONSIVE_DESIGN_BREAKPOINTS.tablet

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
  }
}