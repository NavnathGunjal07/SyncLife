import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';

function Dot({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, v]);
  return <Animated.View style={[styles.dot, { opacity: v }]} />;
}

export function TypingDots() {
  return (
    <View style={styles.bubble}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dot: { backgroundColor: colors.textMuted, borderRadius: 4, height: 8, width: 8 }
});
