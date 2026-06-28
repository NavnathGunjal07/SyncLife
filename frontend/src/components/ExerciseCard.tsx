import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { findExerciseInfo } from '../constants/exerciseLibrary';
import { colors } from '../constants/theme';
import { Exercise, WorkoutMode } from '../types';
import { Card } from './Card';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';

type Props = {
  exercise: Exercise;
  mode: WorkoutMode;
  checked: boolean;
  onToggle: () => void;
  /** Hide the completion checkbox — used when browsing demos (e.g. rest day). */
  hideToggle?: boolean;
};

export function ExerciseCard({ exercise, mode, checked, onToggle, hideToggle }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const displayName = mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name;
  const detail = exercise.durationSec ? `${Math.round(exercise.durationSec / 60)} min` : `${exercise.sets} x ${exercise.reps}`;
  const info = findExerciseInfo(displayName);

  return (
    <>
      <Card style={styles.card}>
        <Pressable style={styles.tappable} onPress={() => setDetailOpen(true)} hitSlop={4}>
          <View style={styles.thumb}>
            {info ? (
              <Image
                source={{ uri: info.gifUrl }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={150}
                autoplay
                cachePolicy="memory-disk"
                placeholder={{ uri: info.thumbUrl }}
              />
            ) : (
              <Ionicons name="barbell-outline" size={22} color={colors.textMuted} />
            )}
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.meta}>{detail}</Text>
          </View>
        </Pressable>
        {hideToggle ? (
          <Ionicons name="play-circle-outline" size={26} color={colors.textMuted} />
        ) : (
          <Pressable onPress={onToggle} hitSlop={12}>
            <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={28} color={checked ? colors.accent : colors.textMuted} />
          </Pressable>
        )}
      </Card>

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
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  tappable: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48
  },
  thumbImage: { height: '100%', width: '100%' },
  textBlock: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4
  }
});
