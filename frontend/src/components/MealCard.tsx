import { Text, View, StyleSheet } from 'react-native';

import { colors } from '../constants/theme';
import { Meal } from '../types';
import { Card } from './Card';
import { DietIndicator } from './DietIndicator';

type Props = {
  meal: Meal;
  onPress: () => void;
};

export function MealCard({ meal, onPress }: Props) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.left}>
        <DietIndicator diet={meal.diet} />
        <View>
          <Text style={styles.name}>{meal.name}</Text>
          <Text style={styles.meta}>{meal.type}</Text>
        </View>
      </View>
      <View style={styles.nutrition}>
        <Text style={styles.kcal}>{meal.calories} kcal</Text>
        <Text style={styles.meta}>{meal.protein}g protein</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 10
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4
  },
  nutrition: {
    alignItems: 'flex-end'
  },
  kcal: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800'
  }
});
