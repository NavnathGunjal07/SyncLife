import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { LegalDocKind } from '../constants/legal';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { RootStackParamList } from '../types';
import { AppButton } from './AppButton';
import { Card } from './Card';

/**
 * Profile → Legal & privacy: Terms, Privacy Policy, permission settings, and
 * in-app account deletion (required by Google Play for apps with accounts).
 */
export function LegalPrivacyCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (kind: LegalDocKind) => navigation.navigate('Legal', { kind });

  const confirmDelete = () => {
    if (!password) {
      Toast.show({ type: 'error', text1: 'Enter your password to confirm.' });
      return;
    }
    Alert.alert(
      'Delete account permanently?',
      'All your personal data — profile, logs, habits, finances, coach chats and memories — will be erased. Only anonymous usage counts that cannot identify you are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            useChatStore.getState().reset();
            // On success the auth store clears the session and RootNavigator swaps
            // to the Auth stack, unmounting this screen.
            deleteAccount(password)
              .then(() => Toast.show({ type: 'success', text1: 'Your account has been deleted.' }))
              .catch((error: unknown) => {
                setBusy(false);
                Toast.show({
                  type: 'error',
                  text1: 'Could not delete account',
                  text2: error instanceof Error ? error.message : 'Please try again.'
                });
              });
          }
        }
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Legal & privacy</Text>
      <Row icon="document-text-outline" label="Terms of Service" onPress={() => open('terms')} />
      <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => open('privacy')} />
      <Row icon="settings-outline" label="App permissions" onPress={() => void Linking.openSettings()} />
      <Row icon="trash-outline" label="Delete account" danger onPress={() => setDeleting((d) => !d)} />

      {deleting ? (
        <View style={styles.deleteBox}>
          <Text style={styles.warning}>
            This permanently deletes your account and all your personal data on our servers and this device. We keep only
            anonymous usage counts (e.g. number of workouts logged) that can't be linked back to you. Enter your password
            to confirm.
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          <AppButton label="Delete my account" icon="trash" loading={busy} onPress={confirmDelete} style={styles.danger} />
        </View>
      ) : null}
    </Card>
  );
}

function Row({
  icon,
  label,
  danger,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  deleteBox: { gap: 10, marginTop: 6 },
  warning: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: 12
  },
  danger: { backgroundColor: colors.danger }
});
