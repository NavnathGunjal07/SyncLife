import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ExerciseCard } from '../components/ExerciseCard';
import { GradientCard } from '../components/GradientCard';
import { GuidedWorkout } from '../components/GuidedWorkout';
import { WorkoutAnimation } from '../components/workoutAnim/WorkoutAnimation';
import { ProgressRing } from '../components/ProgressRing';
import { QuoteCard } from '../components/QuoteCard';
import { SectionHeader } from '../components/SectionHeader';
import { StepsCard } from '../components/StepsCard';
import { colors } from '../constants/theme';
import { EXERCISE_POOL, FOCUS_STYLE, WEEKDAY_FOCUS, WORKOUT_FOCUSES, WORKOUT_PLAN, WORKOUT_TEMPLATES, estimateMinutes } from '../constants/workouts';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { useWorkout } from '../hooks/useWorkout';
import { useAuthStore } from '../store/auth';
import { useWorkoutStore } from '../store/workout';
import { Exercise, Level, WeekDay, WorkoutFocus, WorkoutLog, WorkoutMode } from '../types';
import { defaultFocusForDate, estimateWorkoutCalories } from '../utils/aiHelpers';
import { getWeekDay, toISODate } from '../utils/date';

const tabs = ['Today', 'Weekly Plan', 'History'] as const;
const levels: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const modes: WorkoutMode[] = ['Home', 'Gym'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REST_SEC: Record<Level, number> = { Beginner: 75, Intermediate: 60, Advanced: 45 };
const modeIcon: Record<WorkoutMode, 'home' | 'business'> = { Home: 'home', Gym: 'business' };

export function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Today');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [poolFocus, setPoolFocus] = useState<WorkoutFocus | null>(null);
  const workout = useWorkout();
  const weightKg = useAuthStore((state) => state.profile.weightKg);
  const { quote, gradient } = useRotatingQuote();
  const { setLevel, setMode, setFocus, toggleExercise, toggleInWorkout, restoreToWorkout, startWorkout, completeWorkout, logs } = useWorkoutStore();
  const startedAt = useWorkoutStore((state) => state.startedAt);

  const today = getWeekDay();
  const defaultFocus = defaultFocusForDate(new Date());
  const focusStyle = FOCUS_STYLE[workout.plan.length ? workout.effectiveFocus ?? 'Rest' : 'Rest'];
  const displayName = (exercise: Exercise) =>
    workout.mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name;

  const minutes = estimateMinutes(workout.plan);
  const kcal = estimateWorkoutCalories(workout.plan, minutes, weightKg);
  const percent = workout.total ? (workout.done / workout.total) * 100 : 0;

  // Exercises from the pool not already in today's workout — offered in the picker.
  const addable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_POOL.filter(
      (exercise) =>
        !workout.plan.some((item) => item.name === exercise.name) &&
        (!poolFocus || WORKOUT_TEMPLATES[poolFocus].some((item) => item.name === exercise.name)) &&
        (!q || exercise.name.toLowerCase().includes(q) || (exercise.homeAlt ?? '').toLowerCase().includes(q))
    );
  }, [workout.plan, query, poolFocus]);

  const history = useMemo(() => {
    const totalMin = logs.reduce((sum, log) => sum + log.durationMin, 0);
    const totalKcal = logs.reduce((sum, log) => sum + log.caloriesBurned, 0);
    return { count: logs.length, totalMin, totalKcal, streak: workoutStreak(logs), week: lastSevenDays(logs) };
  }, [logs]);

  const remove = (exercise: Exercise, index: number) => {
    toggleInWorkout(exercise.name);
    Toast.show({
      type: 'info',
      text1: `Removed ${displayName(exercise)}`,
      text2: 'Tap to undo',
      visibilityTime: 3500,
      onPress: () => {
        restoreToWorkout(exercise.name, index);
        Toast.hide();
      }
    });
  };

  const openGuided = () => {
    startWorkout();
    setGuidedOpen(true);
  };

  const finishGuided = async () => {
    setGuidedOpen(false);
    await complete();
  };

  const complete = async () => {
    const saved = await completeWorkout();
    Toast.show(
      saved
        ? { type: 'success', text1: 'Workout saved 💪' }
        : { type: 'info', text1: 'Already completed today', text2: 'Come back tomorrow to log again.' }
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Workout</Text>

      {/* ── Hero: today's focus + live progress ── */}
      <GradientCard gradient={focusStyle.gradient}>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <View style={styles.heroEyebrow}>
              <Ionicons name={focusStyle.icon} size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.eyebrowText}>Today · {today}</Text>
            </View>
            <Text style={styles.heroTitle}>{workout.plan.length ? workout.effectiveFocus ?? 'Custom' : 'Rest day'}</Text>
            {workout.plan.length ? (
              <View style={styles.heroStats}>
                <HeroStat icon="list" value={`${workout.total}`} label="moves" />
                <HeroStat icon="time" value={`~${minutes}`} label="min" />
                <HeroStat icon="flame" value={`~${kcal}`} label="kcal" />
              </View>
            ) : (
              <Text style={styles.heroSub}>Recover, stretch, hydrate.</Text>
            )}
          </View>
          {workout.plan.length ? (
            <ProgressRing
              value={workout.completedToday ? 100 : percent}
              size={92}
              stroke={9}
              color="#FFFFFF"
              label={workout.completedToday ? '✓' : `${workout.done}/${workout.total}`}
              sublabel={workout.completedToday ? 'done' : 'sets'}
            />
          ) : (
            <View style={styles.restIcon}>
              <Ionicons name="leaf" size={44} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </View>
        {workout.plan.length && !workout.completedToday ? (
          <Pressable onPress={openGuided} style={({ pressed }) => [styles.heroCta, pressed && styles.pressed]}>
            <Ionicons name="play" size={18} color={focusStyle.gradient[1]} />
            <Text style={[styles.heroCtaText, { color: focusStyle.gradient[1] }]}>
              {startedAt || workout.done ? 'Resume guided workout' : 'Start guided workout'}
            </Text>
          </Pressable>
        ) : null}
      </GradientCard>

      <View style={styles.segment}>
        {tabs.map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.segmentItem, tab === item && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Today' ? (
        <>
          {/* ── Focus: choose which muscle group to train today ── */}
          <SectionHeader title="Today's focus" trailing={`Suggested: ${defaultFocus ?? 'Rest'}`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusRow}>
            {WORKOUT_FOCUSES.map((item) => {
              const style = FOCUS_STYLE[item];
              const active = workout.effectiveFocus === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setFocus(item)}
                  style={({ pressed }) => [
                    styles.focusTile,
                    active && { backgroundColor: `${style.tint}26`, borderColor: style.tint },
                    pressed && styles.pressed
                  ]}
                >
                  <View style={[styles.focusIcon, { backgroundColor: active ? style.tint : `${style.tint}22` }]}>
                    <Ionicons name={style.icon} size={20} color={active ? colors.background : style.tint} />
                  </View>
                  <Text style={[styles.focusLabel, active && { color: colors.text }]} numberOfLines={2}>{item}</Text>
                  {item === defaultFocus ? <View style={[styles.suggestDot, { backgroundColor: style.tint }]} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Setup: persisted intensity + location preferences ── */}
          <Card style={styles.setupCard}>
            <View style={styles.setupRow}>
              <Text style={styles.subLabel}>Intensity</Text>
              <View style={styles.miniSegment}>
                {levels.map((item) => (
                  <Pressable key={item} onPress={() => setLevel(item)} style={[styles.miniItem, workout.level === item && { backgroundColor: focusStyle.tint }]}>
                    <Text style={[styles.miniText, workout.level === item && styles.miniTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.setupRow}>
              <Text style={styles.subLabel}>Location</Text>
              <View style={styles.miniSegment}>
                {modes.map((item) => (
                  <Pressable key={item} onPress={() => setMode(item)} style={[styles.miniItem, styles.miniWide, workout.mode === item && { backgroundColor: focusStyle.tint }]}>
                    <Ionicons name={modeIcon[item]} size={13} color={workout.mode === item ? colors.background : colors.textMuted} />
                    <Text style={[styles.miniText, workout.mode === item && styles.miniTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          {/* ── Exercises: check off, remove, or add from the pool ── */}
          <SectionHeader title="Exercises" trailing={workout.plan.length ? `${workout.done}/${workout.total} done` : undefined} />
          {workout.plan.length ? (
            <>
              <View style={styles.stack}>
                {workout.plan.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.name}
                    exercise={exercise}
                    mode={workout.mode}
                    index={index}
                    tint={focusStyle.tint}
                    checked={workout.checked.includes(exercise.name)}
                    onToggle={() => toggleExercise(exercise.name)}
                    onRemove={() => remove(exercise, index)}
                  />
                ))}
              </View>
              <Pressable style={({ pressed }) => [styles.addTile, pressed && styles.pressed]} onPress={() => setPickerOpen(true)}>
                <Ionicons name="add" size={20} color={focusStyle.tint} />
                <Text style={[styles.addTileText, { color: focusStyle.tint }]}>Add exercise</Text>
              </Pressable>
              {workout.customized ? (
                <Pressable onPress={() => setFocus(workout.focus)} hitSlop={8}>
                  <Text style={styles.reset}>↺ Reset to the {workout.effectiveFocus} plan</Text>
                </Pressable>
              ) : null}
              {workout.completedToday ? (
                <View style={styles.completedBanner}>
                  <Ionicons name="trophy" size={18} color={colors.warning} />
                  <Text style={styles.completed}>Today's workout is complete. Logged once per day.</Text>
                </View>
              ) : null}
              <AppButton
                label={workout.completedToday ? 'Completed for today' : 'Mark workout complete'}
                icon="checkmark"
                disabled={workout.completedToday}
                onPress={() => void complete()}
              />
            </>
          ) : (
            <Card style={styles.restCard}>
              <Text style={styles.muted}>🧘 Rest day — recover and stretch. Pick a focus above to train anyway, or add exercises to build your own session.</Text>
              <AppButton label="Add exercise" icon="add" variant="outline" onPress={() => setPickerOpen(true)} />
            </Card>
          )}

          <QuoteCard quote={quote} gradient={gradient} variant="compact" label="Train hard" />
          <StepsCard />
        </>
      ) : null}

      {tab === 'Weekly Plan' ? (
        <View style={styles.stack}>
          {(Object.entries(WORKOUT_PLAN) as [WeekDay, Exercise[]][]).map(([day, exercises]) => {
            const focus = WEEKDAY_FOCUS[day];
            const style = FOCUS_STYLE[focus ?? 'Rest'];
            const isToday = day === today;
            return (
              <View key={day} style={[styles.dayCard, isToday && { borderColor: style.tint }]}>
                <View style={[styles.dayIcon, { backgroundColor: `${style.tint}22` }]}>
                  <Ionicons name={style.icon} size={22} color={style.tint} />
                </View>
                <View style={styles.dayBody}>
                  <View style={styles.dayHead}>
                    <Text style={styles.day}>{day}</Text>
                    {isToday ? (
                      <View style={[styles.todayPill, { backgroundColor: style.tint }]}>
                        <Text style={styles.todayText}>TODAY</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.dayFocus, { color: style.tint }]}>
                    {focus ?? 'Rest'}{exercises.length ? ` · ${exercises.length} moves · ~${estimateMinutes(exercises)} min` : ''}
                  </Text>
                  <Text style={styles.muted} numberOfLines={2}>
                    {exercises.length ? exercises.map((item) => item.name).join(' · ') : 'Recover, stretch and sleep well.'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === 'History' ? (
        <View style={styles.stack}>
          {logs.length ? (
            <>
              <View style={styles.statRow}>
                <StatTile icon="flame" tint={colors.warning} value={`${history.streak}`} label="Day streak" />
                <StatTile icon="trophy" tint="#A78BFA" value={`${history.count}`} label="Workouts" />
                <StatTile icon="time" tint="#60A5FA" value={`${history.totalMin}`} label="Minutes" />
                <StatTile icon="flash" tint="#F87171" value={`${history.totalKcal}`} label="kcal" />
              </View>
              <Card style={styles.chartCard}>
                <View style={styles.chartHead}>
                  <Text style={styles.chartTitle}>Last 7 days</Text>
                  <Text style={styles.chartMeta}>{history.week.reduce((sum, d) => sum + d.minutes, 0)} min</Text>
                </View>
                <View style={styles.chart}>
                  {history.week.map((d) => {
                    const max = Math.max(30, ...history.week.map((w) => w.minutes));
                    return (
                      <View key={d.date} style={styles.barCol}>
                        <Text style={styles.barValue}>{d.minutes ? d.minutes : ''}</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              { height: `${Math.max(d.minutes ? 8 : 0, (d.minutes / max) * 100)}%`, backgroundColor: d.isToday ? focusStyle.tint : '#A78BFA' }
                            ]}
                          />
                        </View>
                        <Text style={[styles.barLabel, d.isToday && { color: colors.text }]}>{d.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
              {logs.slice().reverse().map((log) => (
                <View key={`${log.date}_${log.durationMin}_${log.exercises.length}`} style={styles.logCard}>
                  <View style={styles.logDate}>
                    <Text style={styles.logDay}>{Number(log.date.slice(8, 10))}</Text>
                    <Text style={styles.logMonth}>{MONTHS[Number(log.date.slice(5, 7)) - 1]}</Text>
                  </View>
                  <View style={styles.dayBody}>
                    <Text style={styles.logTitle}>{log.day} · {log.exercises.length} exercises</Text>
                    <Text style={styles.muted} numberOfLines={2}>{log.exercises.join(' · ')}</Text>
                    <View style={styles.logMeta}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.logMetaText}>{log.durationMin} min</Text>
                      <Ionicons name="flame-outline" size={13} color="#F87171" />
                      <Text style={styles.logMetaText}>{log.caloriesBurned} kcal</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <EmptyState icon="barbell-outline" title="No workouts logged yet" hint="Mark today's workout complete to start your history." />
          )}
        </View>
      ) : null}

      {/* Add-exercise picker */}
      <AppBottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add exercise</Text>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} keyboardShouldPersistTaps="handled">
            {([null, ...WORKOUT_FOCUSES] as (WorkoutFocus | null)[]).map((item) => {
              const active = poolFocus === item;
              const tint = item ? FOCUS_STYLE[item].tint : colors.accent;
              return (
                <Pressable
                  key={item ?? 'all'}
                  onPress={() => setPoolFocus(item)}
                  style={[styles.filterChip, active && { backgroundColor: tint, borderColor: tint }]}
                >
                  <Text style={[styles.filterText, active && { color: colors.background }]}>{item ?? 'All'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.stack}>
            {addable.length ? (
              addable.map((exercise) => (
                <Pressable key={exercise.name} style={({ pressed }) => [styles.addRow, pressed && styles.pressed]} onPress={() => toggleInWorkout(exercise.name)}>
                  <View style={styles.addThumb}>
                    <WorkoutAnimation name={displayName(exercise)} size={40} animated={false} fit />
                  </View>
                  <Text style={styles.addName}>{displayName(exercise)}</Text>
                  <Ionicons name="add-circle" size={26} color={focusStyle.tint} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.muted}>{query || poolFocus ? 'No matching exercises.' : "Everything's already in your workout."}</Text>
            )}
          </View>
          <AppButton label="Done" icon="checkmark" onPress={() => setPickerOpen(false)} />
        </View>
      </AppBottomSheet>

      <GuidedWorkout
        visible={guidedOpen}
        exercises={workout.plan}
        mode={workout.mode}
        tint={focusStyle.tint}
        gradient={focusStyle.gradient}
        restSec={REST_SEC[workout.level]}
        checked={workout.checked}
        onExerciseDone={toggleExercise}
        onFinish={() => void finishGuided()}
        onClose={() => setGuidedOpen(false)}
      />
    </ScrollView>
  );
}

// Consecutive days with a logged workout, ending today (or yesterday, so the
// streak doesn't read 0 before today's session).
function workoutStreak(logs: WorkoutLog[]): number {
  const days = new Set(logs.filter((log) => log.completed).map((log) => log.date));
  const cursor = new Date();
  if (!days.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function lastSevenDays(logs: WorkoutLog[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const date = toISODate(day);
    const minutes = logs.filter((log) => log.date === date).reduce((sum, log) => sum + log.durationMin, 0);
    return { date, minutes, label: day.toLocaleDateString('en-US', { weekday: 'narrow' }), isToday: i === 6 };
  });
}

function HeroStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.8)" />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function StatTile({ icon, tint, value, label }: { icon: keyof typeof Ionicons.glyphMap; tint: string; value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  stack: { gap: 10 },
  pressed: { opacity: 0.75 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },

  // Hero
  hero: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 20 },
  heroText: { flex: 1, gap: 6 },
  heroEyebrow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  eyebrowText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  heroStat: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  heroStatValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' },
  heroCta: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
    marginHorizontal: 20,
    paddingVertical: 13
  },
  heroCtaText: { fontSize: 15, fontWeight: '900' },
  restIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    height: 84,
    justifyContent: 'center',
    width: 84
  },

  // Tabs
  segment: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', padding: 4 },
  segmentItem: { alignItems: 'center', borderRadius: 10, flex: 1, paddingVertical: 9 },
  segmentActive: { backgroundColor: colors.surfaceAlt },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: colors.text },

  // Focus picker
  focusRow: { gap: 10, paddingRight: 4 },
  focusTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    padding: 12,
    width: 96
  },
  focusIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  focusLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  suggestDot: { borderRadius: 999, height: 7, position: 'absolute', right: 10, top: 10, width: 7 },

  // Setup
  setupCard: { gap: 12, padding: 14 },
  setupRow: { gap: 8 },
  subLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  miniSegment: { backgroundColor: colors.surfaceAlt, borderRadius: 12, flexDirection: 'row', gap: 4, padding: 3 },
  miniItem: { alignItems: 'center', borderRadius: 9, flex: 1, paddingVertical: 8 },
  miniWide: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  miniText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  miniTextActive: { color: colors.background },

  // Exercises
  addTile: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 14
  },
  addTileText: { fontSize: 15, fontWeight: '800' },
  reset: { color: colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  completedBanner: {
    alignItems: 'center',
    backgroundColor: `${colors.warning}1A`,
    borderColor: `${colors.warning}55`,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12
  },
  completed: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '700' },
  restCard: { gap: 12 },

  // Weekly plan
  dayCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 14,
    padding: 14
  },
  dayIcon: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  dayBody: { flex: 1, gap: 3 },
  dayHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  day: { color: colors.text, fontSize: 17, fontWeight: '900', textTransform: 'capitalize' },
  dayFocus: { fontSize: 13, fontWeight: '800' },
  todayPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  todayText: { color: colors.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },

  // History
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: 14
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  logCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14
  },
  logDate: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, width: 52 },
  logDay: { color: colors.text, fontSize: 20, fontWeight: '900' },
  logMonth: { color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  logTitle: { color: colors.text, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  logMeta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  logMetaText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginRight: 8 },

  chartCard: { gap: 12 },
  chartHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chartTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  chartMeta: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  chart: { flexDirection: 'row', gap: 8, height: 130 },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { color: colors.textMuted, fontSize: 10, fontWeight: '800', height: 13 },
  barTrack: { backgroundColor: colors.surfaceAlt, borderRadius: 8, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', width: '100%' },
  bar: { borderRadius: 8, width: '100%' },
  barLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },

  // Picker
  search: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12
  },
  searchInput: { color: colors.text, flex: 1, fontSize: 15, paddingVertical: 11 },
  filterRow: { gap: 8 },
  filterChip: { borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  filterText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  sheet: { gap: 14 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  addRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10
  },
  addThumb: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, height: 40, justifyContent: 'center', width: 40 },
  addName: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '700' }
});
