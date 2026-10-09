import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../constants/theme';

type Props = Omit<TextInputProps, 'secureTextEntry'> & { invalid?: boolean };

/** Password field with a show/hide toggle. */
export const PasswordInput = forwardRef<TextInput, Props>(function PasswordInput({ style, invalid, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.wrap, invalid && styles.invalid]}>
      <TextInput
        ref={ref}
        {...rest}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={10}
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row'
  },
  invalid: { borderColor: colors.danger },
  input: { color: colors.text, flex: 1, fontSize: 16, padding: 14 },
  toggle: { paddingHorizontal: 14, paddingVertical: 12 }
});
