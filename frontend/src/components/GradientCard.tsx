import { ReactNode, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  gradient: [string, string];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Soft decorative circles in the top-right corner. */
  decorated?: boolean;
};

let gradientCounter = 0;

/** A card with a diagonal SVG gradient background (no native gradient dependency). */
export function GradientCard({ gradient, children, style, decorated = true }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const idRef = useRef(`gradCard${gradientCounter++}`);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View onLayout={onLayout} style={[styles.card, { backgroundColor: gradient[1] }, style]}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={idRef.current} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${idRef.current})`} />
          {decorated ? (
            <>
              <Circle cx={size.w - 20} cy={10} r={90} fill="rgba(255,255,255,0.07)" />
              <Circle cx={size.w - 40} cy={size.h + 10} r={60} fill="rgba(255,255,255,0.05)" />
            </>
          ) : null}
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden' }
});
