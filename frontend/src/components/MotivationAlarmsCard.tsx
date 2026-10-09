import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { COACH_LANGUAGES, MOTIVATION_META, RINGTONES } from '../constants/motivation';
import { colors } from '../constants/theme';
import { useMotivationStore } from '../store/motivation';
import { MotivationType } from '../types';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { Chip } from './Chip';

const ALARM_TYPES: MotivationType[] = ['gym', 'work', 'reminder', 'sleep'];

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function MotivationAlarmsCard() {
  const { alarms, ringtone, language, permissionDenied, addAlarm, toggleAlarm, removeAlarm, setRingtone, setLanguage } = useMotivationStore();
  const [newType, setNewType] = useState<MotivationType>('gym');
  const [hourText, setHourText] = useState('7');
  const [minuteText, setMinuteText] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [adding, setAdding] = useState(false);

  // Stop any preview playback if the card unmounts mid-preview.

  const add = async () => {
    const displayHour = Number(hourText);
    const minute = Number(minuteText);
    if (
      Number.isNaN(displayHour) ||
      Number.isNaN(minute) ||
      displayHour < 1 ||
      displayHour > 12 ||
      minute < 0 ||
      minute > 59
    ) {
      return;
    }
    const hour = period === 'AM' ? displayHour % 12 : displayHour === 12 ? 12 : displayHour + 12;
    await addAlarm(newType, hour, minute);
    setAdding(false);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="call" size={20} color={colors.accent} />
        <Text style={styles.title}>AI Coach calls</Text>
      </View>
      <Text style={styles.description}>Your AI coach calls you like an alarm and talks you into the gym, deep work, a reminder, or winding down — and you can talk back.</Text>
      {permissionDenied && <Text style={styles.warning}>Notification permission denied — enable it in system settings to receive coach calls.</Text>}

      {alarms.map((alarm) => (
        <View key={alarm.id} style={styles.alarmRow}>
          <Ionicons name={MOTIVATION_META[alarm.type].icon} size={20} color={alarm.enabled ? colors.accent : colors.textMuted} />
          <View style={styles.alarmText}>
            <Text style={[styles.time, !alarm.enabled && styles.disabledText]}>{formatTime(alarm.hour, alarm.minute)}</Text>
            <Text style={styles.alarmLabel}>{MOTIVATION_META[alarm.type].subtitle} · daily</Text>
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

      <View style={styles.ringtoneSection}>
        <View style={styles.ringtoneHeader}>
          <Ionicons name="musical-notes" size={16} color={colors.accent} />
          <Text style={styles.ringtoneTitle}>Call ringtone</Text>
        </View>
        <View style={styles.chips}>
          {RINGTONES.map((r) => (
            <Chip
              key={r.id}
              label={r.label}
              active={ringtone === r.id}
              onPress={() => void setRingtone(r.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.ringtoneSection}>
        <View style={styles.ringtoneHeader}>
          <Ionicons name="language" size={16} color={colors.accent} />
          <Text style={styles.ringtoneTitle}>Coach language</Text>
        </View>
        <View style={styles.chips}>
          {COACH_LANGUAGES.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              active={language === option.id}
              onPress={() => void setLanguage(option.id)}
            />
          ))}
        </View>
        <Text style={styles.hint}>The coach speaks, listens, and replies in this language on calls.</Text>
      </View>

      {adding ? (
        <View style={styles.addForm}>
          <View style={styles.chips}>
            {ALARM_TYPES.map((type) => (
              <Chip key={type} label={MOTIVATION_META[type].label} active={newType === type} onPress={() => setNewType(type)} />
            ))}
          </View>
          <View style={styles.timeInputs}>
            <TextInput
              value={hourText}
              onChangeText={(text) => setHourText(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={2}
              style={styles.timeInput}
              placeholder="HH"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              value={minuteText}
              onChangeText={(text) => setMinuteText(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={2}
              style={styles.timeInput}
              placeholder="MM"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.periodToggle}>
              <Chip label="AM" active={period === 'AM'} onPress={() => setPeriod('AM')} />
              <Chip label="PM" active={period === 'PM'} onPress={() => setPeriod('PM')} />
            </View>
          </View>
          <Text style={styles.hint}>Use 12-hour time, for example 7:30 AM or 6:00 PM.</Text>
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
  ringtoneSection: { borderTopColor: colors.border, borderTopWidth: 1, gap: 10, paddingTop: 14 },
  ringtoneHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  ringtoneTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeInputs: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  periodToggle: { flexDirection: 'row', gap: 8 },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 }
});
