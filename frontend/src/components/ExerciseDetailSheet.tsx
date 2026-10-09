import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { findExerciseInfo } from '../constants/exerciseLibrary';
import { videoIdFor, youtubeSearchUrl } from '../constants/exerciseVideos';
import { colors } from '../constants/theme';
import { AppBottomSheet } from './AppBottomSheet';
import { ExerciseVideo } from './ExerciseVideo';
import { MuscleMap } from './MuscleMap';
import { WorkoutAnimation } from './workoutAnim/WorkoutAnimation';

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

      <View style={styles.demo}>
        <WorkoutAnimation name={displayName} size={250} />
        <Text style={styles.demoHint}>Targeted muscles in red · supporting in pink</Text>
      </View>

      <Text style={styles.videoTitle}>Video tutorial</Text>
      <ExerciseVideo videoId={videoIdFor(displayName)} />
      <Pressable
        style={styles.ytLink}
        onPress={() => void Linking.openURL(youtubeSearchUrl(displayName))}
        hitSlop={6}
      >
        <Ionicons name="logo-youtube" size={16} color={colors.danger} />
        <Text style={styles.ytLinkText}>More “{displayName}” videos on YouTube</Text>
      </Pressable>

      <View style={styles.muscles}>
        <Text style={styles.stepsTitle}>Muscles worked</Text>
        <MuscleMap name={displayName} />
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
  demo: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 16, marginBottom: 18, paddingBottom: 12 },
  demoHint: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  videoTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  ytLink: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 },
  ytLinkText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
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
  muscles: { gap: 10, marginTop: 18 },
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
