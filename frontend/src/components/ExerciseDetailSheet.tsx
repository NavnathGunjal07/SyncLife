import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { findExerciseInfo } from '../constants/exerciseLibrary';
import { colors } from '../constants/theme';
import { AppBottomSheet } from './AppBottomSheet';
import { ExerciseAnimation, archetypeFor } from './ExerciseFigure';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Name shown to the user (already resolved for Home/Gym mode). */
  displayName: string;
  /** Sets x reps / duration line. */
  detail: string;
};

export function ExerciseDetailSheet({ visible, onClose, displayName, detail }: Props) {
  const info = findExerciseInfo(displayName);

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>

      <View style={styles.animWrap}>
        <ExerciseAnimation kind={archetypeFor(displayName)} size={190} color={colors.accent} />
      </View>

      {info ? (
        <>
          <View style={styles.chips}>
            <Tag icon="locate" label={info.target} />
            <Tag icon="construct" label={info.equipment} />
          </View>

          {info.steps.length > 0 && (
            <View style={styles.steps}>
              <Text style={styles.stepsTitle}>How to perform</Text>
              {info.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </AppBottomSheet>
  );
}

function Tag({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  detail: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  animWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    justifyContent: 'center',
    paddingVertical: 10
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  tagText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  steps: { gap: 12, marginTop: 20 },
  stepsTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  stepNum: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24
  },
  stepNumText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  stepText: { color: colors.textMuted, flex: 1, fontSize: 14, lineHeight: 21 },
  credit: { color: colors.textMuted, fontSize: 12, marginTop: 20, textAlign: 'center' }
});
