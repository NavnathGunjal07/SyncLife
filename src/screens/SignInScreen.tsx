import { useNavigation } from '@react-navigation/core';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { colors } from '../constants/theme';
import { signInWithGoogleTokens, useGoogleAuthRequest } from '../services/googleAuth';
import { useAuthStore } from '../store/auth';

export function SignInScreen() {
  const navigation = useNavigation<any>();
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const setGoogleSession = useAuthStore((state) => state.setGoogleSession);

  useEffect(() => {
    async function finishSignIn() {
      if (response?.type !== 'success') {
        return;
      }
      const idToken = response.params.id_token;
      const accessToken = response.params.access_token;
      if (!idToken || !accessToken) {
        Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: 'Missing Google token response.' });
        return;
      }
      try {
        const user = await signInWithGoogleTokens(idToken, accessToken);
        setGoogleSession(user, accessToken);
        navigation.navigate('SheetSetup');
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Sign-in failed', text2: error instanceof Error ? error.message : 'Try again.' });
      }
    }
    void finishSignIn();
  }, [navigation, response, setGoogleSession]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SyncLife</Text>
      <Text style={styles.body}>Sign in with Google to create and sync your personal Sheets workbook.</Text>
      {!request ? <ActivityIndicator color={colors.accent} /> : null}
      <AppButton label="Sign in with Google" icon="logo-google" disabled={!request} onPress={() => void promptAsync()} />
      <Text style={styles.scope}>Uses Drive file access and Google Sheets access only for your SyncLife spreadsheet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 28
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900'
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24
  },
  scope: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  }
});
