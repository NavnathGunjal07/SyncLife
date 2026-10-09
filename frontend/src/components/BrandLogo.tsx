import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Geometry lives in a 100×100 box and is mirrored by scripts/generate-icons.py —
// keep the two in sync if the mark changes.
/** The "sync S": two 230° arcs meeting in the middle, like a loop that never closes. */
export const LOGO_S_PATH = 'M60.7 27 A14 14 0 1 0 50 50 A14 14 0 1 1 39.3 73';
const S_LENGTH = 113; // ≈ 2 × (230/360) × 2π × 14
const sparkle = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy - s} Q${cx} ${cy} ${cx + s} ${cy} Q${cx} ${cy} ${cx} ${cy + s} Q${cx} ${cy} ${cx - s} ${cy} Q${cx} ${cy} ${cx} ${cy - s} Z`;

type Props = {
  size?: number;
  /** Draws the S in, then keeps the sparkle twinkling. For splash/auth hero spots. */
  animated?: boolean;
};

export function BrandLogo({ size = 64, animated = false }: Props) {
  const draw = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const twinkle = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (!animated) return;
    // SVG stroke props can't use the native driver; the sparkle wrapper can.
    Animated.timing(draw, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 500, delay: 400, easing: Easing.out(Easing.back(3)), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0.55, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated, draw, twinkle]);

  const radius = size * 0.28;
  const sparkleBox = size * 0.34;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="brandLogoBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF451A" />
            <Stop offset="0.5" stopColor="#FF6A1F" />
            <Stop offset="1" stopColor="#FFB81F" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx={(radius / size) * 100} fill="url(#brandLogoBg)" />
        <Circle cx="22" cy="18" r="30" fill="rgba(255,255,255,0.06)" />
        <AnimatedPath
          d={LOGO_S_PATH}
          stroke="#FFFFFF"
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${S_LENGTH} ${S_LENGTH}`}
          strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [S_LENGTH, 0] })}
        />
        <Circle cx="25" cy="81" r="4" fill="#FFFFFF" opacity={0.85} />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkle,
          {
            width: sparkleBox,
            height: sparkleBox,
            left: size * 0.62,
            top: size * 0.04,
            opacity: twinkle,
            transform: [
              { scale: twinkle },
              { rotate: twinkle.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }
            ]
          }
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 34 34">
          <Path d={sparkle(17, 17, 11)} fill="#FFF6D6" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: { position: 'absolute' }
});
