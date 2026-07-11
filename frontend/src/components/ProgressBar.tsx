import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';
import { clamp } from '../utils/formatters';

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  // Percentage width can't run on the native driver, so this uses the JS one.
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clamp(value),
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [animated, value]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width }, color ? { backgroundColor: color } : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%'
  }
});
