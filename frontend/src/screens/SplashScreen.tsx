import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { BrandLogo } from '../components/BrandLogo';
import { colors } from '../constants/theme';

// Purely presentational. RootNavigator mounts this while the auth store is
// rehydrating, then swaps to the Auth or AppTabs stack based on auth state.
export function SplashScreen() {
  const intro = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(intro, { toValue: 1, speed: 10, bounciness: 14, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, intro, text]);

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }]
          }
        ]}
      />
      <Animated.View
        style={{
          opacity: intro,
          transform: [
            { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            { rotate: intro.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) }
          ]
        }}
      >
        <BrandLogo size={96} animated />
      </Animated.View>
      <Animated.Text style={[styles.title, rise(text)]}>SyncLife</Animated.Text>
      <Animated.Text style={[styles.subtitle, rise(text)]}>eat · move · save · repeat</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center'
  },
  glow: {
    backgroundColor: colors.accent,
    borderRadius: 140,
    height: 280,
    position: 'absolute',
    width: 280
  },
  title: { color: colors.text, fontSize: 36, fontWeight: '900', letterSpacing: -0.5, marginTop: 22 },
  subtitle: { color: colors.textMuted, fontSize: 15, fontWeight: '600', letterSpacing: 1, marginTop: 6 }
});
