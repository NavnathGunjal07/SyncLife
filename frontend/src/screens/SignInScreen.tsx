import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { QuoteCard } from '../components/QuoteCard';
import { colors } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { login } from '../services/api';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Register: undefined;
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

export function SignInScreen() {
  const navigation = useNavigation<NavProp>();
  const setSession = useAuthStore((state) => state.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { quote, gradient: quoteGradient } = useRotatingQuote();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Enter username and password.' });
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await login(username.trim().toLowerCase(), password);
      setSession({ id: user.id, username: user.username, name: user.name }, token);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: error instanceof Error ? error.message : 'Check your credentials and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoText}>SL</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.body}>Sign in to continue tracking your meals, workouts, and finances.</Text>

        <QuoteCard quote={quote} gradient={quoteGradient} variant="compact" />

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="your_username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={() => void handleLogin()}
          />
        </View>

        <AppButton
          label={loading ? 'Signing in…' : 'Sign in'}
          icon="log-in"
          loading={loading}
          onPress={() => void handleLogin()}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
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
  logoText: { color: colors.background, fontSize: 20, fontWeight: '900' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900' },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  form: { gap: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: 14
  },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' }
});
