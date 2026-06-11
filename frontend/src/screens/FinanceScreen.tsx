import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { VictoryPie } from 'victory-native';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EXPENSE_CATEGORIES, GOLD_CATEGORIES, INCOME_CATEGORIES } from '../constants/finance';
import { colors } from '../constants/theme';
import { useFinanceStore } from '../store/finance';
import { useGoldStore } from '../store/gold';
import { GoldCategory, TransactionType } from '../types';
import { inr } from '../utils/formatters';

const tabs = ['Expenses', 'Income', 'Summary', 'Gold'] as const;

export function FinanceScreen() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Expenses');
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
    if (!value) return;
    await addTransaction({ type, category, amount: value, notes });
    Toast.show({ type: 'success', text1: `${type === 'expense' ? 'Expense' : 'Income'} saved` });
    setSheet(null);
  };

  const saveGold = async () => {
    const goldGrams = Number(grams);
    const price = Number(buyPrice);
    if (!goldGrams || !price) return;
    await addGoldEntry({ category: goldCategory, grams: goldGrams, buyPrice: price });
    Toast.show({ type: 'success', text1: 'Gold entry saved' });
    setSheet(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Finance</Text>
        <View style={styles.tabs}>{tabs.map((item) => <Chip key={item} label={item} active={tab === item} onPress={() => setTab(item)} />)}</View>

        {tab === 'Expenses' ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>Today's spend</Text>
              <Text style={styles.metric}>{inr(dailySpend)}</Text>
            </Card>
            <AppButton label="Add expense" icon="remove-circle" onPress={() => openTransaction('expense')} />
            {transactions.filter((tx) => tx.type === 'expense').slice().reverse().map((tx) => (
              <Card key={tx.id} style={styles.row}>
                <View><Text style={styles.cardTitle}>{tx.category}</Text><Text style={styles.muted}>{tx.notes || tx.date}</Text></View>
                <Text style={styles.metricSmall}>{inr(tx.amount)}</Text>
              </Card>
            ))}
          </>
        ) : null}

        {tab === 'Income' ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>Monthly income</Text>
              <Text style={styles.metric}>{inr(monthlyIncome)}</Text>
            </Card>
            <AppButton label="Add income" icon="add-circle" onPress={() => openTransaction('income')} />
            {transactions.filter((tx) => tx.type === 'income').slice().reverse().map((tx) => (
              <Card key={tx.id} style={styles.row}>
                <View><Text style={styles.cardTitle}>{tx.category}</Text><Text style={styles.muted}>{tx.notes || tx.date}</Text></View>
                <Text style={styles.metricSmall}>{inr(tx.amount)}</Text>
              </Card>
            ))}
          </>
        ) : null}

        {tab === 'Summary' ? (
          <>
            <View style={styles.grid}>
              <Card style={styles.half}><Text style={styles.cardTitle}>Monthly expense</Text><Text style={styles.metricSmall}>{inr(monthlyExpense)}</Text></Card>
              <Card style={styles.half}><Text style={styles.cardTitle}>Net</Text><Text style={styles.metricSmall}>{inr(monthlyIncome - monthlyExpense)}</Text></Card>
            </View>
            <Card style={styles.center}>
              <Text style={styles.cardTitle}>Expense breakdown</Text>
              <VictoryPie
                data={expenseBreakdown}
                width={320}
                height={260}
                colorScale={[colors.accent, colors.warning, '#38BDF8', '#A78BFA', '#F472B6', '#F87171', '#FACC15', colors.textMuted]}
                innerRadius={62}
                style={{ labels: { fill: colors.text, fontSize: 12 } }}
              />
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
            )) : <Text style={styles.muted}>No gold holdings yet.</Text>}
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
  input: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, padding: 12 }
});
