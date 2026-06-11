import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors } from '../constants/theme';
import { useMotivationStore } from '../store/motivation';
import { MotivationType } from '../types';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { Chip } from './Chip';

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function MotivationAlarmsCard() {
  const { alarms, permissionDenied, addAlarm, toggleAlarm, removeAlarm } = useMotivationStore();
  const [newType, setNewType] = useState<MotivationType>('gym');
  const [hourText, setHourText] = useState('7');
  const [minuteText, setMinuteText] = useState('00');
  const [adding, setAdding] = useState(false);

  const add = async () => {
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return;
    await addAlarm(newType, hour, minute);
    setAdding(false);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="call" size={20} color={colors.accent} />
        <Text style={styles.title}>AI Coach calls</Text>
      </View>
      <Text style={styles.description}>Your AI coach calls you like an alarm and talks you into the gym or into deep work.</Text>
      {permissionDenied && <Text style={styles.warning}>Notification permission denied — enable it in system settings to receive coach calls.</Text>}

      {alarms.map((alarm) => (
        <View key={alarm.id} style={styles.alarmRow}>
          <Ionicons name={alarm.type === 'gym' ? 'fitness' : 'briefcase'} size={20} color={alarm.enabled ? colors.accent : colors.textMuted} />
          <View style={styles.alarmText}>
            <Text style={[styles.time, !alarm.enabled && styles.disabledText]}>{formatTime(alarm.hour, alarm.minute)}</Text>
            <Text style={styles.alarmLabel}>{alarm.type === 'gym' ? 'Gym motivation' : 'Work focus'} · daily</Text>
          </View>
          <Switch
            value={alarm.enabled}
            onValueChange={() => void toggleAlarm(alarm.id)}
            trackColor={{ false: colors.surfaceAlt, true: colors.accentMuted }}
            thumbColor={alarm.enabled ? colors.accent : colors.textMuted}
          />
          <Pressable onPress={() => void removeAlarm(alarm.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}

      {adding ? (
        <View style={styles.addForm}>
          <View style={styles.chips}>
            <Chip label="Gym" active={newType === 'gym'} onPress={() => setNewType('gym')} />
            <Chip label="Work" active={newType === 'work'} onPress={() => setNewType('work')} />
          </View>
          <View style={styles.timeInputs}>
            <TextInput value={hourText} onChangeText={setHourText} keyboardType="numeric" maxLength={2} style={styles.timeInput} placeholder="HH" placeholderTextColor={colors.textMuted} />
            <Text style={styles.colon}>:</Text>
            <TextInput value={minuteText} onChangeText={setMinuteText} keyboardType="numeric" maxLength={2} style={styles.timeInput} placeholder="MM" placeholderTextColor={colors.textMuted} />
            <Text style={styles.hint}>24-hour time</Text>
          </View>
          <AppButton label="Save alarm" icon="checkmark" onPress={() => void add()} />
        </View>
      ) : (
        <AppButton label="Add coach call" icon="add" variant="outline" onPress={() => setAdding(true)} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  warning: { color: colors.warning, fontSize: 13 },
  alarmRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  alarmText: { flex: 1 },
  time: { color: colors.text, fontSize: 18, fontWeight: '800' },
  disabledText: { color: colors.textMuted },
  alarmLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  addForm: { gap: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  timeInputs: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  timeInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    padding: 12,
    textAlign: 'center',
    width: 64
  },
  colon: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 12 }
});
