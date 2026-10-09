import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { QuoteCard } from '../components/QuoteCard';
import { EXPENSE_CATEGORIES, GOLD_CATEGORIES, INCOME_CATEGORIES } from '../constants/finance';
import { colors } from '../constants/theme';
import { useRotatingQuote } from '../hooks/useRotatingQuote';
import { useFinanceStore } from '../store/finance';
import { useGoldStore } from '../store/gold';
import { GoldCategory, TransactionType } from '../types';
import { inr } from '../utils/formatters';

const tabs = ['Expenses', 'Income', 'Summary', 'Gold'] as const;

export function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Expenses');
  const { quote: financeQuote, gradient: financeGradient } = useRotatingQuote('finance');
  const [sheet, setSheet] = useState<'transaction' | 'gold' | null>(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] ?? 'Other');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [goldCategory, setGoldCategory] = useState<GoldCategory>('Jewellery');
  const [grams, setGrams] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const transactions = useFinanceStore((state) => state.transactions);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const dailySpend = useFinanceStore((state) => state.totalForDate('expense'));
  const monthlyExpense = useFinanceStore((state) => state.monthlyTotal('expense'));
  const monthlyIncome = useFinanceStore((state) => state.monthlyTotal('income'));
  const addGoldEntry = useGoldStore((state) => state.addGoldEntry);
  const holdings = useGoldStore((state) => state.holdings());

  const expenses = useMemo(() => transactions.filter((tx) => tx.type === 'expense').slice().reverse(), [transactions]);
  const incomes = useMemo(() => transactions.filter((tx) => tx.type === 'income').slice().reverse(), [transactions]);

  const expenseBreakdown = useMemo(() => {
    const grouped = EXPENSE_CATEGORIES.map((item) => ({
      x: item,
      y: transactions.filter((tx) => tx.type === 'expense' && tx.category === item).reduce((sum, tx) => sum + tx.amount, 0)
    })).filter((item) => item.y > 0);
    return grouped.length ? grouped : [{ x: 'No data', y: 1 }];
  }, [transactions]);

  const openTransaction = (type: TransactionType) => {
    setCategory(type === 'expense' ? EXPENSE_CATEGORIES[0] ?? 'Other' : INCOME_CATEGORIES[0] ?? 'Salary');
    setAmount('');
    setNotes('');
    setSheet('transaction');
  };

  const saveTransaction = async () => {
    const type: TransactionType = tab === 'Income' ? 'income' : 'expense';
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount', text2: 'Amount should be a number greater than 0.' });
      return;
    }
    await addTransaction({ type, category, amount: value, notes });
    Toast.show({ type: 'success', text1: `${type === 'expense' ? 'Expense' : 'Income'} saved` });
    setSheet(null);
  };

  const saveGold = async () => {
    const goldGrams = Number(grams);
    const price = Number(buyPrice);
    if (!Number.isFinite(goldGrams) || goldGrams <= 0 || !Number.isFinite(price) || price <= 0) {
      Toast.show({ type: 'error', text1: 'Check grams and buy price', text2: 'Both should be numbers greater than 0.' });
      return;
    }
    await addGoldEntry({ category: goldCategory, grams: goldGrams, buyPrice: price });
    Toast.show({ type: 'success', text1: 'Gold entry saved' });
    setSheet(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Finance</Text>
        <QuoteCard quote={financeQuote} gradient={financeGradient} variant="compact" label="Money wisdom" />
        <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

        {tab === 'Expenses' ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>Today's spend</Text>
              <Text style={styles.metric}>{inr(dailySpend)}</Text>
            </Card>
            <AppButton label="Add expense" icon="remove-circle" onPress={() => openTransaction('expense')} />
            {expenses.length ? expenses.map((tx) => (
              <Card key={tx.id} style={styles.row}>
                <View><Text style={styles.cardTitle}>{tx.category}</Text><Text style={styles.muted}>{tx.notes || tx.date}</Text></View>
                <Text style={styles.metricSmall}>{inr(tx.amount)}</Text>
              </Card>
            )) : <EmptyState icon="receipt-outline" title="No expenses yet" hint="Add one to start tracking your daily spend." />}
          </>
        ) : null}

        {tab === 'Income' ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>Monthly income</Text>
              <Text style={styles.metric}>{inr(monthlyIncome)}</Text>
            </Card>
            <AppButton label="Add income" icon="add-circle" onPress={() => openTransaction('income')} />
            {incomes.length ? incomes.map((tx) => (
              <Card key={tx.id} style={styles.row}>
                <View><Text style={styles.cardTitle}>{tx.category}</Text><Text style={styles.muted}>{tx.notes || tx.date}</Text></View>
                <Text style={styles.metricSmall}>{inr(tx.amount)}</Text>
              </Card>
            )) : <EmptyState icon="cash-outline" title="No income recorded" hint="Add salary or other income to see your monthly net." />}
          </>
        ) : null}

        {tab === 'Summary' ? (
          <>
            <View style={styles.grid}>
              <Card style={styles.half}><Text style={styles.cardTitle}>Monthly expense</Text><Text style={styles.metricSmall}>{inr(monthlyExpense)}</Text></Card>
              <Card style={styles.half}><Text style={styles.cardTitle}>Net</Text><Text style={styles.metricSmall}>{inr(monthlyIncome - monthlyExpense)}</Text></Card>
            </View>
            <Card>
              <Text style={styles.cardTitle}>Expense breakdown</Text>
              {expenseBreakdown[0]?.x === 'No data' ? (
                <Text style={styles.muted}>No expenses this month.</Text>
              ) : (
                <View style={styles.breakdown}>
                  {expenseBreakdown.map((item, idx) => {
                    const total = expenseBreakdown.reduce((s, d) => s + d.y, 0);
                    const pct = total > 0 ? Math.round((item.y / total) * 100) : 0;
                    const barColors = [colors.accent, '#38BDF8', '#8B6CFF', '#FFB81F', '#F87171', '#FACC15', colors.textMuted];
                    return (
                      <View key={item.x} style={styles.breakdownRow}>
                        <View style={styles.breakdownLabel}>
                          <View style={[styles.dot, { backgroundColor: barColors[idx % barColors.length] }]} />
                          <Text style={styles.muted}>{item.x}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { width: `${pct}%`, backgroundColor: barColors[idx % barColors.length] }]} />
                        </View>
                        <Text style={styles.pct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </>
        ) : null}

        {tab === 'Gold' ? (
          <>
            <AppButton label="Add gold entry" icon="add" onPress={() => setSheet('gold')} />
            {holdings.length ? holdings.map((holding) => (
              <Card key={holding.category}>
                <Text style={styles.cardTitle}>{holding.category}</Text>
                <Text style={styles.metric}>{holding.totalGrams.toFixed(2)}g</Text>
                <Text style={styles.muted}>Avg {inr(holding.avgBuyPrice)}/g · Value {inr(holding.currentValue)} · P&L {inr(holding.pnl)}</Text>
              </Card>
            )) : <EmptyState icon="diamond-outline" title="No gold holdings yet" hint="Add an entry to start tracking value and P&L." />}
          </>
        ) : null}
      </ScrollView>

      <AppBottomSheet visible={sheet === 'transaction'} onClose={() => setSheet(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{tab === 'Income' ? 'Add income' : 'Add expense'}</Text>
          <View style={styles.tabs}>{(tab === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((item) => <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}</View>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor={colors.textMuted} style={styles.input} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Notes" placeholderTextColor={colors.textMuted} style={styles.input} />
          <AppButton label="Save" icon="save" onPress={() => void saveTransaction()} />
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={sheet === 'gold'} onClose={() => setSheet(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add gold</Text>
          <View style={styles.tabs}>{GOLD_CATEGORIES.map((item) => <Chip key={item} label={item} active={goldCategory === item} onPress={() => setGoldCategory(item)} />)}</View>
          <TextInput value={grams} onChangeText={setGrams} keyboardType="numeric" placeholder="Grams" placeholderTextColor={colors.textMuted} style={styles.input} />
          <TextInput value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" placeholder="Buy price ₹/g" placeholderTextColor={colors.textMuted} style={styles.input} />
          <AppButton label="Save gold" icon="save" onPress={() => void saveGold()} />
        </View>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  metric: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 8 },
  metricSmall: { color: colors.text, fontSize: 18, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  center: { alignItems: 'center' },
  sheet: { gap: 14 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, padding: 12 },
  breakdown: { gap: 10, marginTop: 12 },
  breakdownRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  breakdownLabel: { alignItems: 'center', flexDirection: 'row', gap: 6, width: 90 },
  dot: { borderRadius: 6, height: 10, width: 10 },
  barTrack: { flex: 1, backgroundColor: colors.surface, borderRadius: 4, height: 8 },
  bar: { borderRadius: 4, height: 8 },
  pct: { color: colors.textMuted, fontSize: 12, textAlign: 'right', width: 36 }
});
