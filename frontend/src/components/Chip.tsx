import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors, gradients, radius } from '../constants/theme';
import { GradientFill } from './GradientFill';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, active, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (toValue: number) =>
    Animated.spring(scale, { toValue, speed: 40, bounciness: toValue === 1 ? 14 : 0, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => springTo(0.92)}
      onPressOut={() => springTo(1)}
      style={[styles.chip, active && styles.active, { transform: [{ scale }] }]}
    >
      {active ? <GradientFill colors={gradients.brand} radius={radius.pill} direction="horizontal" /> : null}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  active: {
    backgroundColor: colors.accent,
    borderColor: 'transparent'
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  activeLabel: {
    color: colors.onAccent
  }
});
