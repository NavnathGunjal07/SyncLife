import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet
} from 'react-native';

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
 *
 * Runs its own backdrop fade + sheet spring (Modal's animationType slides the
 * backdrop too, which looks flat) and keeps inputs above the keyboard.
 */
export function AppBottomSheet({ visible, children, onClose }: Props) {
  // Keep the Modal mounted until the exit animation finishes.
  const [mounted, setMounted] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 1, damping: 24, stiffness: 260, mass: 0.9, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      ]).start(() => setMounted(false));
    }
  }, [backdrop, slide, visible]);

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [640, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Animated.View style={styles.indicator} />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
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
