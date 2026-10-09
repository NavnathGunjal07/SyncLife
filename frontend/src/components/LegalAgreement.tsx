import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Required "I agree to the Terms and Privacy Policy" checkbox with links to both. */
export function LegalAgreement({ checked, onChange }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
        hitSlop={8}
        onPress={() => onChange(!checked)}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
      </Pressable>
      <Text style={styles.text} onPress={() => onChange(!checked)}>
        I'm at least 13 and I agree to the{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
          Privacy Policy
        </Text>
        , including that my health, finance and coach-chat data is stored to run the app and coach messages are processed by
        an AI provider.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  box: {
    alignItems: 'center',
    borderColor: colors.textMuted,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 19 },
  link: { color: colors.accent, fontWeight: '700' }
});
