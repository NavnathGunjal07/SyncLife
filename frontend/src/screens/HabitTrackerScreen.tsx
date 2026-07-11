import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Chip } from '../components/Chip';
import { colors } from '../constants/theme';
import { goToTab } from '../navigation/navigationRef';
import { fetchHabitYear } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useHabitsStore } from '../store/habits';
import { HabitYear } from '../types';
import { toISODate } from '../utils/date';

const GAP_DEG = 16;
const views = ['Month', 'Year'] as const;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Annular sector path between two radii and two angles.
function sector(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const [x1, y1] = polar(cx, cy, rOut, a0);
  const [x2, y2] = polar(cx, cy, rOut, a1);
  const [x3, y3] = polar(cx, cy, rIn, a1);
  const [x4, y4] = polar(cx, cy, rIn, a0);
  return `M${x1} ${y1} A${rOut} ${rOut} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${rIn} ${rIn} 0 0 0 ${x4} ${y4} Z`;
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function HabitTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const token = useAuthStore((state) => state.accessToken);
  const { month, daysInMonth, habits, loading, load, shiftMonth, toggle, addHabit, removeHabit, fillDefaults } = useHabitsStore();
  const [view, setView] = useState<(typeof views)[number]>('Month');
  const [year, setYear] = useState(toISODate().slice(0, 4));
  const [yearData, setYearData] = useState<HabitYear | null>(null);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<'all' | string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const shotRef = useRef<View>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadYear = async (target = year) => {
    if (!token) return;
    setYearLoading(true);
    try {
      const data = await fetchHabitYear(token, target);
      setYearData(data);
    } catch {
      // keep whatever we have; the retry button below handles the empty case
    } finally {
      setYearLoading(false);
    }
  };

  // Refetch whenever the year tab is (re)opened so month-view toggles show up.
  useEffect(() => {
    if (view === 'Year') void loadYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, year]);

  const nowMonth = toISODate().slice(0, 7);
  const isCurrent = month === nowMonth;
  const todayDay = isCurrent ? Number(toISODate().slice(8, 10)) : month < nowMonth ? daysInMonth : 0;

  const H = habits.length;
  const size = Math.min(width - 40, 360);
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size / 2 - 20;
  const r0 = size * 0.15;
  const band = H > 0 ? (r1 - r0) / H : 0;
  const start = -90 + GAP_DEG / 2;
  const step = (360 - GAP_DEG) / daysInMonth;

  const completed = habits.reduce((sum, h) => sum + h.days.filter((d) => d <= todayDay).length, 0);
  const possible = H * todayDay;
  const pct = possible > 0 ? Math.round((completed / possible) * 100) : 0;

  // ── Year view derived data ──
  const yearReady = yearData !== null && yearData.year === year;
  const filteredYearHabits = useMemo(() => {
    if (!yearReady || !yearData) return [];
    return yearFilter === 'all' ? yearData.habits : yearData.habits.filter((h) => h.id === yearFilter);
  }, [yearData, yearFilter, yearReady]);

  // date -> number of habits done that day (respecting the active filter).
  const yearMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of filteredYearHabits) for (const d of h.dates) map.set(d, (map.get(d) ?? 0) + 1);
    return map;
  }, [filteredYearHabits]);
  const yearDenom = Math.max(1, filteredYearHabits.length);
  const yearFill = yearFilter === 'all' ? colors.accent : yearData?.habits.find((h) => h.id === yearFilter)?.color ?? colors.accent;

  const yearStats = useMemo(() => {
    const today = toISODate();
    let checkins = 0;
    const active: string[] = [];
    for (const [date, count] of yearMap) {
      if (date > today) continue;
      checkins += count;
      if (count > 0) active.push(date);
    }
    active.sort();
    let best = 0;
    let run = 0;
    let prev = '';
    for (const date of active) {
      run = prev && nextDay(prev) === date ? run + 1 : 1;
      if (run > best) best = run;
      prev = date;
    }
    return { checkins, activeDays: active.length, bestStreak: best };
  }, [yearMap]);

  const miniWidth = Math.floor((Math.min(width, 420) - 32 - 24) / 3);

  const openMonth = (monthIndex: number) => {
    setView('Month');
    void load(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
  };

  const createHabit = async () => {
    const name = newName.trim();
    if (!name) return;
    setSheetOpen(false);
    setNewName('');
    await addHabit(name);
    Toast.show({ type: 'success', text1: `${name} added` });
  };

  const confirmRemove = (habitId: string, name: string) => {
    Alert.alert('Delete habit', `Remove "${name}" and all its tracked days?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeHabit(habitId) }
    ]);
  };

  const shareImage = async () => {
    try {
      const uri = await captureRef(shotRef, { format: 'png', quality: 0.95 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share habit tracker' });
      } else {
        Toast.show({ type: 'info', text1: 'Sharing not available on this device' });
      }
    } catch {
      Toast.show({ type: 'error', text1: "Couldn't create the image" });
    }
  };

  const askCoach = () => {
    const lines = habits.map((h) => `• ${h.name}: ${h.days.filter((d) => d <= todayDay).length}/${todayDay} days`);
    const summary = `Here's my habit tracker for ${monthLabel(month)} — ${pct}% overall so far:\n${lines.join('\n')}\n\nHow am I doing, and what should I focus on to stay consistent?`;
    void useChatStore.getState().send(summary);
    goToTab('Assistant');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.muted}>
            {view === 'Month'
              ? `${completed} of ${possible || 0} done this month`
              : `${yearStats.checkins} check-ins in ${year}`}
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setSheetOpen(true)}>
          <Ionicons name="add" size={24} color={colors.background} />
        </Pressable>
      </View>

      <View style={styles.viewTabs}>
        {views.map((item) => (
          <Chip key={item} label={item} active={view === item} onPress={() => setView(item)} />
        ))}
      </View>

      {view === 'Month' ? (
        <View style={styles.monthRow}>
          <Pressable hitSlop={12} onPress={() => void shiftMonth(-1)}><Ionicons name="chevron-back" size={22} color={colors.textMuted} /></Pressable>
          <Text style={styles.monthText}>{monthLabel(month)}</Text>
          <Pressable hitSlop={12} onPress={() => void shiftMonth(1)}><Ionicons name="chevron-forward" size={22} color={colors.textMuted} /></Pressable>
        </View>
      ) : (
        <View style={styles.monthRow}>
          <Pressable hitSlop={12} onPress={() => setYear((y) => String(Number(y) - 1))}><Ionicons name="chevron-back" size={22} color={colors.textMuted} /></Pressable>
          <Text style={styles.monthText}>{year}</Text>
          <Pressable hitSlop={12} onPress={() => setYear((y) => String(Number(y) + 1))}><Ionicons name="chevron-forward" size={22} color={colors.textMuted} /></Pressable>
        </View>
      )}

      <ViewShot ref={shotRef} style={styles.shot}>
        {view === 'Month' ? (
          <View style={styles.wheelWrap}>
            {H === 0 && !loading ? (
              <Text style={styles.muted}>No habits yet. Tap + to add one.</Text>
            ) : (
              <Svg width={size} height={size} style={loading ? styles.dimmed : undefined}>
                {habits.map((h, k) => {
                  const rin = r0 + k * band;
                  const rout = r0 + (k + 1) * band;
                  return Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const a0 = start + i * step;
                    const a1 = start + (i + 1) * step;
                    const on = h.days.includes(d);
                    return (
                      <Path
                        key={`${h.id}-${d}`}
                        d={sector(cx, cy, rin + 0.5, rout - 0.5, a0 + 0.4, a1 - 0.4)}
                        fill={on ? h.color : colors.surface}
                        stroke={on ? h.color : colors.border}
                        strokeWidth={0.7}
                        opacity={d > todayDay ? 0.5 : 1}
                        onPress={() => void toggle(h.id, d)}
                      />
                    );
                  });
                })}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const [lx, ly] = polar(cx, cy, r1 + 10, start + (i + 0.5) * step);
                  return (
                    <SvgText key={`lbl-${d}`} x={lx} y={ly + 3} fill={d === todayDay ? colors.text : '#8A8F98'} fontSize={d === todayDay ? 10 : 9} fontWeight={d === todayDay ? '700' : '400'} textAnchor="middle">{d}</SvgText>
                  );
                })}
                <Circle cx={cx} cy={cy} r={r0 - 2} fill={colors.background} stroke={colors.border} strokeWidth={1} />
                <SvgText x={cx} y={cy - 2} fill={colors.text} fontSize={22} fontWeight="800" textAnchor="middle">{pct}%</SvgText>
                <SvgText x={cx} y={cy + 15} fill={colors.textMuted} fontSize={10} textAnchor="middle">this month</SvgText>
              </Svg>
            )}
            {loading && H > 0 ? <ActivityIndicator color={colors.accent} style={StyleSheet.absoluteFill} /> : null}
          </View>
        ) : yearReady ? (
          <View style={yearLoading ? styles.dimmed : undefined}>
            <View style={styles.statsRow}>
              <YearStat value={yearStats.checkins} label="check-ins" />
              <YearStat value={yearStats.activeDays} label="active days" />
              <YearStat value={yearStats.bestStreak} label="best streak" />
            </View>
            <View style={styles.yearGrid}>
              {Array.from({ length: 12 }, (_, m) => (
                <MiniMonth
                  key={m}
                  year={Number(year)}
                  monthIndex={m}
                  width={miniWidth}
                  map={yearMap}
                  denom={yearDenom}
                  fillColor={yearFill}
                  onPress={() => openMonth(m)}
                />
              ))}
            </View>
            <View style={styles.legendScale}>
              <Text style={styles.scaleText}>Less</Text>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <View
                  key={ratio}
                  style={[
                    styles.scaleSwatch,
                    { backgroundColor: ratio === 0 ? colors.surfaceAlt : yearFill, opacity: ratio === 0 ? 1 : 0.3 + 0.7 * ratio }
                  ]}
                />
              ))}
              <Text style={styles.scaleText}>More</Text>
            </View>
          </View>
        ) : (
          <View style={styles.yearFallback}>
            {yearLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Text style={styles.muted}>Couldn't load {year}.</Text>
                <AppButton label="Retry" icon="refresh" variant="outline" onPress={() => void loadYear()} />
              </>
            )}
          </View>
        )}
      </ViewShot>

      {view === 'Year' && yearReady && yearData ? (
        <View style={styles.viewTabs}>
          <Chip label="All habits" active={yearFilter === 'all'} onPress={() => setYearFilter('all')} />
          {yearData.habits.map((h) => (
            <Chip key={h.id} label={h.name} active={yearFilter === h.id} onPress={() => setYearFilter(h.id)} />
          ))}
        </View>
      ) : null}

      {view === 'Month' ? (
        <>
          <View style={styles.legend}>
            {habits.map((h) => {
              const doneToday = h.days.includes(todayDay);
              return (
                <View key={h.id} style={styles.legendRow}>
                  <Pressable style={styles.legendMain} onPress={() => todayDay > 0 && void toggle(h.id, todayDay)}>
                    <View style={[styles.swatch, { backgroundColor: h.color }]} />
                    <Ionicons name={h.icon as keyof typeof Ionicons.glyphMap} size={18} color={h.color} />
                    <Text style={styles.legendName} numberOfLines={1}>{h.name}</Text>
                    <Text style={styles.legendCount}>{h.days.filter((d) => d <= todayDay).length}d</Text>
                    {todayDay > 0 ? (
                      <View style={[styles.todayCheck, doneToday && { backgroundColor: h.color, borderColor: h.color }]}>
                        {doneToday ? <Ionicons name="checkmark" size={15} color={colors.background} /> : null}
                      </View>
                    ) : null}
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => confirmRemove(h.id, h.name)}><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable>
                </View>
              );
            })}
          </View>

          <AppButton label="Fill today's defaults" icon="sparkles" variant="outline" onPress={() => void fillDefaults()} />
        </>
      ) : null}

      <View style={styles.shareRow}>
        <View style={styles.shareCol}><AppButton label="Share image" icon="share-social" variant="outline" onPress={() => void shareImage()} /></View>
        <View style={styles.shareCol}><AppButton label="Ask coach" icon="sparkles" onPress={askCoach} /></View>
      </View>

      {loading && H === 0 && view === 'Month' ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}

      <AppBottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>New habit</Text>
          <Text style={styles.muted}>A colour is picked for you. Track it by tapping cells.</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Read 20 min"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            onSubmitEditing={() => void createHabit()}
            returnKeyType="done"
          />
          <AppButton label="Add habit" icon="add" onPress={() => void createHabit()} />
        </View>
      </AppBottomSheet>
    </ScrollView>
  );
}

function YearStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// One calendar month rendered as a heatmap (Monday-first). Cell intensity is
// the share of habits completed that day; tapping opens the month view.
function MiniMonth({
  year,
  monthIndex,
  width,
  map,
  denom,
  fillColor,
  onPress
}: {
  year: number;
  monthIndex: number;
  width: number;
  map: Map<string, number>;
  denom: number;
  fillColor: string;
  onPress: () => void;
}) {
  const first = new Date(year, monthIndex, 1);
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const gap = 3;
  const cell = (width - gap * 6) / 7;
  const rows = Math.ceil((offset + days) / 7);
  const height = rows * cell + (rows - 1) * gap;
  const today = toISODate();
  const label = first.toLocaleDateString('en-US', { month: 'short' });

  return (
    <Pressable style={({ pressed }) => [{ width }, pressed && styles.dimmed]} onPress={onPress}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Svg width={width} height={height}>
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const idx = offset + i;
          const x = (idx % 7) * (cell + gap);
          const y = Math.floor(idx / 7) * (cell + gap);
          const ratio = Math.min(1, (map.get(date) ?? 0) / denom);
          const isToday = date === today;
          return (
            <Rect
              key={d}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2.5}
              fill={ratio > 0 ? fillColor : colors.surfaceAlt}
              opacity={ratio > 0 ? 0.3 + 0.7 * ratio : date > today ? 0.4 : 1}
              stroke={isToday ? colors.text : undefined}
              strokeWidth={isToday ? 1 : 0}
            />
          );
        })}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  addBtn: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  viewTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthRow: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center' },
  monthText: { color: colors.text, fontSize: 16, fontWeight: '800', minWidth: 150, textAlign: 'center' },
  shot: { backgroundColor: colors.background },
  wheelWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  dimmed: { opacity: 0.35 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  miniLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  legendScale: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'flex-end', marginTop: 12 },
  scaleSwatch: { borderRadius: 2.5, height: 10, width: 10 },
  scaleText: { color: colors.textMuted, fontSize: 11, marginHorizontal: 4 },
  yearFallback: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  legend: { gap: 8 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  legendMain: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 10, padding: 11 },
  swatch: { borderRadius: 4, height: 12, width: 12 },
  legendName: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '700' },
  legendCount: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  todayCheck: { alignItems: 'center', borderColor: colors.border, borderRadius: 13, borderWidth: 2, height: 26, justifyContent: 'center', width: 26 },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareCol: { flex: 1 },
  sheet: { gap: 14 },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, padding: 14 }
});
