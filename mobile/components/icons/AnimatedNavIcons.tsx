import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

type IconProps = {
  size?: number;
  color?: string;
  active?: boolean;
};

export function AnimatedChatIcon({ size = 20, color = '#fff', active = false }: IconProps) {
  const dot1 = useRef(new Animated.Value(10)).current;
  const dot2 = useRef(new Animated.Value(10)).current;
  const dot3 = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!active) {
      dot1.setValue(10);
      dot2.setValue(10);
      dot3.setValue(10);
      return;
    }
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 8,
            duration: 250,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: 10,
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );
    const a = bounce(dot1, 0);
    const b = bounce(dot2, 150);
    const c = bounce(dot3, 300);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [active, dot1, dot2, dot3]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active && (
        <>
          <AnimatedCircle cx={8} cy={dot1} r={1} fill={color} />
          <AnimatedCircle cx={12} cy={dot2} r={1} fill={color} />
          <AnimatedCircle cx={16} cy={dot3} r={1} fill={color} />
        </>
      )}
    </Svg>
  );
}

export function AnimatedComputerIcon({ size = 20, color = '#fff', active = false }: IconProps) {
  const draw1 = useRef(new Animated.Value(0)).current;
  const draw2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      draw1.setValue(0);
      draw2.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(draw1, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(draw2, {
        toValue: 1,
        duration: 500,
        delay: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, draw1, draw2]);

  const line1End = draw1.interpolate({ inputRange: [0, 1], outputRange: [6, 14] });
  const line2End = draw2.interpolate({ inputRange: [0, 1], outputRange: [6, 10] });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={3} width={20} height={14} rx={2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 21h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 17v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {active && (
        <>
          <AnimatedLine x1={6} y1={8} x2={line1End} y2={8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <AnimatedLine x1={6} y1={11} x2={line2End} y2={11} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export function AnimatedFilesIcon({ size = 20, color = '#fff', active = false }: IconProps) {
  const flapY = useRef(new Animated.Value(0)).current;
  const linesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      Animated.parallel([
        Animated.timing(flapY, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(linesOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(flapY, {
        toValue: -3,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(linesOpacity, {
        toValue: 0.7,
        duration: 300,
        delay: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, flapY, linesOpacity]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <AnimatedG translateY={flapY}>
        <Path
          d="M2 10h20"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </AnimatedG>
      <AnimatedG opacity={linesOpacity}>
        <Line x1={7} y1={13} x2={17} y2={13} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Line x1={7} y1={16} x2={13} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      </AnimatedG>
    </Svg>
  );
}

export function AnimatedHistoryIcon({ size = 20, color = '#fff', active = false }: IconProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rotation.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.timing(rotation, { toValue: -45, duration: 175, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(rotation, { toValue: 0, duration: 175, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(rotation, { toValue: -20, duration: 175, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(rotation, { toValue: 0, duration: 175, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]).start();
  }, [active, rotation]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <AnimatedG originX={12} originY={12} rotation={rotation}>
        <Polyline
          points="12 6 12 12 16 14"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </AnimatedG>
    </Svg>
  );
}
