/**
 * StarryBackground component
 * Renders colorful stars and sparkles on a dark background
 */

export const StarryBackground = () => {
  // Define stars with positions, sizes, and colors
  const stars = [
    // Large 4-point stars
    { x: 85, y: 8, size: 'lg', color: '#A78BFA', type: 'sparkle' },
    { x: 12, y: 25, size: 'md', color: '#4ADE80', type: 'star' },
    { x: 75, y: 55, size: 'md', color: '#60A5FA', type: 'star' },
    { x: 25, y: 70, size: 'lg', color: '#4ADE80', type: 'star' },
    { x: 55, y: 35, size: 'lg', color: '#F9A8D4', type: 'star' },
    { x: 40, y: 85, size: 'md', color: '#FBBF24', type: 'star' },

    // Small dots
    { x: 8, y: 12, size: 'sm', color: '#FCD34D', type: 'dot' },
    { x: 92, y: 45, size: 'sm', color: '#67E8F9', type: 'dot' },
    { x: 45, y: 15, size: 'sm', color: '#67E8F9', type: 'dot' },
    { x: 68, y: 78, size: 'sm', color: '#A78BFA', type: 'dot' },
    { x: 20, y: 50, size: 'sm', color: '#F9A8D4', type: 'dot' },
    { x: 82, y: 25, size: 'sm', color: '#4ADE80', type: 'dot' },
    { x: 35, y: 42, size: 'xs', color: '#FCD34D', type: 'dot' },
    { x: 60, y: 65, size: 'xs', color: '#60A5FA', type: 'dot' },
    { x: 15, y: 88, size: 'xs', color: '#67E8F9', type: 'dot' },
    { x: 78, y: 92, size: 'xs', color: '#F9A8D4', type: 'dot' },
  ];

  const getSizeScale = (size) => {
    switch (size) {
      case 'lg': return 1.2;
      case 'md': return 0.8;
      case 'sm': return 0.5;
      case 'xs': return 0.3;
      default: return 0.5;
    }
  };

  const renderStar = (star, index) => {
    const scale = getSizeScale(star.size);

    if (star.type === 'dot') {
      return (
        <circle
          key={index}
          cx={`${star.x}%`}
          cy={`${star.y}%`}
          r={4 * scale}
          fill={star.color}
        />
      );
    }

    if (star.type === 'sparkle') {
      // 6-point sparkle/asterisk
      const x = star.x;
      const y = star.y;
      const s = 12 * scale;
      return (
        <g key={index} transform={`translate(${x}%, ${y}%)`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <path
            d={`M0,${-s} L0,${s} M${-s},0 L${s},0 M${-s*0.7},${-s*0.7} L${s*0.7},${s*0.7} M${-s*0.7},${s*0.7} L${s*0.7},${-s*0.7}`}
            stroke={star.color}
            strokeWidth={2 * scale}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    }

    // 4-point star
    const s = 15 * scale;
    return (
      <g key={index}>
        <path
          d={`M${star.x}%,${star.y - s/10}%
              L${star.x + s/30}%,${star.y - s/30}%
              L${star.x + s/10}%,${star.y}%
              L${star.x + s/30}%,${star.y + s/30}%
              L${star.x}%,${star.y + s/10}%
              L${star.x - s/30}%,${star.y + s/30}%
              L${star.x - s/10}%,${star.y}%
              L${star.x - s/30}%,${star.y - s/30}%
              Z`}
          fill={star.color}
        />
      </g>
    );
  };

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
      {/* Green stars */}
      <path d="M12,20 L12.08,20.92 L13,21 L12.08,21.08 L12,22 L11.92,21.08 L11,21 L11.92,20.92 Z" fill="#4ADE80" />
      <path d="M25,64 L25.1,65.1 L26.2,65.2 L25.1,65.3 L25,66.4 L24.9,65.3 L23.8,65.2 L24.9,65.1 Z" fill="#4ADE80" />
      <path d="M78,17 L78.08,17.92 L79,18 L78.08,18.08 L78,19 L77.92,18.08 L77,18 L77.92,17.92 Z" fill="#4ADE80" />

      {/* Pink stars */}
      <path d="M55,29 L55.1,30.1 L56.2,30.2 L55.1,30.3 L55,31.4 L54.9,30.3 L53.8,30.2 L54.9,30.1 Z" fill="#F9A8D4" />
      <path d="M18,74 L18.08,74.92 L19,75 L18.08,75.08 L18,76 L17.92,75.08 L17,75 L17.92,74.92 Z" fill="#F9A8D4" />
      <path d="M67,41 L67.06,41.7 L67.8,41.8 L67.06,41.9 L67,42.6 L66.94,41.9 L66.2,41.8 L66.94,41.7 Z" fill="#F9A8D4" />

      {/* Blue stars */}
      <path d="M75,49 L75.08,49.92 L76,50 L75.08,50.08 L75,51 L74.92,50.08 L74,50 L74.92,49.92 Z" fill="#60A5FA" />
      <path d="M35,11 L35.06,11.7 L35.8,11.8 L35.06,11.9 L35,12.6 L34.94,11.9 L34.2,11.8 L34.94,11.7 Z" fill="#60A5FA" />
      <path d="M88,67 L88.08,67.92 L89,68 L88.08,68.08 L88,69 L87.92,68.08 L87,68 L87.92,67.92 Z" fill="#60A5FA" />

      {/* Yellow/Orange stars */}
      <path d="M40,81 L40.08,81.92 L41,82 L40.08,82.08 L40,83 L39.92,82.08 L39,82 L39.92,81.92 Z" fill="#FBBF24" />
      <path d="M62,7 L62.06,7.7 L62.8,7.8 L62.06,7.9 L62,8.6 L61.94,7.9 L61.2,7.8 L61.94,7.7 Z" fill="#FBBF24" />
      <path d="M8,54 L8.06,54.7 L8.8,54.8 L8.06,54.9 L8,55.6 L7.94,54.9 L7.2,54.8 L7.94,54.7 Z" fill="#FBBF24" />

      {/* 6-point sparkles */}
      <g transform="translate(85, 8)">
        <line x1="0" y1="-0.6" x2="0" y2="0.6" stroke="#A78BFA" strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.6" y1="0" x2="0.6" y2="0" stroke="#A78BFA" strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.42" y1="-0.42" x2="0.42" y2="0.42" stroke="#A78BFA" strokeWidth="0.15" strokeLinecap="round" />
        <line x1="-0.42" y1="0.42" x2="0.42" y2="-0.42" stroke="#A78BFA" strokeWidth="0.15" strokeLinecap="round" />
      </g>
      <g transform="translate(28, 35)">
        <line x1="0" y1="-0.5" x2="0" y2="0.5" stroke="#67E8F9" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.5" y1="0" x2="0.5" y2="0" stroke="#67E8F9" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="-0.35" x2="0.35" y2="0.35" stroke="#67E8F9" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="0.35" x2="0.35" y2="-0.35" stroke="#67E8F9" strokeWidth="0.12" strokeLinecap="round" />
      </g>
      <g transform="translate(72, 85)">
        <line x1="0" y1="-0.5" x2="0" y2="0.5" stroke="#F9A8D4" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.5" y1="0" x2="0.5" y2="0" stroke="#F9A8D4" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="-0.35" x2="0.35" y2="0.35" stroke="#F9A8D4" strokeWidth="0.12" strokeLinecap="round" />
        <line x1="-0.35" y1="0.35" x2="0.35" y2="-0.35" stroke="#F9A8D4" strokeWidth="0.12" strokeLinecap="round" />
      </g>

      {/* Dots - scattered */}
      <circle cx="5" cy="8" r="0.25" fill="#FCD34D" />
      <circle cx="15" cy="15" r="0.2" fill="#67E8F9" />
      <circle cx="92" cy="12" r="0.25" fill="#4ADE80" />
      <circle cx="48" cy="22" r="0.2" fill="#A78BFA" />
      <circle cx="82" cy="32" r="0.2" fill="#F9A8D4" />
      <circle cx="22" cy="42" r="0.25" fill="#60A5FA" />
      <circle cx="95" cy="55" r="0.2" fill="#FCD34D" />
      <circle cx="42" cy="48" r="0.18" fill="#67E8F9" />
      <circle cx="58" cy="58" r="0.22" fill="#4ADE80" />
      <circle cx="12" cy="65" r="0.2" fill="#A78BFA" />
      <circle cx="85" cy="78" r="0.25" fill="#60A5FA" />
      <circle cx="32" cy="88" r="0.2" fill="#F9A8D4" />
      <circle cx="52" cy="75" r="0.18" fill="#FCD34D" />
      <circle cx="68" cy="25" r="0.2" fill="#67E8F9" />
      <circle cx="3" cy="38" r="0.18" fill="#4ADE80" />
      <circle cx="45" cy="92" r="0.22" fill="#A78BFA" />
      <circle cx="75" cy="5" r="0.2" fill="#FBBF24" />
      <circle cx="98" cy="88" r="0.18" fill="#60A5FA" />
      <circle cx="38" cy="62" r="0.2" fill="#F9A8D4" />
      <circle cx="8" cy="95" r="0.25" fill="#67E8F9" />
      <circle cx="62" cy="38" r="0.18" fill="#FCD34D" />
      <circle cx="28" cy="18" r="0.2" fill="#4ADE80" />
      <circle cx="88" cy="45" r="0.22" fill="#A78BFA" />
      <circle cx="15" cy="52" r="0.18" fill="#FBBF24" />
      <circle cx="72" cy="62" r="0.2" fill="#60A5FA" />
    </svg>
  );
};

export default StarryBackground;
