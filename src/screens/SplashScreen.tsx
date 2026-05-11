import { CommonActions, useNavigation } from '@react-navigation/core';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';

export function SplashScreen() {
  const navigation = useNavigation();
  const { user, onboardingComplete, spreadsheetReady } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      const routeName = user && onboardingComplete && spreadsheetReady ? 'AppTabs' : 'Auth';
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: routeName }] }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation, onboardingComplete, spreadsheetReady, user]);

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
  logoText: {
    color: colors.background,
    fontSize: 28,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 8
  }
});
