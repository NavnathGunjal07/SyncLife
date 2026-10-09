import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ExerciseCard } from '../components/ExerciseCard';
import { FadeInView } from '../components/FadeInView';
import { GradientFill } from '../components/GradientFill';
import { OfflineBanner } from '../components/OfflineBanner';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressRing } from '../components/ProgressRing';
import { QuoteCard } from '../components/QuoteCard';
import { MEALS } from '../constants/meals';
import { colors, gradients, tints } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
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
  Finance: undefined;
  Habits: undefined;
};
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const calories = useCalories();
  const water = useWater();
  const workout = useWorkout();
  const syncNow = useAuthStore((state) => state.syncNow);
  const spend = useFinanceStore((state) => state.totalForDate('expense'));
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
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

  // Fresh motivation every time the dashboard gains focus (each tab switch).
  const { quote, gradient: quoteGradient } = useRotatingQuote();

  const firstName = user?.name?.trim().split(' ')[0] ?? '';
  const initial = (firstName || 'S').charAt(0).toUpperCase();
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateLabel = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;

  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const count = await syncNow();
      Toast.show({
        type: 'success',
        text1: count ? `Synced ${count} queued writes` : 'Sync is up to date'
      });
    } catch {
      Toast.show({ type: 'error', text1: "Couldn't sync", text2: 'Check your connection and try again.' });
    } finally {
      setRefreshing(false);
    }
  };

  const navigateTab = (tab: string) => {
    // Navigate within tabs using the parent navigator
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate(tab as never);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
            refreshing={refreshing}
            onRefresh={() => void refresh()}
          />
        }
      >
        <FadeInView style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{dateLabel}</Text>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting} numberOfLines={1}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
              <WavingHand />
            </View>
          </View>
          <Pressable style={styles.avatar} onPress={() => navigateTab('Profile')}>
            <GradientFill colors={gradients.brand} radius={24} />
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </FadeInView>

        <FadeInView delay={60}>
          <QuoteCard quote={quote} gradient={quoteGradient} label="Daily motivation" />
        </FadeInView>

        <FadeInView delay={120}>
        <Card onPress={() => navigation.navigate('Habits')}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <StatHeader icon="calendar" color={tints.workout} label="Habit tracker" />
              <Text style={[styles.metric, styles.goldValue]}>Build your streaks</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
        </FadeInView>

        <FadeInView delay={180} style={styles.grid}>
          <Card style={styles.half} onPress={() => navigateTab('Meals')}>
            <StatHeader icon="restaurant" color={tints.calorie} label="Calories" />
            <View style={styles.ringWrap}>
              <ProgressRing value={calories.progress} size={92} label={`${calories.remaining}`} sublabel="kcal left" color={tints.calorie} />
            </View>
          </Card>
          <Card style={styles.half} onPress={() => navigation.navigate('Water')}>
            <StatHeader icon="water" color={tints.water} label="Water" />
            <View style={styles.statBody}>
              <Text style={styles.metric}>{water.intake}<Text style={styles.unit}>ml</Text></Text>
              <Text style={styles.muted}>of {water.goal}ml</Text>
            </View>
            <ProgressBar value={water.progress} color={tints.water} />
          </Card>
          <Card style={styles.half} onPress={() => navigateTab('Workout')}>
            <StatHeader icon="barbell" color={tints.workout} label="Workout" />
            <View style={styles.statBody}>
              <Text style={styles.metric}>{workout.done}<Text style={styles.unit}>/{workout.total}</Text></Text>
              <Text style={styles.muted}>exercises done</Text>
            </View>
            <ProgressBar value={workoutProgress} color={tints.workout} />
          </Card>
          <Card style={styles.half} onPress={() => navigation.navigate('Finance')}>
            <StatHeader icon="wallet" color={tints.spend} label="Spend" />
            <View style={styles.statBody}>
              <Text style={styles.metric}>{inr(spend)}</Text>
              <Text style={styles.muted}>of {inr(budgetDaily)} daily</Text>
            </View>
            <ProgressBar value={spendPct} color={tints.spend} />
          </Card>
        </FadeInView>

        <FadeInView delay={240}>
        <Card onPress={() => navigation.navigate('Finance')}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <StatHeader icon="diamond" color={tints.gold} label="Gold portfolio" />
              <Text style={[styles.metric, styles.goldValue]}>{inr(goldValue)}</Text>
            </View>
            <View style={[styles.badge, goldPnl < 0 && styles.badgeDanger]}>
              <Ionicons name={goldPnl < 0 ? 'trending-down' : 'trending-up'} size={14} color={colors.text} />
              <Text style={styles.badgeText}>{goldPnl >= 0 ? '+' : ''}{inr(goldPnl)}</Text>
            </View>
          </View>
        </Card>
        </FadeInView>

        <FadeInView delay={300} style={styles.grid}>
          <Card style={[styles.half, styles.streakCard]}>
            <GradientFill colors={gradients.ember} radius={22} />
            <View style={styles.statHeader}>
              <View style={[styles.iconBadge, styles.iconBadgeOnGradient]}>
                <Ionicons name="flame" size={16} color={colors.text} />
              </View>
              <Text style={[styles.eyebrow, styles.onGradient]} numberOfLines={1}>Daily streak</Text>
            </View>
            <View style={styles.statBody}>
              <Text style={[styles.metric, styles.streakMetric]}>{streak}<Text style={[styles.unit, styles.onGradient]}> {streak === 1 ? 'day' : 'days'}</Text></Text>
              <Text style={[styles.muted, styles.onGradient]}>{streak > 0 ? 'on fire, keep going 🔥' : 'start your streak today'}</Text>
            </View>
          </Card>
          <Card style={styles.half}>
            <StatHeader icon="checkmark-done" color={tints.calorie} label="Progress" />
            <View style={styles.ringWrap}>
              <ProgressRing value={completion} size={92} label={`${completion}%`} sublabel="complete" />
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={360}>
        <Card onPress={() => navigateTab('Meals')}>
          <SectionHeader title="Today's meal plan" />
          <View style={styles.chips}>
            {mealPlan.map((meal) => (
              <Chip key={meal} label={meal} />
            ))}
          </View>
        </Card>
        </FadeInView>

        <FadeInView delay={420}>
        <Card onPress={() => navigateTab('Workout')}>
          <SectionHeader title="Today's workout" />
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
        </FadeInView>
      </ScrollView>
    </View>
  );
}

// 👋 that waves a couple of times on mount, then rests.
function WavingHand() {
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const swing = (to: number) =>
      Animated.timing(wave, { toValue: to, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    Animated.sequence([Animated.delay(400), swing(1), swing(-1), swing(1), swing(-1), swing(0)]).start();
  }, [wave]);
  return (
    <Animated.Text
      style={[
        styles.wave,
        { transform: [{ rotate: wave.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] }) }] }
      ]}
    >
      👋
    </Animated.Text>
  );
}

function StatHeader({
  icon,
  color,
  label
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.statHeader}>
      <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.eyebrow} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 4
  },
  headerText: { flex: 1, paddingRight: 12 },
  greetingRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 2 },
  greeting: { color: colors.text, flexShrink: 1, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  wave: { fontSize: 24 },
  date: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48
  },
  avatarText: { color: colors.onAccent, fontSize: 20, fontWeight: '900' },
  streakCard: { borderColor: 'transparent', overflow: 'hidden' },
  iconBadgeOnGradient: { backgroundColor: 'rgba(255,255,255,0.22)' },
  onGradient: { color: 'rgba(255,255,255,0.9)' },
  streakMetric: { fontSize: 34 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { flexGrow: 1, flexBasis: '47%', minHeight: 168, justifyContent: 'space-between' },
  statHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  iconBadge: { alignItems: 'center', borderRadius: 10, height: 30, justifyContent: 'center', width: 30 },
  eyebrow: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  statBody: { marginTop: 8 },
  ringWrap: { alignItems: 'center', marginTop: 6 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  metric: { color: colors.text, fontSize: 26, fontWeight: '900' },
  unit: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLeft: { flex: 1 },
  goldValue: { marginTop: 10 },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeDanger: { backgroundColor: colors.danger },
  badgeText: { color: colors.text, fontWeight: '900' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stack: { gap: 10, marginTop: 12 }
});
