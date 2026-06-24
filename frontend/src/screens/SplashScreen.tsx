import { CommonActions, useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<NavProp>();
  const hydrated = useAuthStore((state) => state._hydrated);
  const user = useAuthStore((state) => state.user);
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);
  const isTokenValid = useAuthStore((state) => state.isTokenValid);
  const navigated = useRef(false);

  useEffect(() => {
    if (!hydrated || navigated.current) return;

    const timer = setTimeout(() => {
      navigated.current = true;
      const fullyReady = user && onboardingComplete && isTokenValid();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: fullyReady ? 'AppTabs' : 'Auth' }]
        })
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [hydrated, navigation, onboardingComplete, user, isTokenValid]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SL</Text>
      </View>
      <Text style={styles.title}>SyncLife</Text>
      <Text style={styles.subtitle}>Meals, movement, money, and momentum.</Text>
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
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    height: 76,
    justifyContent: 'center',
    marginBottom: 18,
    width: 76
  },
  logoText: { color: colors.background, fontSize: 28, fontWeight: '900' },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 8 }
});
