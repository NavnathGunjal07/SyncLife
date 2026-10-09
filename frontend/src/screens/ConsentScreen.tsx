import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LegalAgreement } from '../components/LegalAgreement';
import { LEGAL_VERSION } from '../constants/legal';
import { colors } from '../constants/theme';
import { requestNotificationPermissions } from '../services/notifications';
import { hasStepPermission, isStepTrackingAvailable } from '../services/pedometer';
import { useAuthStore } from '../store/auth';
import { useStepsStore } from '../store/steps';

type Status = 'granted' | 'denied' | 'unknown' | 'unavailable';

/**
 * Shown once after sign-in/sign-up (and again whenever LEGAL_VERSION changes):
 *  1. Terms/Privacy acceptance, if this user hasn't accepted the current version.
 *  2. Prominent disclosure for each runtime permission — what it's for and what
 *     data it touches — *before* the system dialog, which only appears when the
 *     user taps "Allow". Every permission is optional.
 */
export function ConsentScreen() {
  const insets = useSafeAreaInsets();
  const acceptedLegalVersion = useAuthStore((s) => s.acceptedLegalVersion);
  const acceptLegal = useAuthStore((s) => s.acceptLegal);
  const markPermissionsReviewed = useAuthStore((s) => s.markPermissionsReviewed);
  const needsTerms = acceptedLegalVersion !== LEGAL_VERSION;
  const [agreed, setAgreed] = useState(!needsTerms);
  const [notif, setNotif] = useState<Status>('unknown');
  const [steps, setSteps] = useState<Status>('unknown');

  const refresh = useCallback(async () => {
    const n = await Notifications.getPermissionsAsync();
    setNotif(n.granted ? 'granted' : n.canAskAgain ? 'unknown' : 'denied');
    if (!(await isStepTrackingAvailable())) setSteps('unavailable');
    else if (await hasStepPermission()) setSteps('granted');
    else setSteps((prev) => (prev === 'denied' ? 'denied' : 'unknown'));
  }, []);

  useEffect(() => {
    void refresh();
    // Re-check after returning from Android Settings.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const allowNotifications = async () => {
    if (notif === 'denied') return void Linking.openSettings();
    setNotif((await requestNotificationPermissions()) ? 'granted' : 'denied');
  };

  const allowSteps = async () => {
    if (steps === 'denied') return void Linking.openSettings();
    await useStepsStore.getState().init(true);
    setSteps(useStepsStore.getState().permission === 'granted' ? 'granted' : 'denied');
  };

  const finish = () => {
    if (needsTerms) acceptLegal(LEGAL_VERSION);
    markPermissionsReviewed();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Before you start</Text>
      <Text style={styles.body}>
        SyncLife only asks for what a feature needs. Everything below is optional except the terms — you can change any
        permission later in Android Settings.
      </Text>

      {needsTerms ? (
        <Card>
          <Text style={styles.cardTitle}>{acceptedLegalVersion ? "We've updated our terms" : 'Terms & privacy'}</Text>
          <Text style={styles.cardBody}>
            Please review and accept to continue. SyncLife is a tracking tool, not medical or financial advice, and the AI
            coach can make mistakes.
          </Text>
          <View style={styles.spacer} />
          <LegalAgreement checked={agreed} onChange={setAgreed} />
        </Card>
      ) : null}

      <Text style={styles.section}>Permissions</Text>

      <PermissionRow
        icon="notifications"
        title="Notifications"
        why="Meal, water and workout reminders, your scheduled AI-coach calls, and an ongoing tray notification showing today's progress."
        status={Platform.OS === 'android' && Number(Platform.Version) < 33 ? 'granted' : notif}
        onAllow={() => void allowNotifications()}
      />
      <PermissionRow
        icon="walk"
        title="Physical activity"
        why="Counts your steps with the phone's motion sensor while the app is open. Step counts stay on this device and are never uploaded."
        status={steps}
        onAllow={() => void allowSteps()}
      />

      <AppButton label="Continue" icon="arrow-forward" disabled={!agreed} onPress={finish} />
      {!agreed ? <Text style={styles.hint}>Accept the Terms and Privacy Policy to continue.</Text> : null}
    </ScrollView>
  );
}

function PermissionRow({
  icon,
  title,
  why,
  status,
  onAllow
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  why: string;
  status: Status;
  onAllow?: () => void;
}) {
  const label =
    status === 'granted' ? 'Allowed' : status === 'unavailable' ? 'Not supported' : null;
  return (
    <Card>
      <View style={styles.rowHeader}>
        <View style={styles.badge}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        {label ? <Text style={[styles.pill, status === 'granted' && styles.pillOn]}>{label}</Text> : null}
      </View>
      <Text style={styles.cardBody}>{why}</Text>
      {!label && onAllow ? (
        <AppButton
          label={status === 'denied' ? 'Open settings' : 'Allow'}
          icon={status === 'denied' ? 'settings-outline' : 'checkmark'}
          variant="outline"
          style={styles.allow}
          onPress={onAllow}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, paddingHorizontal: 20 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  section: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 8 },
  cardTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '800' },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  spacer: { height: 14 },
  rowHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  badge: { alignItems: 'center', backgroundColor: colors.accent + '22', borderRadius: 10, height: 32, justifyContent: 'center', width: 32 },
  pill: { backgroundColor: colors.surfaceAlt, borderRadius: 999, color: colors.textMuted, fontSize: 12, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  pillOn: { color: colors.accent },
  allow: { marginTop: 12 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' }
});
