import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, gradients } from '../constants/theme';
import { clamp } from '../utils/formatters';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
let ringCounter = 0;

type Props = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
};

export function ProgressRing({ value, size = 112, stroke = 10, label, sublabel, color }: Props) {
  const gradientId = useRef(`ringGrad${ringCounter++}`).current;
  // No tint → brand gradient; a tint fades from a lighter tail into the full color.
  const [from, to] = color ? [color + '66', color] : gradients.brand;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value, 0, 100);
  // Fills from 0 on mount and eases to each new value (SVG props need the JS driver).
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [animated, progress]);

  const dashOffset = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0]
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle stroke={colors.surfaceAlt} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <AnimatedCircle
          stroke={`url(#${gradientId})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{label ?? `${Math.round(progress)}%`}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    alignItems: 'center',
    position: 'absolute'
  },
  label: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 12
  }
});
