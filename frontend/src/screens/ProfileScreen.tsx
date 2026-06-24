import { CommonActions, useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { MotivationAlarmsCard } from '../components/MotivationAlarmsCard';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth';
import { UserProfile } from '../types';

const goals: UserProfile['fitnessGoal'][] = ['Lose weight', 'Maintain', 'Build muscle'];

type NavProp = NativeStackNavigationProp<{ Auth: undefined; AppTabs: undefined }>;

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, profile, updateProfile, syncNow, logout } = useAuthStore();

  const updateNumber = (key: keyof Pick<UserProfile, 'weightKg' | 'heightCm' | 'calorieTarget' | 'waterGoalMl' | 'monthlyBudget'>, value: string) => {
    const numeric = Number(value.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(numeric)) {
      void updateProfile({ [key]: numeric } as Partial<UserProfile>);
    }
  };

  const sync = async () => {
    const count = await syncNow();
    Toast.show({ type: 'success', text1: count ? `Synced ${count} queued writes` : 'Everything is synced' });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{user?.name?.slice(0, 1) ?? 'S'}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>{user?.name ?? 'SyncLife User'}</Text>
          <Text style={styles.muted}>@{user?.username ?? 'not signed in'}</Text>
        </View>
      </Card>

      <Card style={styles.form}>
        <Field label="Weight (kg)" value={String(profile.weightKg)} onChangeText={(text) => updateNumber('weightKg', text)} />
        <Field label="Height (cm)" value={String(profile.heightCm)} onChangeText={(text) => updateNumber('heightCm', text)} />
        <Text style={styles.label}>Fitness goal</Text>
        <View style={styles.tabs}>{goals.map((goal) => <Chip key={goal} label={goal} active={profile.fitnessGoal === goal} onPress={() => void updateProfile({ fitnessGoal: goal })} />)}</View>
        <Field label="Daily calorie target" value={String(profile.calorieTarget)} onChangeText={(text) => updateNumber('calorieTarget', text)} />
        <Text style={styles.label}>Water goal mode</Text>
        <View style={styles.tabs}>
          <Chip label="Auto" active={profile.waterGoalMode === 'auto'} onPress={() => void updateProfile({ waterGoalMode: 'auto' })} />
          <Chip label="Manual" active={profile.waterGoalMode === 'manual'} onPress={() => void updateProfile({ waterGoalMode: 'manual' })} />
        </View>
        <Field label="Daily water goal (ml)" value={String(profile.waterGoalMl)} onChangeText={(text) => updateNumber('waterGoalMl', text)} />
        <Field label="Monthly budget (₹)" value={String(profile.monthlyBudget)} onChangeText={(text) => updateNumber('monthlyBudget', text)} />
      </Card>

      <MotivationAlarmsCard />

      <AppButton label="Sync now" icon="sync" onPress={() => void sync()} />
      <AppButton
        label="Logout"
        icon="log-out"
        variant="outline"
        onPress={() => {
          void logout().then(() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] })));
        }}
      />
    </ScrollView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  profile: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  avatar: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  initial: { color: colors.background, fontSize: 24, fontWeight: '900' },
  profileText: { flex: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  form: { gap: 14 },
  label: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, padding: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }
});
