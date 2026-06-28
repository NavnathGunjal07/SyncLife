import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { colors } from '../constants/theme';
import { useWater } from '../hooks/useWater';
import { scheduleWaterReminderNotifications } from '../services/notifications';
import { useWaterStore } from '../store/water';
import { toISODate } from '../utils/date';

export function WaterScreen() {
  const insets = useSafeAreaInsets();
  const water = useWater();
  const addWater = useWaterStore((state) => state.addWater);
  const logs = useWaterStore((state) => state.logs.filter((log) => log.date === toISODate()));
  const [custom, setCustom] = useState('');

  const add = async (amount: number) => {
    await addWater(amount);
    await scheduleWaterReminderNotifications(water.intake + amount, water.goal);
    Toast.show({ type: 'success', text1: `Added ${amount}ml` });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Water</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  center: { alignItems: 'center' },
  grid: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, marginVertical: 12, padding: 12 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metric: { color: colors.text, fontSize: 18, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 14 }
});
