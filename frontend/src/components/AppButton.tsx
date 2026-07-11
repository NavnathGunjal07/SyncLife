import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
};

export function AppButton({ label, onPress, variant = 'filled', icon, style, disabled, loading }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const blocked = disabled || loading;
  const contentColor = variant === 'filled' ? colors.background : colors.accent;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(blocked), busy: Boolean(loading) }}
      disabled={blocked}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[styles.base, styles[variant], disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={contentColor} />
      ) : null}
      <Text style={[styles.label, variant !== 'filled' && styles.outlineLabel]}>{label}</Text>
    </AnimatedPressable>
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
  disabled: {
    opacity: 0.4
  }
});
