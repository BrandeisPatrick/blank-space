import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const WaveBackground = () => {
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
      {/* Diagonal parallel waves with random width variations */}

      {/* Wave 1 - filled path with varying width */}
      <path
        d="M -200,1100 C 80,950 150,1050 250,900 C 350,750 420,850 520,700 C 620,550 700,680 800,530 C 900,380 980,510 1100,350
         L 1120,360 C 985,525 905,395 800,545 C 700,695 620,565 520,715 C 420,865 350,765 250,915 C 150,1065 80,965 -180,1115 Z"
        fill="rgba(255,255,255,0.4)"
      />

      {/* Wave 2 - filled path with varying width */}
      <path
        d="M -200,950 C 60,820 140,920 240,780 C 340,640 410,750 510,600 C 610,450 680,580 780,430 C 880,280 950,420 1100,250
         L 1115,270 C 950,440 880,300 780,450 C 680,600 610,470 510,620 C 410,770 340,660 240,800 C 140,940 60,840 -185,970 Z"
        fill="rgba(255,255,255,0.35)"
      />

      {/* Wave 3 - filled path with varying width */}
      <path
        d="M -200,800 C 100,680 170,780 270,640 C 370,500 430,610 530,470 C 630,330 710,460 810,320 C 910,180 990,320 1100,150
         L 1125,180 C 990,350 910,210 810,350 C 710,490 630,360 530,500 C 430,640 370,530 270,670 C 170,810 100,710 -175,830 Z"
        fill="rgba(255,255,255,0.45)"
      />

      {/* Wave 4 - filled path with varying width */}
      <path
        d="M -200,650 C 70,540 150,640 250,510 C 350,380 420,490 520,360 C 620,230 690,350 790,220 C 890,90 960,220 1100,50
         L 1120,80 C 960,250 890,120 790,250 C 690,380 620,260 520,390 C 420,520 350,410 250,540 C 150,670 70,570 -185,680 Z"
        fill="rgba(255,255,255,0.4)"
      />

      {/* Wave 5 - filled path with varying width */}
      <path
        d="M -200,500 C 90,370 160,480 260,350 C 360,220 430,330 530,200 C 630,70 700,190 800,60 C 900,-70 980,80 1100,-50
         L 1125,-20 C 980,110 900,0 800,90 C 700,220 630,100 530,230 C 430,360 360,250 260,380 C 160,510 90,400 -180,530 Z"
        fill="rgba(255,255,255,0.35)"
      />
    </svg>
  );
};
