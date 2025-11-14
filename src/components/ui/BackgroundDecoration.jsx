import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const BackgroundDecoration = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

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
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Curved line decorations */}
      <g
        stroke={theme.colors.bg.border}
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      >
        {/* Top left curve */}
        <path d="M 0,200 Q 150,100 300,150 T 500,100" />

        {/* Top right curve */}
        <path d="M 1000,100 Q 850,200 700,150 T 500,200" />

        {/* Middle curve */}
        <path d="M 200,500 Q 400,400 600,500 T 900,450" />

        {/* Bottom left curve */}
        <path d="M 0,800 Q 200,700 350,750 T 600,700" />

        {/* Bottom right curve */}
        <path d="M 1000,900 Q 800,800 650,850 T 400,800" />
      </g>
    </svg>
  );
};
