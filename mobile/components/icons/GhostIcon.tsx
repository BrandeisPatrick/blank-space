import Svg, { Ellipse, Path } from 'react-native-svg';

export function GhostIcon({
  size = 18,
  color,
  eyeColor,
}: {
  size?: number;
  color: string;
  eyeColor: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11a7 7 0 0 1 14 0v8.2c0 .5-.6.8-1 .4l-1.4-1.4a.6.6 0 0 0-.85 0l-1.4 1.4a.6.6 0 0 1-.85 0l-1.4-1.4a.6.6 0 0 0-.85 0l-1.4 1.4a.6.6 0 0 1-.85 0L7.6 18.2a.6.6 0 0 0-.85 0L5.4 19.6c-.4.4-1 .1-1-.4z"
        fill={color}
      />
      <Ellipse cx={9.5} cy={11.5} rx={0.9} ry={1.4} fill={eyeColor} />
      <Ellipse cx={14.5} cy={11.5} rx={0.9} ry={1.4} fill={eyeColor} />
    </Svg>
  );
}
