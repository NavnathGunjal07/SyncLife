import { CommonActions, useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { colors } from '../constants/theme';
import { createSheets } from '../services/googleSheets';
import { scheduleDailyNotifications } from '../services/notifications';
import { useAuthStore } from '../store/auth';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SheetSetupScreen() {
  const navigation = useNavigation<NavProp>();
  const token = useAuthStore((state) => state.accessToken);
  const markSpreadsheetReady = useAuthStore((state) => state.markSpreadsheetReady);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const attempted = useRef(false);

  const setup = async () => {
    if (!token) {
      setError('Google access token is missing. Please sign in again.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await createSheets(token);
      await scheduleDailyNotifications();
      markSpreadsheetReady();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'AppTabs' }] }));
    } catch (setupError) {
      const message =
        setupError instanceof Error ? setupError.message : 'Unable to create sheets.';
      setError(message);
      Toast.show({ type: 'error', text1: 'Sheet setup failed', text2: message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run setup only once, and only when the token is actually available
  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      void setup();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} size="large" animating={loading} />
      <Text style={styles.title}>Preparing your Sheets</Text>
      <Text style={styles.body}>
        Creating Calories, Workout, Water, Money, Gold, Daily Summary, Goals, and Meal Plans tabs.
      </Text>
      {!token && !error ? (
        <Text style={styles.error}>Waiting for Google session…</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {error && token ? (
        <AppButton label="Retry setup" onPress={() => void setup()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 28
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center'
  }
});
