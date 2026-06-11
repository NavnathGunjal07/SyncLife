import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  visible: boolean;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Wrapper around @gorhom/bottom-sheet.
 *
 * Important: @gorhom/bottom-sheet must always remain mounted — toggling
 * visibility via snapToIndex(-1) / snapToIndex(0) instead of conditional
 * rendering, to preserve snap animations and avoid crashes.
 */
export function AppBottomSheet({ visible, children, onClose }: Props) {
  // BottomSheet is a class component — use the instance type directly
  const ref = useRef<typeof BottomSheet.prototype>(null);
  const snapPoints = useMemo(() => ['45%', '90%'], []);

  useEffect(() => {
    if (visible) {
      ref.current?.snapToIndex(0);
    } else {
      ref.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface
  },
  content: {
    padding: 20
  },
  indicator: {
    backgroundColor: colors.textMuted
  }
});
