import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { MealCard } from '../components/MealCard';
import { ProgressRing } from '../components/ProgressRing';
import { QuoteCard } from '../components/QuoteCard';
import { DietIndicator } from '../components/DietIndicator';
import { MEAL_TYPES, mealsForPreference } from '../constants/meals';
import { colors } from '../constants/theme';
import { useCalories } from '../hooks/useCalories';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { fetchMealHistory, parseMeal } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useMealsStore } from '../store/meals';
import { Meal, MealDiet, MealHistoryItem, MealType, ParsedMeal } from '../types';
import { toISODate } from '../utils/date';

const tabs = ['Log', 'History'] as const;
const dietFilterLabel: Record<MealDiet, string> = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' };

function dateLabel(date: string): string {
  if (date === toISODate()) return 'Today';
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function MealsScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.accessToken);
  const dietaryPreference = useAuthStore((state) => state.profile.dietaryPreference);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Log');
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [dietFilter, setDietFilter] = useState<MealDiet | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Meal | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [draft, setDraft] = useState<ParsedMeal | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { quote, gradient } = useRotatingQuote();
  const totals = useCalories();
  const addMeal = useMealsStore((state) => state.addMeal);
  const addCustomMeal = useMealsStore((state) => state.addCustomMeal);
  const todayLogged = useMealsStore(
    (state) => state.logs.filter((log) => log.date === toISODate()).length
  );

  // Catalog restricted to what the user's dietary preference allows.
  const allowedMeals = useMemo(() => mealsForPreference(dietaryPreference), [dietaryPreference]);
  // Diet sub-filters worth showing (only those the preference actually permits).
  const dietOptions = useMemo(() => {
    const present = [...new Set(allowedMeals.map((m) => m.diet))];
    return present.length > 1 ? (['all', ...present] as const) : [];
  }, [allowedMeals]);

  const filtered = useMemo(
    () =>
      allowedMeals.filter(
        (meal) =>
          meal.type === mealType &&
          (dietFilter === 'all' || meal.diet === dietFilter) &&
          meal.name.toLowerCase().includes(query.toLowerCase())
      ),
    [allowedMeals, query, mealType, dietFilter]
  );

  const loadHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const { logs } = await fetchMealHistory(token, 200);
      setHistory(logs);
    } catch {
      // keep whatever we have
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'History') void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // A stale sub-filter (e.g. "Non-veg" after switching to a veg diet) would hide
  // everything — reset to "All" whenever the dietary preference changes.
  useEffect(() => {
    setDietFilter('all');
  }, [dietaryPreference]);

  const grouped = useMemo(() => {
    const map = new Map<string, MealHistoryItem[]>();
    for (const item of history) map.set(item.date, [...(map.get(item.date) ?? []), item]);
    return [...map.entries()];
  }, [history]);

  const askAi = async () => {
    const text = aiText.trim();
    if (!text || !token) return;
    setAiLoading(true);
    try {
      const { meal } = await parseMeal(token, text);
      setDraft(meal);
      setAiText('');
    } catch (error) {
      Toast.show({ type: 'error', text1: "Couldn't read that", text2: error instanceof Error ? error.message : 'Try again.' });
    } finally {
      setAiLoading(false);
    }
  };

  const addSelected = async () => {
    if (!selected) return;
    await addMeal(selected, quantity);
    Toast.show({ type: 'success', text1: `${selected.name} logged` });
    setSelected(null);
    setQuantity(1);
  };

  const saveDraft = async () => {
    if (!draft) return;
    await addCustomMeal({
      name: draft.name.trim() || 'Meal',
      mealType: draft.mealType,
      calories: draft.calories,
      protein: draft.protein,
      quantity: draft.quantity
    });
    Toast.show({ type: 'success', text1: `${draft.name} logged` });
    setDraft(null);
  };

  const updateDraft = (patch: Partial<ParsedMeal>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Meals</Text>
            <Text style={styles.muted}>{totals.calories} kcal · {totals.protein}g protein · {todayLogged} today</Text>
          </View>
          <ProgressRing value={totals.progress} size={92} label={`${Math.round(totals.progress)}%`} sublabel="goal" />
        </View>

        <QuoteCard quote={quote} gradient={gradient} variant="compact" label="Eat well" />

        <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

        {tab === 'Log' ? (
          <>
            {/* AI free-text entry — log anything, not just the fixed list */}
            <Card style={styles.aiCard}>
              <Text style={styles.aiTitle}>Tell me what you ate</Text>
              <Text style={styles.aiHint}>e.g. “2 rotis with paneer and a bowl of dal”</Text>
              <View style={styles.aiRow}>
                <TextInput
                  value={aiText}
                  onChangeText={setAiText}
                  placeholder="Describe your meal…"
                  placeholderTextColor={colors.textMuted}
                  style={styles.aiInput}
                  onSubmitEditing={() => void askAi()}
                  returnKeyType="done"
                  editable={!aiLoading}
                />
                <Pressable style={[styles.aiSend, (!aiText.trim() || aiLoading) && styles.disabled]} onPress={() => void askAi()} disabled={!aiText.trim() || aiLoading}>
                  {aiLoading ? <ActivityIndicator color={colors.background} /> : <Ionicons name="sparkles" size={20} color={colors.background} />}
                </Pressable>
              </View>
            </Card>

            <View style={styles.tabs}>{MEAL_TYPES.map((type) => <Chip key={type} label={type} active={mealType === type} onPress={() => setMealType(type)} />)}</View>
            {dietOptions.length ? (
              <View style={styles.tabs}>
                {dietOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option === 'all' ? 'All' : dietFilterLabel[option]}
                    active={dietFilter === option}
                    onPress={() => setDietFilter(option)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>Showing {dietaryPreference} meals · change your diet in Profile.</Text>
            )}
            <TextInput value={query} onChangeText={setQuery} placeholder="Search saved meals" placeholderTextColor={colors.textMuted} style={styles.input} />
            <View style={styles.stack}>
              {filtered.length ? (
                filtered.map((meal) => <MealCard key={meal.id} meal={meal} onPress={() => setSelected(meal)} />)
              ) : (
                <Text style={styles.muted}>No {mealType.toLowerCase()} options here. Try another type, or describe your meal above.</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.stack}>
            {historyLoading && history.length === 0 ? (
              <ActivityIndicator color={colors.accent} style={styles.loader} />
            ) : grouped.length === 0 ? (
              <EmptyState icon="restaurant-outline" title="No meals logged yet" hint="Log one from the Log tab and it'll show up here." />
            ) : (
              grouped.map(([date, items]) => {
                const dayKcal = items.reduce((sum, m) => sum + m.totalCalories, 0);
                const dayProtein = items.reduce((sum, m) => sum + m.totalProtein, 0);
                return (
                  <Card key={date} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>{dateLabel(date)}</Text>
                      <Text style={styles.dayTotal}>{Math.round(dayKcal)} kcal · {Math.round(dayProtein)}g</Text>
                    </View>
                    {items.map((m) => (
                      <View key={m.id} style={styles.mealRow}>
                        <Text style={styles.mealName} numberOfLines={1}>{m.mealName || 'Meal'}</Text>
                        <Text style={styles.mealMeta}>{m.mealType ? `${m.mealType} · ` : ''}{Math.round(m.totalCalories)} kcal</Text>
                      </View>
                    ))}
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Catalog meal sheet */}
      <AppBottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.sheet}>
            <View style={styles.sheetTitleRow}>
              <DietIndicator diet={selected.diet} size={18} />
              <Text style={styles.sheetTitle}>{selected.name}</Text>
            </View>
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

      {/* AI draft confirm sheet — editable before saving */}
      <AppBottomSheet visible={Boolean(draft)} onClose={() => setDraft(null)}>
        {draft ? (
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm meal</Text>
            {!draft.estimated ? <Text style={styles.warn}>I couldn't estimate calories — please fill them in.</Text> : null}
            <View>
              <Text style={styles.label}>Name</Text>
              <TextInput value={draft.name} onChangeText={(t) => updateDraft({ name: t })} style={styles.input} placeholderTextColor={colors.textMuted} />
            </View>
            <View>
              <Text style={styles.label}>Meal type</Text>
              <View style={styles.tabs}>{MEAL_TYPES.map((type) => <Chip key={type} label={type} active={draft.mealType === type} onPress={() => updateDraft({ mealType: type })} />)}</View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroField}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  value={String(draft.calories)}
                  onChangeText={(t) => updateDraft({ calories: Number(t.replace(/[^0-9]/g, '')) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  value={String(draft.protein)}
                  onChangeText={(t) => updateDraft({ protein: Number(t.replace(/[^0-9]/g, '')) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
            <AppButton label="Add to log" icon="add" onPress={() => void saveDraft()} />
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
  loader: { marginTop: 24 },
  aiCard: { gap: 10 },
  aiTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  aiHint: { color: colors.textMuted, fontSize: 13 },
  aiRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  aiInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    padding: 12
  },
  aiSend: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  disabled: { opacity: 0.4 },
  dayCard: { gap: 10 },
  dayHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  dayTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  dayTotal: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  mealRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  mealName: { color: colors.text, flex: 1, fontSize: 15 },
  mealMeta: { color: colors.textMuted, fontSize: 13 },
  sheet: { gap: 16 },
  sheetTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '900', flexShrink: 1 },
  warn: { color: colors.warning, fontSize: 13 },
  label: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroField: { flex: 1 },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center' },
  quantity: { color: colors.text, fontSize: 24, fontWeight: '900', minWidth: 64, textAlign: 'center' }
});
