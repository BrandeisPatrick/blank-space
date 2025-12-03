/**
 * StarryBackground component
 * Renders colorful stars and sparkles on a dark background
 * Accepts starColors prop to customize the color palette
 */

const DEFAULT_COLORS = ['#A78BFA', '#4ADE80', '#60A5FA', '#F9A8D4', '#FBBF24', '#67E8F9', '#FCD34D'];

export const StarryBackground = ({ starColors = DEFAULT_COLORS }) => {
  // Helper to get color from palette cyclically
  const getColor = (index) => starColors[index % starColors.length];

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 4-point stars - perfect cross star shape */}
      {/* Stars group 1 */}
      <path d="M12,20 L12.08,20.92 L13,21 L12.08,21.08 L12,22 L11.92,21.08 L11,21 L11.92,20.92 Z" fill={getColor(0)} />
      <path d="M25,64 L25.1,65.1 L26.2,65.2 L25.1,65.3 L25,66.4 L24.9,65.3 L23.8,65.2 L24.9,65.1 Z" fill={getColor(0)} />
      <path d="M78,17 L78.08,17.92 L79,18 L78.08,18.08 L78,19 L77.92,18.08 L77,18 L77.92,17.92 Z" fill={getColor(0)} />

      {/* Stars group 2 */}
      <path d="M55,29 L55.1,30.1 L56.2,30.2 L55.1,30.3 L55,31.4 L54.9,30.3 L53.8,30.2 L54.9,30.1 Z" fill={getColor(1)} />
      <path d="M18,74 L18.08,74.92 L19,75 L18.08,75.08 L18,76 L17.92,75.08 L17,75 L17.92,74.92 Z" fill={getColor(1)} />
      <path d="M67,41 L67.06,41.7 L67.8,41.8 L67.06,41.9 L67,42.6 L66.94,41.9 L66.2,41.8 L66.94,41.7 Z" fill={getColor(1)} />

      {/* Stars group 3 */}
      <path d="M75,49 L75.08,49.92 L76,50 L75.08,50.08 L75,51 L74.92,50.08 L74,50 L74.92,49.92 Z" fill={getColor(2)} />
      <path d="M35,11 L35.06,11.7 L35.8,11.8 L35.06,11.9 L35,12.6 L34.94,11.9 L34.2,11.8 L34.94,11.7 Z" fill={getColor(2)} />
      <path d="M88,67 L88.08,67.92 L89,68 L88.08,68.08 L88,69 L87.92,68.08 L87,68 L87.92,67.92 Z" fill={getColor(2)} />

      {/* Stars group 4 */}
      <path d="M40,81 L40.08,81.92 L41,82 L40.08,82.08 L40,83 L39.92,82.08 L39,82 L39.92,81.92 Z" fill={getColor(3)} />
      <path d="M62,7 L62.06,7.7 L62.8,7.8 L62.06,7.9 L62,8.6 L61.94,7.9 L61.2,7.8 L61.94,7.7 Z" fill={getColor(3)} />
      <path d="M8,54 L8.06,54.7 L8.8,54.8 L8.06,54.9 L8,55.6 L7.94,54.9 L7.2,54.8 L7.94,54.7 Z" fill={getColor(3)} />

      {/* 6-point sparkles */}
      <g transform="translate(85, 8)">
        <line x1="0" y1="-0.6" x2="0" y2="0.6" stroke={getColor(4)} strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.6" y1="0" x2="0.6" y2="0" stroke={getColor(4)} strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.42" y1="-0.42" x2="0.42" y2="0.42" stroke={getColor(4)} strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.42" y1="0.42" x2="0.42" y2="-0.42" stroke={getColor(4)} strokeWidth="0.15" strokeLinecap="round" />
      </g>
      <g transform="translate(28, 35)">
        <line x1="0" y1="-0.5" x2="0" y2="0.5" stroke={getColor(5)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.5" y1="0" x2="0.5" y2="0" stroke={getColor(5)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="-0.35" x2="0.35" y2="0.35" stroke={getColor(5)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="0.35" x2="0.35" y2="-0.35" stroke={getColor(5)} strokeWidth="0.12" strokeLinecap="round" />
      </g>
      <g transform="translate(72, 85)">
        <line x1="0" y1="-0.5" x2="0" y2="0.5" stroke={getColor(1)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.5" y1="0" x2="0.5" y2="0" stroke={getColor(1)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="-0.35" x2="0.35" y2="0.35" stroke={getColor(1)} strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="0.35" x2="0.35" y2="-0.35" stroke={getColor(1)} strokeWidth="0.12" strokeLinecap="round" />
      </g>

      {/* Dots - scattered */}
      <circle cx="5" cy="8" r="0.25" fill={getColor(3)} />
      <circle cx="15" cy="15" r="0.2" fill={getColor(5)} />
      <circle cx="92" cy="12" r="0.25" fill={getColor(0)} />
      <circle cx="48" cy="22" r="0.2" fill={getColor(4)} />
      <circle cx="82" cy="32" r="0.2" fill={getColor(1)} />
      <circle cx="22" cy="42" r="0.25" fill={getColor(2)} />
      <circle cx="95" cy="55" r="0.2" fill={getColor(3)} />
      <circle cx="42" cy="48" r="0.18" fill={getColor(5)} />
      <circle cx="58" cy="58" r="0.22" fill={getColor(0)} />
      <circle cx="12" cy="65" r="0.2" fill={getColor(4)} />
      <circle cx="85" cy="78" r="0.25" fill={getColor(2)} />
      <circle cx="32" cy="88" r="0.2" fill={getColor(1)} />
      <circle cx="52" cy="75" r="0.18" fill={getColor(3)} />
      <circle cx="68" cy="25" r="0.2" fill={getColor(5)} />
      <circle cx="3" cy="38" r="0.18" fill={getColor(0)} />
      <circle cx="45" cy="92" r="0.22" fill={getColor(4)} />
      <circle cx="75" cy="5" r="0.2" fill={getColor(3)} />
      <circle cx="98" cy="88" r="0.18" fill={getColor(2)} />
      <circle cx="38" cy="62" r="0.2" fill={getColor(1)} />
      <circle cx="8" cy="95" r="0.25" fill={getColor(5)} />
      <circle cx="62" cy="38" r="0.18" fill={getColor(3)} />
      <circle cx="28" cy="18" r="0.2" fill={getColor(0)} />
      <circle cx="88" cy="45" r="0.22" fill={getColor(4)} />
      <circle cx="15" cy="52" r="0.18" fill={getColor(3)} />
      <circle cx="72" cy="62" r="0.2" fill={getColor(2)} />
    </svg>
  );
};

export default StarryBackground;
