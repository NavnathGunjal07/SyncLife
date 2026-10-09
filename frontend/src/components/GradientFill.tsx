import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

let fillCounter = 0;

type Props = {
  colors: readonly [string, string];
  /** Corner radius of the parent, so the fill doesn't poke out on Android. */
  radius?: number;
  /** Diagonal (default) or left→right. */
  direction?: 'diagonal' | 'horizontal';
};

/**
 * Absolutely-positioned SVG gradient that fills its parent. Drop it as the first
 * child of any View to give it a gradient background (no native dependency).
 */
export function GradientFill({ colors, radius = 0, direction = 'diagonal' }: Props) {
  const id = useRef(`gradFill${fillCounter++}`).current;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2={direction === 'diagonal' ? '1' : '0'}>
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${id})`} />
    </Svg>
  );
}
