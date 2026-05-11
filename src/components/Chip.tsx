import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  active: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  activeLabel: {
    color: colors.background
  }
});
