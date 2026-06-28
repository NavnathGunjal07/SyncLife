import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ExerciseCard } from '../components/ExerciseCard';
import { QuoteCard } from '../components/QuoteCard';
import { colors } from '../constants/theme';
import { WORKOUT_PLAN } from '../constants/workouts';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { useWorkout } from '../hooks/useWorkout';
import { useWorkoutStore } from '../store/workout';
import { Level, WorkoutMode } from '../types';

const tabs = ['Today', 'Weekly Plan', 'History'] as const;
const levels: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const modes: WorkoutMode[] = ['Home', 'Gym'];

export function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Today');
  const workout = useWorkout();
  const { quote, gradient } = useRotatingQuote();
  const { setLevel, setMode, toggleExercise, completeWorkout, logs } = useWorkoutStore();

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
      <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

      {tab === 'Today' ? (
        <>
          <View style={styles.tabs}>{levels.map((item) => <Chip key={item} label={item} active={workout.level === item} onPress={() => setLevel(item)} />)}</View>
          <View style={styles.tabs}>{modes.map((item) => <Chip key={item} label={item} active={workout.mode === item} onPress={() => setMode(item)} />)}</View>
          {workout.plan.length ? (
            <Text style={styles.muted}>{workout.done}/{workout.total} exercises checked. Timer starts on first check.</Text>
          ) : null}
          <View style={styles.stack}>
            {workout.plan.length ? (
              workout.plan.map((exercise) => (
                <ExerciseCard
                  key={exercise.name}
                  exercise={exercise}
                  mode={workout.mode}
                  checked={workout.checked.includes(exercise.name)}
                  onToggle={() => toggleExercise(exercise.name)}
                />
              ))
            ) : (
              <>
                <Card>
                  <Text style={styles.muted}>🧘 Rest day — recover and stretch. Browse this week's workouts below and tap any to see the demo.</Text>
                </Card>
                {Object.entries(WORKOUT_PLAN)
                  .filter(([, exercises]) => exercises.length > 0)
                  .map(([day, exercises]) => (
                    <View key={day} style={styles.daySection}>
                      <Text style={styles.day}>{day}</Text>
                      {exercises.map((exercise) => (
                        <ExerciseCard
                          key={`${day}_${exercise.name}`}
                          exercise={exercise}
                          mode={workout.mode}
                          checked={false}
                          onToggle={() => undefined}
                          hideToggle
                        />
                      ))}
                    </View>
                  ))}
              </>
            )}
          </View>
          {workout.plan.length ? (
            <>
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
          ) : null}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 10 },
  daySection: { gap: 10, marginTop: 6 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  completed: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  day: { color: colors.text, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' }
});
