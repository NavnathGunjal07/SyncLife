import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  visible: boolean;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Lightweight bottom sheet built on React Native's built-in Modal.
 *
 * Replaces @gorhom/bottom-sheet so the app has no dependency on
 * react-native-reanimated / react-native-worklets, which require a matching
 * native module version and break in Expo Go on version skew.
 */
export function AppBottomSheet({ visible, children, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.indicator} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    paddingTop: 10
  },
  indicator: {
    alignSelf: 'center',
    backgroundColor: colors.textMuted,
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    width: 44
  },
  content: {
    padding: 20
  }
});
