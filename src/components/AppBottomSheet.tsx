import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { ReactNode, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  visible: boolean;
  children: ReactNode;
  onClose: () => void;
};

export function AppBottomSheet({ visible, children, onClose }: Props) {
  const ref = useRef<unknown>(null);
  const snapPoints = useMemo(() => ['40%', '90%'], []);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={ref}
      index={0}
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
