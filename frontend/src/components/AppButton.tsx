import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = 'filled', icon, style, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === 'filled' ? colors.background : colors.accent} /> : null}
      <Text style={[styles.label, variant !== 'filled' && styles.outlineLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16
  },
  filled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.accent
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  label: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700'
  },
  outlineLabel: {
    color: colors.accent
  },
  pressed: {
    opacity: 0.8
  },
  disabled: {
    opacity: 0.4
  }
});
