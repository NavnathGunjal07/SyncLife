import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { register } from '../services/api';
import { useAuthStore } from '../store/auth';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Register: undefined;
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { quote, gradient: quoteGradient } = useRotatingQuote();

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your name.' });
      return;
    }
    if (!username.trim()) {
      Toast.show({ type: 'error', text1: 'Choose a username.' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await register(username.trim().toLowerCase(), password, name.trim());
      setSession({ id: user.id, username: user.username, name: user.name }, token);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error instanceof Error ? error.message : 'Please try again.'
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.body}>Set up SyncLife to start tracking meals, workouts, and finances.</Text>

        <QuoteCard quote={quote} gradient={quoteGradient} variant="compact" />

        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Navnath Gunjal"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="navnath_123"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Text style={styles.hint}>Letters, numbers, and underscores only.</Text>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={() => void handleRegister()}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <AppButton label="Create account" icon="person-add" onPress={() => void handleRegister()} />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.link}>Sign in</Text>
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
  form: { gap: 4 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 10 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
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
