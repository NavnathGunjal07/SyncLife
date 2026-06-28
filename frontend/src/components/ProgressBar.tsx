import { StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';
import { clamp } from '../utils/formatters';

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamp(value)}%` }, color ? { backgroundColor: color } : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%'
  }
});
