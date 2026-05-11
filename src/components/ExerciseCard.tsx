import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { Exercise, WorkoutMode } from '../types';
import { Card } from './Card';

type Props = {
  exercise: Exercise;
  mode: WorkoutMode;
  checked: boolean;
  onToggle: () => void;
};

export function ExerciseCard({ exercise, mode, checked, onToggle }: Props) {
  const displayName = mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name;
  const detail = exercise.durationSec ? `${Math.round(exercise.durationSec / 60)} min` : `${exercise.sets} x ${exercise.reps}`;

  return (
    <Card style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>{detail}</Text>
      </View>
      <Pressable onPress={onToggle} hitSlop={12}>
        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={28} color={checked ? colors.accent : colors.textMuted} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
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
