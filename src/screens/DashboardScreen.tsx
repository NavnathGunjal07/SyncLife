import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ExerciseCard } from '../components/ExerciseCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressRing } from '../components/ProgressRing';
import { MEALS } from '../constants/meals';
import { colors } from '../constants/theme';
import { useCalories } from '../hooks/useCalories';
import { useWater } from '../hooks/useWater';
import { useWorkout } from '../hooks/useWorkout';
import { useAuthStore } from '../store/auth';
import { useFinanceStore } from '../store/finance';
import { useGoldStore } from '../store/gold';
import { useWorkoutStore } from '../store/workout';
import { inr } from '../utils/formatters';

type HomeStackParamList = {
  Dashboard: undefined;
  Water: undefined;
};
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const calories = useCalories();
  const water = useWater();
  const workout = useWorkout();
  const syncNow = useAuthStore((state) => state.syncNow);
  const spend = useFinanceStore((state) => state.totalForDate('expense'));
  const profile = useAuthStore((state) => state.profile);
  const streak = useAuthStore((state) => state.streak);
  const holdings = useGoldStore((state) => state.holdings());
  const toggleExercise = useWorkoutStore((state) => state.toggleExercise);
  const goldValue = holdings.reduce((sum, item) => sum + item.currentValue, 0);
  const goldPnl = holdings.reduce((sum, item) => sum + item.pnl, 0);
  const workoutProgress = workout.total
    ? (workout.done / workout.total) * 100
    : workout.completedToday
      ? 100
      : 0;
  const budgetDaily = profile.monthlyBudget / 30;
  const spendPct = budgetDaily > 0 ? Math.min(100, (spend / budgetDaily) * 100) : 0;
  const completion = Math.round(
    (calories.progress + water.progress + workoutProgress + spendPct) / 4
  );
  const mealPlan = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(
    (type) => MEALS.find((meal) => meal.type === type)?.name ?? type
  );

  const refresh = async () => {
    const count = await syncNow();
    Toast.show({
      type: 'success',
      text1: count ? `Synced ${count} queued writes` : 'Sync is up to date'
    });
  };

  const navigateTab = (tab: string) => {
    // Navigate within tabs using the parent navigator
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate(tab as never);
    }
  };

  return (
    <View style={styles.root}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            refreshing={false}
            onRefresh={() => void refresh()}
          />
        }
      >
        <Text style={styles.title}>Today</Text>
        <View style={styles.grid}>
          <Card style={styles.half} onPress={() => navigateTab('Meals')}>
            <ProgressRing value={calories.progress} label={`${calories.remaining}`} sublabel="kcal left" />
            <Text style={styles.cardTitle}>Calories</Text>
          </Card>
          <Card style={styles.half} onPress={() => navigation.navigate('Water')}>
            <Text style={styles.metric}>{water.intake}ml</Text>
            <Text style={styles.muted}>of {water.goal}ml</Text>
            <ProgressBar value={water.progress} />
            <Text style={styles.cardTitle}>Water</Text>
          </Card>
          <Card style={styles.half} onPress={() => navigateTab('Workout')}>
            <Text style={styles.metric}>{workout.done}/{workout.total}</Text>
            <Text style={styles.muted}>exercises checked</Text>
            <ProgressBar value={workoutProgress} />
            <Text style={styles.cardTitle}>Workout</Text>
          </Card>
          <Card style={styles.half} onPress={() => navigateTab('Finance')}>
            <Text style={styles.metric}>{inr(spend)}</Text>
            <Text style={styles.muted}>vs {inr(budgetDaily)} daily</Text>
            <ProgressBar value={spendPct} />
            <Text style={styles.cardTitle}>Spend</Text>
          </Card>
        </View>

        <Card onPress={() => navigateTab('Finance')}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>Gold portfolio</Text>
              <Text style={styles.metric}>{inr(goldValue)}</Text>
            </View>
            <Text style={[styles.badge, goldPnl < 0 && styles.badgeDanger]}>
              {goldPnl >= 0 ? '+' : ''}{inr(goldPnl)}
            </Text>
          </View>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.half}>
            <Text style={styles.metric}>🔥 {streak}</Text>
            <Text style={styles.cardTitle}>Daily streak</Text>
          </Card>
          <Card style={styles.half}>
            <ProgressRing value={completion} label={`${completion}%`} sublabel="complete" />
          </Card>
        </View>

        <Card onPress={() => navigateTab('Meals')}>
          <Text style={styles.cardTitle}>Today's meal plan</Text>
          <View style={styles.chips}>
            {mealPlan.map((meal) => (
              <Chip key={meal} label={meal} />
            ))}
          </View>
        </Card>

        <Card onPress={() => navigateTab('Workout')}>
          <Text style={styles.cardTitle}>Today's workout</Text>
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
              <Text style={styles.muted}>Rest day</Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { flexGrow: 1, flexBasis: '47%', minHeight: 164, justifyContent: 'space-between' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 10 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  metric: { color: colors.text, fontSize: 24, fontWeight: '900' },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    color: colors.text,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeDanger: { backgroundColor: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stack: { gap: 10, marginTop: 12 }
});
