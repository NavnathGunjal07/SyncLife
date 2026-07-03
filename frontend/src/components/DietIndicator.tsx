import { StyleSheet, View } from 'react-native';

import { MealDiet } from '../types';

// The familiar Indian packaged-food mark: a bordered square with a filled dot.
// Green = veg, amber = contains egg, red = non-veg.
const DIET_COLOR: Record<MealDiet, string> = {
  veg: '#22C55E',
  egg: '#F59E0B',
  nonveg: '#EF4444'
};

export function DietIndicator({ diet, size = 16 }: { diet: MealDiet; size?: number }) {
  const color = DIET_COLOR[diet];
  const dot = Math.round(size * 0.5);
  return (
    <View style={[styles.box, { width: size, height: size, borderColor: color }]}>
      <View style={{ backgroundColor: color, borderRadius: dot / 2, height: dot, width: dot }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center'
  }
});
