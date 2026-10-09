import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { Exercise, WorkoutMode } from '../types';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';
import { WorkoutAnimation } from './workoutAnim/WorkoutAnimation';

type Props = {
  exercise: Exercise;
  mode: WorkoutMode;
  checked: boolean;
  onToggle: () => void;
  /** Hide the completion checkbox — used when browsing demos (e.g. rest day). */
  hideToggle?: boolean;
  /** When provided, shows a remove (−) button to drop the exercise from the workout. */
  onRemove?: () => void;
  /** Position in the workout, shown as a small badge. */
  index?: number;
  /** Accent color for the current focus. */
  tint?: string;
};

export function ExerciseCard({ exercise, mode, checked, onToggle, hideToggle, onRemove, index, tint = colors.accent }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const displayName = mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name;
  const timed = Boolean(exercise.durationSec);
  const detail = timed ? `${Math.round((exercise.durationSec ?? 0) / 60) || 1} min` : `${exercise.sets} x ${exercise.reps}`;

  // Pop the check when it flips on.
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!checked) return;
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, speed: 18, bounciness: 14, useNativeDriver: true }).start();
  }, [checked, pop]);

  return (
    <>
      <View style={[styles.card, checked && { borderColor: `${tint}66` }]}>
        <View style={[styles.stripe, { backgroundColor: checked ? tint : `${tint}55` }]} />
        <Pressable style={styles.tappable} onPress={() => setDetailOpen(true)} hitSlop={4}>
          <View style={[styles.thumb, { backgroundColor: `${tint}1F` }]}>
            <WorkoutAnimation name={displayName} size={58} animated={false} fit />
            {index !== undefined ? (
              <View style={[styles.badge, { backgroundColor: tint }]}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.name, checked && styles.nameDone]} numberOfLines={2}>{displayName}</Text>
            <View style={styles.pills}>
              <View style={styles.pill}>
                <Ionicons name={timed ? 'timer-outline' : 'repeat'} size={12} color={tint} />
                <Text style={styles.pillText}>{detail}</Text>
              </View>
              <View style={styles.pill}>
                <Ionicons name="play" size={10} color={colors.textMuted} />
                <Text style={styles.pillText}>Demo</Text>
              </View>
            </View>
          </View>
        </Pressable>
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={12} style={styles.remove} accessibilityLabel={`Remove ${displayName}`}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {hideToggle ? (
          <Ionicons name="play-circle-outline" size={26} color={colors.textMuted} />
        ) : (
          <Pressable onPress={onToggle} hitSlop={12} accessibilityRole="checkbox" accessibilityState={{ checked }}>
            <Animated.View
              style={[
                styles.check,
                checked ? { backgroundColor: tint, borderColor: tint } : null,
                { transform: [{ scale: pop }] }
              ]}
            >
              {checked ? <Ionicons name="checkmark" size={18} color={colors.background} /> : null}
            </Animated.View>
          </Pressable>
        )}
      </View>

      <ExerciseDetailSheet
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        displayName={displayName}
        detail={detail}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    paddingRight: 14,
    paddingVertical: 12
  },
  stripe: { alignSelf: 'stretch', width: 4 },
  tappable: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  thumb: {
    alignItems: 'center',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  badge: {
    alignItems: 'center',
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    left: -6,
    position: 'absolute',
    top: -6,
    width: 22
  },
  badgeText: { color: colors.background, fontSize: 11, fontWeight: '900' },
  textBlock: { flex: 1, gap: 6 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  nameDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  pillText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  remove: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  check: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30
  }
});
