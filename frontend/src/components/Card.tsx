import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardProps = ViewProps & {
  onPress?: () => void;
};

export function Card({ children, style, onPress, ...props }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  if (onPress) {
    const springTo = (toValue: number) =>
      Animated.spring(scale, { toValue, speed: 40, bounciness: toValue === 1 ? 8 : 0, useNativeDriver: true }).start();
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => springTo(0.97)}
        onPressOut={() => springTo(1)}
        style={[styles.card, style, { transform: [{ scale }] }]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16
  }
});
