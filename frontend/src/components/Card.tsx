import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { colors } from '../constants/theme';

type CardProps = ViewProps & {
  onPress?: () => void;
};

export function Card({ children, style, onPress, ...props }: CardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]} {...props}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  pressed: {
    opacity: 0.78
  }
});
