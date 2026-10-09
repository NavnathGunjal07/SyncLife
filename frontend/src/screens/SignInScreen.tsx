import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
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
import { PasswordInput } from '../components/PasswordInput';
import { BrandLogo } from '../components/BrandLogo';
import { FadeInView } from '../components/FadeInView';
import { QuoteCard } from '../components/QuoteCard';
import { colors } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { login } from '../services/api';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Register: undefined;
  // Root-stack screen; navigate() bubbles up to it.
  Legal: { kind: 'terms' | 'privacy' };
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

export function SignInScreen() {
  const navigation = useNavigation<NavProp>();
  const setSession = useAuthStore((state) => state.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
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
        <FadeInView>
          <BrandLogo size={60} animated />
        </FadeInView>
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
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Text style={styles.label}>Password</Text>
          <PasswordInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            autoComplete="password"
            textContentType="password"
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
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
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
  title: { color: colors.text, fontSize: 34, fontWeight: '900' },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  form: { gap: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: 14
  },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  legalLink: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' }
});
