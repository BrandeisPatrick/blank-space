/**
 * SVG Icon Components
 * Clean, scalable icons to replace emoji in the UI
 */

export const LightningIcon = ({ size = 48, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const DocumentIcon = ({ size = 48, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GlobeIcon = ({ size = 64, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EditIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CopyIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      ry="2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TrashIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BinaIcon = ({ size = 32, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label="Bina, your AI assistant"
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
      <circle cx="32" cy="32" r="18" fill="none" stroke="#6fe7ff" strokeWidth="1.8" strokeDasharray="6 8" strokeLinecap="round">
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 32 32"
            to="360 32 32"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </circle>
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
);
