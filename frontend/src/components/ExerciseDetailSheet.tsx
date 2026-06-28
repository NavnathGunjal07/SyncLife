import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { findExerciseInfo } from '../constants/exerciseLibrary';
import { colors } from '../constants/theme';
import { AppBottomSheet } from './AppBottomSheet';

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

      {info ? (
        <Image
          source={{ uri: info.gifUrl }}
          style={styles.gif}
          contentFit="contain"
          transition={200}
          autoplay
          cachePolicy="memory-disk"
          placeholder={{ uri: info.thumbUrl }}
        />
      ) : (
        <View style={[styles.gif, styles.gifFallback]}>
          <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
          <Text style={styles.fallbackText}>No animation available</Text>
        </View>
      )}

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

          <Text style={styles.credit}>Animation from the open exercises-dataset library.</Text>
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
  gif: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    width: '100%'
  },
  gifFallback: { alignItems: 'center', gap: 10, justifyContent: 'center' },
  fallbackText: { color: colors.textMuted, fontSize: 14 },
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
