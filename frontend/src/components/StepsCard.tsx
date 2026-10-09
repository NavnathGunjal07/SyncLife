import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { colors, tints } from '../constants/theme';
import { useStepsStore } from '../store/steps';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

export function StepsCard() {
  const { steps, goal, available, permission, init } = useStepsStore();
  const progress = goal > 0 ? Math.min(100, (steps / goal) * 100) : 0;
  const km = (steps * 0.000762).toFixed(2);
  const kcal = Math.round(steps * 0.04);

  const enableSteps = async () => {
    await init(true);
    // Android stops showing the prompt after repeated denials — send them to Settings.
    if (useStepsStore.getState().permission === 'denied') void Linking.openSettings();
  };

  const connectWatch = () => {
    Toast.show({
      type: 'info',
      text1: 'Watch sync via Health Connect',
      text2: 'Your phone already counts steps. Wear OS / watch sync is coming next.'
    });
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.badge, { backgroundColor: tints.workout + '22' }]}>
            <Ionicons name="walk" size={18} color={tints.workout} />
          </View>
          <Text style={styles.label}>Steps today</Text>
        </View>
        <Pressable style={styles.watchBtn} onPress={connectWatch} hitSlop={6}>
          <Ionicons name="watch-outline" size={15} color={colors.textMuted} />
          <Text style={styles.watchText}>Connect watch</Text>
        </Pressable>
      </View>

      {available && permission === 'granted' ? (
        <>
          <View style={styles.metricRow}>
            <Text style={styles.steps}>{steps.toLocaleString()}</Text>
            <Text style={styles.goal}>/ {goal.toLocaleString()}</Text>
          </View>
          <ProgressBar value={progress} color={tints.workout} />
          <Text style={styles.sub}>{km} km · ~{kcal} kcal · counts while the app is open</Text>
        </>
      ) : available ? (
        <Pressable onPress={() => void enableSteps()}>
          <Text style={styles.sub}>
            SyncLife can count your steps using your phone's motion sensor (the "Physical activity" permission). Steps
            stay on this device and are only counted while the app is open.
          </Text>
          <Text style={styles.enable}>{permission === 'denied' ? 'Open settings to allow' : 'Tap to enable step counting'}</Text>
        </Pressable>
      ) : (
        <Text style={styles.sub}>Step tracking isn't available on this device.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  enable: { color: colors.accent, fontSize: 14, fontWeight: '800', marginTop: 8 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  left: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  badge: { alignItems: 'center', borderRadius: 10, height: 30, justifyContent: 'center', width: 30 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  watchBtn: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  watchText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  metricRow: { alignItems: 'baseline', flexDirection: 'row', gap: 6 },
  steps: { color: colors.text, fontSize: 32, fontWeight: '900' },
  goal: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 8 }
});
