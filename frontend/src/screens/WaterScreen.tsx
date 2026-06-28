import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ProgressRing } from '../components/ProgressRing';
import { QuoteCard } from '../components/QuoteCard';
import { colors } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { useWater } from '../hooks/useWater';
import { fetchWaterHistory } from '../services/api';
import { scheduleWaterReminderNotifications } from '../services/notifications';
import { useAuthStore } from '../store/auth';
import { useWaterStore } from '../store/water';
import { WaterLog } from '../types';
import { toISODate } from '../utils/date';

const tabs = ['Today', 'History'] as const;

function dateLabel(date: string): string {
  if (date === toISODate()) return 'Today';
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function WaterScreen() {
  const insets = useSafeAreaInsets();
  const water = useWater();
  const token = useAuthStore((state) => state.accessToken);
  const { quote, gradient } = useRotatingQuote();
  const addWater = useWaterStore((state) => state.addWater);
  const logs = useWaterStore((state) => state.logs.filter((log) => log.date === toISODate()));
  const [custom, setCustom] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Today');
  const [history, setHistory] = useState<WaterLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const add = async (amount: number) => {
    await addWater(amount);
    await scheduleWaterReminderNotifications(water.intake + amount, water.goal);
    Toast.show({ type: 'success', text1: `Added ${amount}ml` });
  };

  const loadHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const { logs: rows } = await fetchWaterHistory(token, 300);
      setHistory(rows);
    } catch {
      // keep what we have
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'History') void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const grouped = useMemo(() => {
    const map = new Map<string, { total: number; goal: number }>();
    for (const log of history) {
      const prev = map.get(log.date) ?? { total: 0, goal: 0 };
      map.set(log.date, { total: prev.total + log.amountMl, goal: prev.goal || log.goalMl || 0 });
    }
    return [...map.entries()];
  }, [history]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Water</Text>
      <QuoteCard quote={quote} gradient={gradient} variant="compact" label="Stay hydrated" />
      <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

      {tab === 'Today' ? (
        <>
          <Card style={styles.center}>
            <ProgressRing value={water.progress} size={180} stroke={14} label={`${water.intake}ml`} sublabel={`of ${water.goal}ml`} />
          </Card>
          <View style={styles.grid}>
            {[250, 500, 1000].map((amount) => <AppButton key={amount} label={`+${amount === 1000 ? '1L' : `${amount}ml`}`} onPress={() => void add(amount)} style={styles.quick} />)}
          </View>
          <Card>
            <Text style={styles.cardTitle}>Custom amount</Text>
            <TextInput value={custom} onChangeText={setCustom} keyboardType="numeric" placeholder="Amount in ml" placeholderTextColor={colors.textMuted} style={styles.input} />
            <AppButton label="Add custom" icon="add" onPress={() => { const amount = Number(custom); if (amount > 0) void add(amount); setCustom(''); }} />
          </Card>
          <Text style={styles.cardTitle}>Today's history</Text>
          {logs.length ? logs.slice().reverse().map((log, index) => (
            <Card key={`${log.time}_${index}`} style={styles.row}>
              <Text style={styles.metric}>{log.amountMl}ml</Text>
              <Text style={styles.muted}>{log.time}</Text>
            </Card>
          )) : <Text style={styles.muted}>No water logged today.</Text>}
        </>
      ) : (
        <>
          {historyLoading && history.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : grouped.length === 0 ? (
            <Text style={styles.muted}>No water history yet.</Text>
          ) : (
            grouped.map(([date, { total, goal }]) => (
              <Card key={date} style={styles.row}>
                <View>
                  <Text style={styles.cardTitle}>{dateLabel(date)}</Text>
                  {goal > 0 ? <Text style={styles.muted}>{Math.round((total / goal) * 100)}% of {goal}ml</Text> : null}
                </View>
                <Text style={styles.metric}>{Math.round(total)}ml</Text>
              </Card>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  center: { alignItems: 'center' },
  grid: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1 },
  loader: { marginTop: 24 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, marginVertical: 12, padding: 12 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metric: { color: colors.text, fontSize: 18, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 14 }
});
