import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRandomActionQuote } from '../constants/quotes';
import { colors, tints } from '../constants/theme';
import { useCalories } from '../hooks/useCalories';
import { useWater } from '../hooks/useWater';
import { useWorkout } from '../hooks/useWorkout';
import { goToTab } from '../navigation/navigationRef';
import { useAuthStore } from '../store/auth';
import { AppTabParamList } from '../types';

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * A persistent floating widget pinned above the tab bar on every main screen.
 * Collapsed it shows overall daily progress + a rotating motivational line;
 * expanded it breaks down calories / water / workout with a call-to-action.
 * It can be minimized to a small corner badge to stay out of the way.
 */
export function ProgressPulse() {
  const insets = useSafeAreaInsets();
  const calories = useCalories();
  const water = useWater();
  const workout = useWorkout();
  const streak = useAuthStore((state) => state.streak);

  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [quote, setQuote] = useState(getRandomActionQuote);

  // Refresh the line periodically so it feels alive without nagging.
  useEffect(() => {
    const id = setInterval(() => setQuote(getRandomActionQuote()), 18000);
    return () => clearInterval(id);
  }, []);

  // Get out of the way while the user is typing (chat, meal search, profile).
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const workoutProgress = workout.total
    ? (workout.done / workout.total) * 100
    : workout.completedToday
      ? 100
      : 0;
  const overall = clampPct((clampPct(calories.progress) + clampPct(water.progress) + workoutProgress) / 3);

  const cta = useMemo((): { label: string; tab: keyof AppTabParamList } => {
    const workoutDone = workout.completedToday || (workout.total > 0 && workout.done === workout.total);
    if (workout.total > 0 && !workoutDone) {
      return { label: workout.done > 0 ? 'Continue workout' : 'Start workout', tab: 'Workout' };
    }
    if (overall < 100) return { label: 'Track your day', tab: 'Home' };
    return { label: 'Crushed it today', tab: 'Home' };
  }, [workout.completedToday, workout.total, workout.done, overall]);

  const bottom = insets.bottom + 78;

  const expand = () => {
    setQuote(getRandomActionQuote());
    setExpanded(true);
  };

  const onCta = () => {
    setExpanded(false);
    goToTab(cta.tab);
  };

  // Typing — stay hidden so the widget never covers an input or the keyboard.
  if (keyboardUp) return null;

  // ── Minimized: a small corner badge that reopens the widget ──
  if (minimized) {
    return (
      <Pressable style={[styles.fab, { bottom }]} onPress={() => setMinimized(false)}>
        <Text style={styles.fabPct}>{overall}%</Text>
        <Text style={styles.fabCaption}>today</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      {expanded ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="pulse" size={18} color={colors.accent} />
              <Text style={styles.cardTitle}>Today's progress</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.overallBig}>{overall}%</Text>
              <Pressable onPress={() => setExpanded(false)} hitSlop={10}>
                <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => setMinimized(true)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <MetricRow
            icon="restaurant"
            color={tints.calorie}
            label="Calories"
            value={`${Math.round(calories.calories)} / ${calories.target} kcal`}
            progress={calories.progress}
          />
          <MetricRow
            icon="water"
            color={tints.water}
            label="Water"
            value={`${Math.round(water.intake)} / ${water.goal} ml`}
            progress={water.progress}
          />
          <MetricRow
            icon="barbell"
            color={tints.workout}
            label="Workout"
            value={workout.total ? `${workout.done} / ${workout.total} done` : workout.completedToday ? 'Completed' : 'Rest day'}
            progress={workoutProgress}
          />

          <View style={styles.streakRow}>
            <Ionicons name="flame" size={16} color={tints.streak} />
            <Text style={styles.streakText}>
              {streak > 0 ? `${streak}-day streak — keep it alive` : 'Start your streak today'}
            </Text>
          </View>

          <View style={styles.quoteBlock}>
            <Text style={styles.quoteText}>“{quote.text}”</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>

          <Pressable style={styles.cta} onPress={onCta}>
            <Ionicons name="arrow-forward" size={18} color={colors.background} />
            <Text style={styles.ctaText}>{cta.label}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.bar} onPress={expand}>
          <View style={[styles.badge, overall >= 100 && styles.badgeDone]}>
            <Text style={styles.badgePct}>{overall}</Text>
            <Text style={styles.badgeSign}>%</Text>
          </View>
          <View style={styles.barText}>
            <Text style={styles.barQuote} numberOfLines={1}>{quote.text}</Text>
            <Text style={styles.barMeta} numberOfLines={1}>
              {overall}% of today · 🔥 {streak} day{streak === 1 ? '' : 's'}
            </Text>
          </View>
          <Pressable onPress={() => setMinimized(true)} hitSlop={10} style={styles.barClose}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
          <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

function MetricRow({
  icon,
  color,
  label,
  value,
  progress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <View style={styles.metricLabel}>
          <Ionicons name={icon} size={14} color={color} />
          <Text style={styles.metricName}>{label}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampPct(progress)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { left: 12, position: 'absolute', right: 12, zIndex: 50 },
  // ── Collapsed bar ──
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: 14,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    width: 48
  },
  badgeDone: { backgroundColor: colors.accent },
  badgePct: { color: colors.text, fontSize: 18, fontWeight: '900' },
  badgeSign: { color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 3 },
  barText: { flex: 1 },
  barQuote: { color: colors.text, fontSize: 14, fontWeight: '800' },
  barMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  barClose: { padding: 2 },
  // ── Minimized corner badge ──
  fab: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    elevation: 12,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: 56,
    zIndex: 50
  },
  fabPct: { color: colors.background, fontSize: 17, fontWeight: '900' },
  fabCaption: { color: colors.background, fontSize: 9, fontWeight: '800', opacity: 0.8 },
  // ── Expanded card ──
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 16,
    gap: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerLeft: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  headerRight: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  overallBig: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  metric: { gap: 6 },
  metricTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  metricName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  metricValue: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  track: { backgroundColor: colors.surfaceAlt, borderRadius: 999, height: 8, overflow: 'hidden' },
  fill: { borderRadius: 999, height: '100%' },
  streakRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  streakText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  quoteBlock: {
    backgroundColor: colors.surfaceAlt,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    borderRadius: 12,
    gap: 4,
    padding: 12
  },
  quoteText: { color: colors.text, fontSize: 14, fontStyle: 'italic', fontWeight: '700', lineHeight: 20 },
  quoteAuthor: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13
  },
  ctaText: { color: colors.background, fontSize: 15, fontWeight: '900' }
});
