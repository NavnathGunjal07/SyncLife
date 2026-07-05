import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ExerciseCard } from '../components/ExerciseCard';
import { QuoteCard } from '../components/QuoteCard';
import { SectionHeader } from '../components/SectionHeader';
import { StepsCard } from '../components/StepsCard';
import { colors } from '../constants/theme';
import { EXERCISE_POOL, WORKOUT_FOCUSES, WORKOUT_PLAN } from '../constants/workouts';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { useWorkout } from '../hooks/useWorkout';
import { useWorkoutStore } from '../store/workout';
import { Exercise, Level, WorkoutMode } from '../types';
import { defaultFocusForDate } from '../utils/aiHelpers';

const tabs = ['Today', 'Weekly Plan', 'History'] as const;
const levels: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const modes: WorkoutMode[] = ['Home', 'Gym'];

export function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Today');
  const [pickerOpen, setPickerOpen] = useState(false);
  const workout = useWorkout();
  const { quote, gradient } = useRotatingQuote();
  const { setLevel, setMode, setFocus, toggleExercise, toggleInWorkout, completeWorkout, logs } = useWorkoutStore();

  const defaultFocus = defaultFocusForDate(new Date());
  const displayName = (exercise: Exercise) =>
    workout.mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name;

  // Exercises from the pool not already in today's workout — offered in the picker.
  const addable = useMemo(
    () => EXERCISE_POOL.filter((exercise) => !workout.plan.some((item) => item.name === exercise.name)),
    [workout.plan]
  );

  const complete = async () => {
    const saved = await completeWorkout();
    Toast.show(
      saved
        ? { type: 'success', text1: 'Workout saved' }
        : { type: 'info', text1: 'Already completed today', text2: 'Come back tomorrow to log again.' }
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Workout</Text>
      <QuoteCard quote={quote} gradient={gradient} variant="compact" label="Train hard" />
      <StepsCard />
      <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

      {tab === 'Today' ? (
        <>
          {/* ── Setup: persisted intensity + location preferences ── */}
          <SectionHeader title="Your setup" />
          <Card style={styles.setupCard}>
            <Text style={styles.subLabel}>Intensity</Text>
            <View style={styles.tabs}>{levels.map((item) => <Chip key={item} label={item} active={workout.level === item} onPress={() => setLevel(item)} />)}</View>
            <Text style={styles.subLabel}>Location</Text>
            <View style={styles.tabs}>{modes.map((item) => <Chip key={item} label={item} active={workout.mode === item} onPress={() => setMode(item)} />)}</View>
          </Card>

          {/* ── Focus: choose which muscle group to train today ── */}
          <SectionHeader title="Today's focus" trailing={`Suggested: ${defaultFocus ?? 'Rest'}`} />
          <View style={styles.tabs}>
            {WORKOUT_FOCUSES.map((item) => (
              <Chip key={item} label={item} active={workout.effectiveFocus === item} onPress={() => setFocus(item)} />
            ))}
          </View>

          {/* ── Exercises: check off, remove, or add from the pool ── */}
          <SectionHeader title="Exercises" trailing={workout.plan.length ? `${workout.done}/${workout.total} done` : undefined} />
          {workout.plan.length ? (
            <>
              <View style={styles.stack}>
                {workout.plan.map((exercise) => (
                  <ExerciseCard
                    key={exercise.name}
                    exercise={exercise}
                    mode={workout.mode}
                    checked={workout.checked.includes(exercise.name)}
                    onToggle={() => toggleExercise(exercise.name)}
                    onRemove={() => toggleInWorkout(exercise.name)}
                  />
                ))}
              </View>
              <AppButton label="Add exercise" icon="add" variant="outline" onPress={() => setPickerOpen(true)} />
              {workout.customized ? (
                <Pressable onPress={() => setFocus(workout.focus)} hitSlop={8}>
                  <Text style={styles.reset}>↺ Reset to the {workout.effectiveFocus} plan</Text>
                </Pressable>
              ) : null}
              {workout.completedToday ? (
                <Text style={styles.completed}>✓ Today's workout is complete. Logged once per day.</Text>
              ) : null}
              <AppButton
                label={workout.completedToday ? 'Completed for today' : 'Mark workout complete'}
                icon="checkmark"
                disabled={workout.completedToday}
                onPress={() => void complete()}
              />
            </>
          ) : (
            <Card>
              <Text style={styles.muted}>🧘 Rest day — recover and stretch. Pick a focus above to train anyway, or add exercises to build your own session.</Text>
              <View style={styles.restAction}>
                <AppButton label="Add exercise" icon="add" variant="outline" onPress={() => setPickerOpen(true)} />
              </View>
            </Card>
          )}
        </>
      ) : null}

      {tab === 'Weekly Plan' ? (
        <View style={styles.stack}>
          {Object.entries(WORKOUT_PLAN).map(([day, exercises]) => (
            <Card key={day}>
              <Text style={styles.day}>{day}</Text>
              <Text style={styles.muted}>{exercises.length ? exercises.map((item) => item.name).join(', ') : 'Rest day'}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {tab === 'History' ? (
        <View style={styles.stack}>
          {logs.length ? logs.slice().reverse().map((log) => (
            <Card key={`${log.date}_${log.durationMin}_${log.exercises.length}`}>
              <Text style={styles.day}>{log.date}</Text>
              <Text style={styles.muted}>{log.exercises.join(', ')}</Text>
              <Text style={styles.muted}>{log.durationMin} min · {log.caloriesBurned} kcal burned</Text>
            </Card>
          )) : <Text style={styles.muted}>No workouts logged yet.</Text>}
        </View>
      ) : null}

      {/* Add-exercise picker */}
      <AppBottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add exercise</Text>
          <Text style={styles.muted}>Tap to add it to today's workout.</Text>
          <View style={styles.stack}>
            {addable.length ? (
              addable.map((exercise) => (
                <Pressable key={exercise.name} style={styles.addRow} onPress={() => toggleInWorkout(exercise.name)}>
                  <Text style={styles.addName}>{displayName(exercise)}</Text>
                  <Ionicons name="add-circle" size={26} color={colors.accent} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.muted}>Everything's already in your workout.</Text>
            )}
          </View>
          <AppButton label="Done" icon="checkmark" onPress={() => setPickerOpen(false)} />
        </View>
      </AppBottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 10 },
  setupCard: { gap: 10 },
  subLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  reset: { color: colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  restAction: { marginTop: 12 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  completed: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  day: { color: colors.text, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },
  sheet: { gap: 14 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  addRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14
  },
  addName: { color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: '700' }
});
