import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Chip } from '../components/Chip';
import { MealCard } from '../components/MealCard';
import { ProgressRing } from '../components/ProgressRing';
import { MEALS, MEAL_TYPES } from '../constants/meals';
import { colors } from '../constants/theme';
import { useCalories } from '../hooks/useCalories';
import { useMealsStore } from '../store/meals';
import { Meal, MealType } from '../types';

export function MealsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<MealType>('Breakfast');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Meal | null>(null);
  const [quantity, setQuantity] = useState(1);
  const totals = useCalories();
  const addMeal = useMealsStore((state) => state.addMeal);
  const mealsLogged = useMealsStore((state) => state.logs.filter((log) => log.date === new Date().toISOString().slice(0, 10)).length);

  const filtered = useMemo(
    () => MEALS.filter((meal) => meal.type === tab && meal.name.toLowerCase().includes(query.toLowerCase())),
    [query, tab]
  );

  const addSelected = async () => {
    if (!selected) return;
    await addMeal(selected, quantity);
    Toast.show({ type: 'success', text1: `${selected.name} logged` });
    setSelected(null);
    setQuantity(1);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Meals</Text>
            <Text style={styles.muted}>{totals.calories} kcal · {totals.protein}g protein · {mealsLogged} meals</Text>
          </View>
          <ProgressRing value={totals.progress} size={92} label={`${Math.round(totals.progress)}%`} sublabel="goal" />
        </View>
        <View style={styles.tabs}>{MEAL_TYPES.map((type) => <Chip key={type} label={type} active={tab === type} onPress={() => setTab(type)} />)}</View>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search meals" placeholderTextColor={colors.textMuted} style={styles.input} />
        <View style={styles.stack}>{filtered.map((meal) => <MealCard key={meal.id} meal={meal} onPress={() => setSelected(meal)} />)}</View>
      </ScrollView>

      <AppBottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selected.name}</Text>
            <Text style={styles.muted}>{Math.round(selected.calories * quantity)} kcal · {Math.round(selected.protein * quantity)}g protein</Text>
            <View style={styles.stepper}>
              <AppButton label="-" variant="outline" onPress={() => setQuantity((value) => Math.max(0.5, value - 0.5))} />
              <Text style={styles.quantity}>{quantity}x</Text>
              <AppButton label="+" variant="outline" onPress={() => setQuantity((value) => value + 0.5)} />
            </View>
            <AppButton label="Add to log" icon="add" onPress={() => void addSelected()} />
          </View>
        ) : null}
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 16, paddingBottom: 96 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 16, padding: 14 },
  stack: { gap: 10 },
  sheet: { gap: 18 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center' },
  quantity: { color: colors.text, fontSize: 24, fontWeight: '900', minWidth: 64, textAlign: 'center' }
});
