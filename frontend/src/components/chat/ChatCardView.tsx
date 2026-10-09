import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { findExerciseInfo } from '../../constants/exerciseLibrary';
import { colors, tints } from '../../constants/theme';
import { ChatCard } from '../../types';
import { inr } from '../../utils/formatters';
import { AppButton } from '../AppButton';
import { Card } from '../Card';
import { WorkoutAnimation } from '../workoutAnim/WorkoutAnimation';

type Props = {
  card: ChatCard;
  onShowExercise: (name: string, detail: string) => void;
  onMarkComplete: () => void;
  onConfirmMemory: (memoryId: string) => void;
};

export function ChatCardView({ card, onShowExercise, onMarkComplete, onConfirmMemory }: Props) {
  switch (card.type) {
    case 'meal_logged':
      return (
        <InfoCard icon="restaurant" color={tints.calorie} title={`Logged ${card.name}`}>
          <Text style={styles.sub}>
            {card.calories} kcal · {card.protein}g protein{card.quantity !== 1 ? ` · x${card.quantity}` : ''}
            {card.mealType ? ` · ${card.mealType}` : ''}
          </Text>
        </InfoCard>
      );

    case 'workout_complete':
      return (
        <InfoCard icon="barbell" color={tints.workout} title="Workout complete 💪">
          <Text style={styles.sub}>{card.exercises.join(', ')}</Text>
          <Text style={styles.sub}>
            {card.caloriesBurned} kcal · {card.durationMin} min
          </Text>
        </InfoCard>
      );

    case 'water_logged':
      return (
        <InfoCard icon="water" color={tints.water} title={`Water +${card.amountMl}ml`}>
          <Text style={styles.sub}>Today: {card.totalMl}ml</Text>
        </InfoCard>
      );

    case 'transaction':
      return (
        <InfoCard icon="wallet" color={tints.spend} title={`${card.txType === 'income' ? 'Income' : 'Expense'} ${inr(card.amount)}`}>
          <Text style={styles.sub}>{card.category}</Text>
        </InfoCard>
      );

    case 'gold':
      return (
        <InfoCard icon="diamond" color={tints.gold} title={`${card.grams}g ${card.category}`}>
          <Text style={styles.sub}>@ {inr(card.buyPrice)}/g</Text>
        </InfoCard>
      );

    case 'profile_updated':
      return (
        <InfoCard icon="person" color={colors.accent} title="Profile updated">
          <Text style={styles.sub}>{formatFields(card.fields)}</Text>
        </InfoCard>
      );

    case 'plan':
      return (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
            <Text style={styles.title}>Your personalized plan</Text>
          </View>
          <Text style={styles.summary}>{card.summary}</Text>
          <View style={styles.chips}>
            <Pill label={`BMI ${card.bmi}`} />
            <Pill label={card.goal} />
            <Pill label={`Fasting ${card.fastingPlan}`} />
          </View>
        </Card>
      );

    case 'exercise': {
      const info = findExerciseInfo(card.name);
      return (
        <Card style={styles.card}>
          <Text style={styles.exerciseName}>{info?.name ?? card.name}</Text>
          {card.detail ? <Text style={styles.sub}>{card.detail}</Text> : null}
          <View style={styles.gifFallback}>
            <WorkoutAnimation name={card.name} size={150} />
          </View>
          <View style={styles.actions}>
            <AppButton label="How to" icon="information-circle" variant="outline" style={styles.flex} onPress={() => onShowExercise(card.name, card.detail)} />
            <AppButton label="Mark done" icon="checkmark" style={styles.flex} onPress={onMarkComplete} />
          </View>
        </Card>
      );
    }

    case 'memory_prompt':
      return (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="bookmark" size={18} color={colors.accent} />
            <Text style={styles.title}>Remember this?</Text>
          </View>
          <Text style={styles.summary}>“{card.content}”</Text>
          <View style={styles.actions}>
            <AppButton label="Yes, remember" icon="checkmark" style={styles.flex} onPress={() => onConfirmMemory(card.id)} />
          </View>
        </Card>
      );

    default:
      return null;
  }
}

function InfoCard({
  icon,
  color,
  title,
  children
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      {children ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function formatFields(fields: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    weightKg: 'Weight',
    heightCm: 'Height',
    fitnessGoal: 'Goal',
    calorieTarget: 'Calories',
    waterGoalMl: 'Water goal',
    monthlyBudget: 'Budget',
    sleepTime: 'Sleep',
    gymTime: 'Gym',
    runningTime: 'Running',
    fastingPlan: 'Fasting'
  };
  return Object.entries(fields)
    .map(([k, v]) => `${labels[k] ?? k}: ${v}`)
    .join(' · ');
}

const styles = StyleSheet.create({
  card: { gap: 8, marginTop: 4 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  iconBadge: { alignItems: 'center', borderRadius: 9, height: 28, justifyContent: 'center', width: 28 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800', flex: 1 },
  body: { gap: 2 },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  summary: { color: colors.text, fontSize: 14, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  gif: { aspectRatio: 1, backgroundColor: colors.surfaceAlt, borderRadius: 12, width: '100%' },
  gifFallback: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flex: { flex: 1 }
});
