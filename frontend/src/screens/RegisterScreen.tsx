import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
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
import { LegalAgreement } from '../components/LegalAgreement';
import { PasswordInput } from '../components/PasswordInput';
import { QuoteCard } from '../components/QuoteCard';
import { LEGAL_VERSION } from '../constants/legal';
import { colors } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { checkUsernameAvailable, register } from '../services/api';
import { useAuthStore } from '../store/auth';
import { isPasswordValid, passwordRules, passwordStrength, USERNAME_PATTERN } from '../utils/password';

type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Register: undefined;
};
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

type UsernameStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; message: string };

export function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const setSession = useAuthStore((state) => state.setSession);
  const acceptLegal = useAuthStore((state) => state.acceptLegal);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({ state: 'idle' });
  const [touched, setTouched] = useState({ name: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const { quote, gradient: quoteGradient } = useRotatingQuote();

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const normalizedUsername = username.trim().toLowerCase();
  const usernameFormatOk = USERNAME_PATTERN.test(normalizedUsername);

  // Debounced live availability check so a taken name is caught before submit.
  useEffect(() => {
    if (!normalizedUsername || !usernameFormatOk) {
      setUsernameStatus({ state: 'idle' });
      return;
    }
    setUsernameStatus({ state: 'checking' });
    let cancelled = false;
    const timer = setTimeout(() => {
      checkUsernameAvailable(normalizedUsername)
        .then((res) => {
          if (cancelled) return;
          setUsernameStatus(
            res.available ? { state: 'available' } : { state: 'unavailable', message: res.message ?? 'Username already taken.' }
          );
        })
        // Offline / server down: don't block — the register call re-checks.
        .catch(() => !cancelled && setUsernameStatus({ state: 'idle' }));
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedUsername, usernameFormatOk]);

  const rules = passwordRules(password, normalizedUsername);
  const strength = passwordStrength(password, normalizedUsername);
  const passwordOk = isPasswordValid(password, normalizedUsername);
  const confirmOk = confirm.length > 0 && confirm === password;

  const nameError = touched.name && !name.trim() ? 'Enter your name.' : null;
  const usernameError =
    normalizedUsername.length > 0 && !usernameFormatOk
      ? '3–30 characters: letters, numbers, and underscores only.'
      : usernameStatus.state === 'unavailable'
        ? usernameStatus.message
        : null;
  const confirmError = touched.confirm && confirm.length > 0 && !confirmOk ? "Passwords don't match." : null;

  const handleRegister = async () => {
    setTouched({ name: true, confirm: true });
    const firstProblem = !name.trim()
      ? 'Enter your name.'
      : !usernameFormatOk
        ? 'Choose a valid username.'
        : usernameStatus.state === 'unavailable'
          ? usernameStatus.message
          : !passwordOk
            ? 'Your password does not meet the requirements yet.'
            : !confirmOk
              ? "Passwords don't match."
              : !agreed
                ? 'Please accept the Terms and Privacy Policy.'
                : null;
    if (firstProblem) {
      Toast.show({ type: 'error', text1: firstProblem });
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await register(normalizedUsername, password, name.trim());
      acceptLegal(LEGAL_VERSION);
      setSession({ id: user.id, username: user.username, name: user.name }, token);
      Toast.show({ type: 'success', text1: `Welcome, ${user.name.split(' ')[0]}!` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      if (/username/i.test(message) && /taken/i.test(message)) {
        setUsernameStatus({ state: 'unavailable', message });
        usernameRef.current?.focus();
      }
      Toast.show({ type: 'error', text1: 'Registration failed', text2: message });
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
            style={[styles.input, nameError && styles.inputInvalid]}
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            placeholder="John Doe"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={60}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />
          {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

          <Text style={styles.label}>Username</Text>
          <View style={[styles.inputRow, usernameError && styles.inputInvalid]}>
            <TextInput
              ref={usernameRef}
              style={styles.inputFlex}
              value={username}
              onChangeText={(v) => setUsername(v.replace(/\s/g, ''))}
              placeholder="john_doe123"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              textContentType="username"
              maxLength={30}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <View style={styles.status}>
              {usernameStatus.state === 'checking' ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : usernameStatus.state === 'available' ? (
                <Ionicons name="checkmark-circle" size={20} color="#3DDC84" />
              ) : usernameError ? (
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              ) : null}
            </View>
          </View>
          {usernameError ? (
            <Text style={styles.error}>{usernameError}</Text>
          ) : usernameStatus.state === 'available' ? (
            <Text style={styles.ok}>@{normalizedUsername} is available</Text>
          ) : (
            <Text style={styles.hint}>Letters, numbers, and underscores only. You'll use this to sign in.</Text>
          )}

          <Text style={styles.label}>Password</Text>
          <PasswordInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            autoComplete="password-new"
            textContentType="newPassword"
            maxLength={72}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {password.length > 0 ? (
            <View style={styles.strengthBlock}>
              <View style={styles.meter}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[styles.meterSeg, { backgroundColor: i <= strength.score ? strength.color : colors.border }]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          ) : null}
          <View style={styles.rules}>
            {rules.map((rule) => (
              <View key={rule.label} style={styles.ruleRow}>
                <Ionicons
                  name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rule.met ? '#3DDC84' : colors.textMuted}
                />
                <Text style={[styles.ruleText, rule.met && styles.ruleMet]}>{rule.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Confirm password</Text>
          <PasswordInput
            ref={confirmRef}
            value={confirm}
            onChangeText={setConfirm}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            invalid={Boolean(confirmError)}
            placeholder="Re-enter your password"
            autoComplete="password-new"
            textContentType="newPassword"
            maxLength={72}
            returnKeyType="done"
            onSubmitEditing={() => void handleRegister()}
          />
          {confirmError ? (
            <Text style={styles.error}>{confirmError}</Text>
          ) : confirmOk ? (
            <Text style={styles.ok}>Passwords match</Text>
          ) : null}
        </View>

        <LegalAgreement checked={agreed} onChange={setAgreed} />

        <AppButton
          label={loading ? 'Creating account…' : 'Create account'}
          icon="person-add"
          loading={loading}
          onPress={() => void handleRegister()}
        />

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
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  ok: { color: '#3DDC84', fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: 14
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row'
  },
  inputFlex: { color: colors.text, flex: 1, fontSize: 16, padding: 14 },
  inputInvalid: { borderColor: colors.danger },
  status: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, width: 48 },
  strengthBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 8 },
  meter: { flex: 1, flexDirection: 'row', gap: 4 },
  meterSeg: { borderRadius: 2, flex: 1, height: 4 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  rules: { gap: 4, marginTop: 8 },
  ruleRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  ruleText: { color: colors.textMuted, fontSize: 12 },
  ruleMet: { color: colors.text },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' }
});
