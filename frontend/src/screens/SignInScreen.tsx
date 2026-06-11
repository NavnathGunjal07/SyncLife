import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { colors } from '../constants/theme';
import { signInWithGoogleTokens, useGoogleAuthRequest } from '../services/googleAuth';
import { useAuthStore } from '../store/auth';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SignInScreen() {
  const navigation = useNavigation<NavProp>();
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const setGoogleSession = useAuthStore((state) => state.setGoogleSession);

  useEffect(() => {
    async function finishSignIn() {
      if (response?.type !== 'success') {
        if (response?.type === 'error') {
          Toast.show({
            type: 'error',
            text1: 'Google sign-in failed',
            text2: 'Authentication was cancelled or failed. Please try again.'
          });
        }
        return;
      }

      // With the PKCE code flow, expo-auth-session exchanges the code and
      // returns tokens in response.authentication
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;

      if (!idToken || !accessToken) {
        Toast.show({
          type: 'error',
          text1: 'Google sign-in failed',
          text2: 'Missing tokens from Google. Please try again.'
        });
        return;
      }

      try {
        const user = await signInWithGoogleTokens(idToken, accessToken);
        setGoogleSession(user, accessToken);
        // Navigate to SheetSetup — this sets up the Google Sheets workbook
        navigation.navigate('Auth');
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Sign-in failed',
          text2: error instanceof Error ? error.message : 'Try again.'
        });
      }
    }
    void finishSignIn();
  }, [navigation, response, setGoogleSession]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SL</Text>
      </View>
      <Text style={styles.title}>SyncLife</Text>
      <Text style={styles.body}>
        Sign in with Google to create and sync your personal Sheets workbook.
      </Text>
      {!request ? <ActivityIndicator color={colors.accent} /> : null}
      <AppButton
        label="Sign in with Google"
        icon="logo-google"
        disabled={!request}
        onPress={() => void promptAsync()}
      />
      <Text style={styles.scope}>
        Uses Drive file access and Google Sheets access only for your SyncLife spreadsheet.
      </Text>
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
  logo: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  logoText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '900'
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
