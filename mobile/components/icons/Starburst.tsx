import Svg, { Line } from 'react-native-svg';

export function Starburst({
  size = 56,
  color,
  rays = 12,
  innerRadius = 4,
  outerRadius = 11,
  strokeWidth = 2.4,
}: {
  size?: number;
  color: string;
  rays?: number;
  innerRadius?: number;
  outerRadius?: number;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="-12 -12 24 24">
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / rays;
        const x1 = Math.cos(angle) * innerRadius;
        const y1 = Math.sin(angle) * innerRadius;
        const x2 = Math.cos(angle) * outerRadius;
        const y2 = Math.sin(angle) * outerRadius;
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}
