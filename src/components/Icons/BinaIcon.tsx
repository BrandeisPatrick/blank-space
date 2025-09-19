import { memo } from 'react'

interface BinaIconProps {
  size?: number
  title?: string
}

export const BinaIcon = memo(({ size = 32, title = 'Bina, your AI assistant' }: BinaIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label={title}
  >
    <defs>
      <radialGradient id="bina_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#89f8ff" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#36d8ff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1a52ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bina_outer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#57617a" />
        <stop offset="45%" stopColor="#22293d" />
        <stop offset="100%" stopColor="#3c4460" />
      </linearGradient>
      <radialGradient id="bina_lens" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stopColor="#1c2d4a" />
        <stop offset="50%" stopColor="#101a2f" />
        <stop offset="100%" stopColor="#050912" />
      </radialGradient>
      <radialGradient id="bina_iris" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#7cfeff" />
        <stop offset="40%" stopColor="#2ec7ff" />
        <stop offset="100%" stopColor="#0c49ff" />
      </radialGradient>
      <radialGradient id="bina_highlight" cx="30%" cy="25%" r="45%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Outer metallic shell */}
    <circle cx="32" cy="32" r="30" fill="url(#bina_outer)" stroke="#101524" strokeWidth="2" />

    {/* Inner bezel */}
    <circle cx="32" cy="32" r="24" fill="#111828" stroke="#2a3758" strokeWidth="2" />

    {/* Glow halo */}
    <circle cx="32" cy="32" r="22" fill="url(#bina_glow)" opacity="0.55" />

    {/* Rotating sensor ring */}
    <g opacity="0.65">
      <circle cx="32" cy="32" r="18" fill="none" stroke="#6fe7ff" strokeWidth="1.8" strokeDasharray="6 8" strokeLinecap="round" />
      <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="14s" repeatCount="indefinite" />
    </g>

    {/* Iris and pupil */}
    <circle cx="32" cy="32" r="14" fill="url(#bina_iris)" />
    <circle cx="32" cy="32" r="8.5" fill="url(#bina_lens)" />
    <circle cx="32" cy="32" r="4.5" fill="#0ff9ff" opacity="0.85" />

    {/* Data arcs */}
    <g stroke="#7af3ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.55">
      <path d="M18 26c4-7 12-12 20-12" fill="none" />
      <path d="M46 40c-3 6-9 10-15 11" fill="none" />
      <path d="M20 42c2 3 6 6 9 7" fill="none" />
    </g>

    {/* Highlights */}
    <circle cx="26" cy="24" r="6.5" fill="url(#bina_highlight)" />
    <circle cx="39" cy="42" r="3" fill="#5bf4ff" opacity="0.35" />

    {/* Micro detail */}
    <circle cx="32" cy="32" r="12.5" fill="none" stroke="#20355a" strokeWidth="1.4" strokeDasharray="2 4" opacity="0.5" />
  </svg>
))

BinaIcon.displayName = 'BinaIcon'
